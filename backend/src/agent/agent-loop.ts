import "dotenv/config";
import Groq from "groq-sdk";
import { toolSchemas } from "./tool-schemas.js";
import { checkSpendingLimit,checkReceiptRequired,checkDuplicateSubmission,viewPurchaseHistory } from "./tools.js";
import {verdictSchema} from "./verdict-schema.js";
import {connectToDatabase} from "../db/connect.js";
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
    userId:"user_123",
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
  });

  const firstMessage = firstResponse.choices[0].message;
  messages.push(firstMessage); // add Groq's tool-call request to the conversation

  // Execute each requested tool for real, and add the result to the conversation
  if (firstMessage.tool_calls) {
    for (const toolCall of firstMessage.tool_calls) {
      const fnName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log(`Executing tool: ${fnName}(${JSON.stringify(args)})`);

      const result =await toolImplementations[fnName](args);
      console.log(`Result:`, result);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Second call — Groq now has real tool results, asked for a final answer
  messages.push({
    role: "user",
    content:
      "Based on the tool results, respond with ONLY a JSON object (no other text) in this exact shape: " +
      `{ "decision": "auto-approved" | "flagged" | "rejected", "confidence": number between 0 and 1, "reasoning": string, "flaggedRules": string[] optional }`,
  });
  const secondResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    //tools: toolSchemas,
    response_format:{type:"json_object"}
  });
const rawContent=secondResponse.choices[0].message.content ?? "";
console.log("\nRaw content from Groq:", rawContent);

const parsedJson=JSON.parse(rawContent);
const verdict=verdictSchema.safeParse(parsedJson);

if(!verdict.success){
  console.error("Verdict validation failed:", verdict.error.format());
  return;
}
console.log("\nFinal verdict:", verdict.data)

process.exit(0);
}

main();