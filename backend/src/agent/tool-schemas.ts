

export const toolSchemas=[
    {
        type:"function" as const,
        function:{
            name:"checkSpendingLimit",
            description:"Checks whether an expense amount is within the allowed spending limit for its category. Use this to determine if an expense exceeds company policy for that category.",
            parameters:{
                type:"object",
                properties:{
                    category:{
                        type:"string",
                        description:"The expense category, e.g. Meals, Travel, Equipment, Software, Other.",

                    },
                    amount:{
                        type:"number",
                        description:"The expense amount in dollars",
                    },

                },
                required:["category","amount"],
            },
        },
    },
    {
        type:"function" as const,
        function:{
            name:"checkReceiptRequired",
            description:"Checks whether a receipt is required for this expense amount, and whether one was provided. Use this to determine if missing documentation should affect the decision",
            parameters:{
                type:"object",
                properties:{
                    amount:{
                        type:"number",
                        description:"The expense amount in dollars",
                    },
                    hasReceipt:{
                        type:"boolean",
                        description:"Whether the user has provided a receipt for this expense",
                    },
                },
                required:["amount","hasReceipt"],
            },
        },
    },
    {
    type: "function" as const,
    function: {
      name: "checkDuplicateSubmission",
      description:
        "Checks if this expense looks like a duplicate of a recent submission from the same user (same amount, within a few days). Use this to catch accidental or fraudulent double-submissions.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "The submitting user's ID" },
          amount: { type: "number", description: "The expense amount in dollars" },
          date: { type: "string", description: "The expense date, ISO format (YYYY-MM-DD)" },
        },
        required: ["userId", "amount", "date"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "viewPurchaseHistory",
      description:
        "Returns the user's recent expense history and their flag rate (how often their past submissions were flagged or rejected). Use this to factor in submitter trust — a low flag rate suggests the user is generally reliable.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "The submitting user's ID" },
        },
        required: ["userId"],
      },
    },
  },
]