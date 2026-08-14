import "dotenv/config";
import Groq from "groq-sdk";
import { toolSchemas } from "./tool-schemas.js";
import { checkSpendingLimit, checkReceiptRequired, checkDuplicateSubmission, viewPurchaseHistory } from "./tools.js";
import { Verdict, verdictSchema } from "./verdict-schema.js";
import { connectToDatabase } from "../db/connect.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Maps tool name -> actual function, so we can call the right one
// based on what Groq requested.
const toolImplementations: Record<string, (args: any) => unknown | Promise<unknown>> = {
  checkSpendingLimit: (args) =>
    checkSpendingLimit(args.category, args.amount),
  checkReceiptRequired: (args) =>
    checkReceiptRequired(args.amount, args.hasReceipt),
  checkDuplicateSubmission: (args) =>
    checkDuplicateSubmission(args.userId, args.amount, args.date),
  viewPurchaseHistory: (args) => viewPurchaseHistory(args.userId),
};

async function main() {
  await connectToDatabase();

  const expense = {
    userId: "user_123",
    amount: 75,
    category: "Meals",
    description: "Team lunch with client",
    hasReceipt: false,
    date: "2026-08-11",
  };

  const messages: any[] = [
    {
      role: "system",
      content:
        "You are an expense approval assistant. Use the available tools to check company policy before deciding whether to approve, flag, or reject an expense.",
    },
    {
      role: "user",
      content: `An employee submitted this expense: ${JSON.stringify(expense)}. Evaluate it.`,
    },
  ];

  // First call — Groq decides which tools to use
  const firstResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    tools: toolSchemas,
    tool_choice: "auto",
    temperature: 0.1,
  });

  const firstMessage = firstResponse.choices[0].message;
  messages.push(firstMessage); // add Groq's tool-call request to the conversation

  // Execute each requested tool for real, and add the result to the conversation
  if (firstMessage.tool_calls) {
    for (const toolCall of firstMessage.tool_calls) {
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
  }

  // Ask for a structured verdict, with retries if Groq's output doesn't
  // match our Zod schema.
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
      model: "llama-3.3-70b-versatile",
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
      console.error(`Attempt ${attempt}: Groq did not return valid JSON at all.`);
      messages.push({ role: "assistant", content: rawContent });
      messages.push({
        role: "user",
        content:
          "That was not valid JSON. Respond again with ONLY a valid JSON object, nothing else.",
      });
      continue;
    }

    const result = verdictSchema.safeParse(parsedJson);

    if (result.success) {
      verdict = result.data;
      break; // success, stop retrying
    }

    console.error(
      `Attempt ${attempt}: verdict failed Zod validation:`,
      result.error.issues
    );

    messages.push({ role: "assistant", content: rawContent });
    messages.push({
      role: "user",
      content: `That JSON was invalid: ${JSON.stringify(
        result.error.issues
      )}. Please correct it and respond with ONLY the fixed JSON object.`,
    });
  }

  if (!verdict) {
    console.error("Failed to get a valid verdict after retries. Flagging for manual review.");
    verdict = {
      decision: "flagged",
      confidence: 0,
      reasoning:
        "Agent failed to produce a valid verdict after retries. Flagged for manual review.",
    };
  }

  console.log("\nFinal verdict:", verdict);

  process.exit(0);
}

main();