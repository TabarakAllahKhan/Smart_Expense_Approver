import "dotenv/config";
import Groq from "groq-sdk";
import { toolSchemas } from "./tool-schemas.js";
import { checkSpendingLimit, checkReceiptRequired } from "./tools.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Maps tool name -> actual function, so we can call the right one
// based on what Groq requested.
const toolImplementations: Record<string, (args: any) => unknown> = {
  checkSpendingLimit: (args) =>
    checkSpendingLimit(args.category, args.amount),
  checkReceiptRequired: (args) =>
    checkReceiptRequired(args.amount, args.hasReceipt),
};

async function main() {
  const expense = {
    amount: 75,
    category: "Meals",
    description: "Team lunch with client",
    hasReceipt: false,
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

      const result = toolImplementations[fnName](args);
      console.log(`Result:`, result);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Second call — Groq now has real tool results, asked for a final answer
  const secondResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    tools: toolSchemas,
  });

  const finalMessage = secondResponse.choices[0].message;
  console.log("\nFinal Groq response:");
  console.log(finalMessage.content);
}

main();