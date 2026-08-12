

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
]