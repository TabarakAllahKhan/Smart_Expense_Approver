import "dotenv/config";
import Groq from "groq-sdk";
import { toolSchemas } from "./tool-schemas.js";
import { checkSpendingLimit, checkReceiptRequired, checkDuplicateSubmission, viewPurchaseHistory } from "./tools.js";
import { Verdict, verdictSchema } from "./verdict-schema.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const toolImplementations: Record<string, (args: any) => unknown | Promise<unknown>> = {
  checkSpendingLimit: (args) =>
    checkSpendingLimit(args.category, args.amount),
  checkReceiptRequired: (args) =>
    checkReceiptRequired(args.amount, args.hasReceipt),
  checkDuplicateSubmission: (args) =>
    checkDuplicateSubmission(args.userId, args.amount, args.date),
  viewPurchaseHistory: (args) => viewPurchaseHistory(args.userId),
};

export type ExpenseInput = {
  userId: string;
  amount: number;
  category: string;
  description: string;
  hasReceipt: boolean;
  receiptText?: string;
  date: string;
};

export async function runAgentLoop(expense: ExpenseInput): Promise<Verdict> {
  const messages: any[] = [
    {
      role: "system",
      content: `You are an expense approval assistant. Use the available tools to check company policy before deciding whether to approve, flag, or reject an expense.

The employee's claimed "amount" is the figure to check against company policy (spending limits, receipt thresholds, duplicate checks) — always use the claimed amount, not any figure found in the receipt text, when calling tools.

The "receiptText" field, when present, is independent evidence extracted from the actual uploaded receipt — use it only to verify whether the claimed amount is credible, not as a substitute for it.

Use your own judgment based on the tool results — you are not following a fixed rulebook, you are reasoning about each case individually. That said, here is what each decision category is generally for:

- "auto-approved": the expense is clearly compliant — within policy, no red flags, nothing a manager would need to double check.
- "flagged": something is unusual, borderline, or mildly concerning, but not severe enough to reject outright — this sends it to a manager to use their own judgment. Use this for cases with mitigating context (e.g. over a limit but has a receipt, or a minor policy deviation with a reasonable explanation).
- "rejected": a clear, serious policy violation with no reasonable justification — e.g. a confirmed duplicate submission, or a large expense with no receipt and no mitigating context.

Weigh all the tool results together rather than any single check in isolation.

If receiptText is present, actively cross-check any dollar amounts, dates, or details it contains against the employee's claimed amount, category, and date. Do not state that a receipt "matches" or "supports" the claim unless you have actually compared the specific figures in the receipt text against what was claimed.`,
    },
    {
      role: "user",
      content: `
           An employee submitted this expense claim:
           Claimed amount: $${expense.amount}
           Category: ${expense.category}
           Description: ${expense.description}
           Date: ${expense.date}
           Receipt provided: ${expense.hasReceipt}

           ${expense.receiptText ? `Extracted receipt text (independent evidence, verify against the claim above, do not treat as the claimed amount):\n${expense.receiptText}` : "No receipt text available."}

Evaluate this expense.
      `,
    },
  ];

  const MAX_TOOL_ROUNDS = 4; // safety cap against runaway tool-calling
  let round = 0;

  while (round < MAX_TOOL_ROUNDS) {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages,
      tools: toolSchemas,
      tool_choice: "auto",
      temperature: 0.1,
    });

    const message = response.choices[0].message;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      console.log(`Tool-calling finished after ${round} round(s) — model is ready to give a verdict.`);
      break;
    }

    console.log(`\n--- Tool round ${round + 1} ---`);
    for (const toolCall of message.tool_calls) {
      const fnName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log(`Executing tool: ${fnName}(${JSON.stringify(args)})`);
      const result = await toolImplementations[fnName](args);
      console.log(`Result:`, result);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    round++;
  }

  messages.push({
    role: "user",
    content:
      "Based on the tool results, respond with ONLY a JSON object (no other text) in this exact shape: " +
      `{ "decision": "auto-approved" | "flagged" | "rejected", "confidence": number between 0 and 1, "reasoning": string, "flaggedRules": string[] optional }`,
  });

  const MAX_RETRIES = 2;
  let verdict: Verdict | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const rawContent = response.choices[0].message.content ?? "";
    console.log(`\nAttempt ${attempt} — raw JSON from Groq:`, rawContent);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      console.error(`Attempt ${attempt}: Groq did not return valid JSON.`);
      messages.push({ role: "assistant", content: rawContent });
      messages.push({
        role: "user",
        content: "That was not valid JSON. Respond again with ONLY a valid JSON object, nothing else.",
      });
      continue;
    }

    const result = verdictSchema.safeParse(parsedJson);

    if (result.success) {
      verdict = result.data;
      break;
    }

    console.error(`Attempt ${attempt}: verdict failed Zod validation:`, result.error.issues);
    messages.push({ role: "assistant", content: rawContent });
    messages.push({
      role: "user",
      content: `That JSON was invalid: ${JSON.stringify(result.error.issues)}. Please correct it and respond with ONLY the fixed JSON object.`,
    });
  }

  if (!verdict) {
    console.error("Failed to get a valid verdict after retries. Flagging for manual review.");
    verdict = {
      decision: "flagged",
      confidence: 0,
      reasoning: "Agent failed to produce a valid verdict after retries. Flagged for manual review.",
    };
  }

  return verdict;
}