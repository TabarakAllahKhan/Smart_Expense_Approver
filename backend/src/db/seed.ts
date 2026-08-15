import {connectToDatabase} from "../db/connect";
import {ExpenseRule} from "../models/ExpenseRule";
import {Expense} from "../models/Expense";

const defaultRules = [
  { category: "Meals", spendingLimit: 100, receiptThreshold: 50 },
  { category: "Travel", spendingLimit: 500, receiptThreshold: 50 },
  { category: "Equipment", spendingLimit: 1000, receiptThreshold: 50 },
  { category: "Software", spendingLimit: 200, receiptThreshold: 50 },
  { category: "Other", spendingLimit: 100, receiptThreshold: 50 },
];

const testExpenses=[
    {
    userId: "user_3Hwjh2ih9UpbHHTcdzH2b6u0aDv",
    amount: 75,
    category: "Meals",
    description: "Team lunch",
    hasReceipt: true,
    date: new Date("2026-08-10"),
    decision: "flagged" as const,
    reasoning: "Expense exceeds the standard Meals limit but includes a valid receipt, so flagged for manager review rather than rejected outright.",
    confidence: 0.72,
    flaggedRules: ["spending_limit_exceeded"],
  },
   
   {
    userId: "user_3Hwjh2ih9UpbHHTcdzH2b6u0aDv",
    amount: 190,
    category: "Software",
    description: "Claude Subscription",
    hasReceipt: false,
    date: new Date("2026-08-10"),
    decision: "flagged" as const,
    reasoning: "The expense is with in the company limit but receipt not provided so flagged it for review.",
    confidence: 0.80,
    flaggedRules: ["Receipt Not provided"],
  },
    {
        userId:"user_123",
        amount:200,
        category:"Travel",
        description:"Client visit flight",
        hasReceipt:true,
        date:new Date('2026-07-28'),
        decision:"auto-approved" as const
    }
]
async function seed(){
    await connectToDatabase();
    for(const rule of defaultRules){
        await ExpenseRule.findOneAndUpdate(
            {category:rule.category},
            rule,
            {upsert:true,new:true}
        )
    }

    console.log("seeded default expense rule");

    await Expense.deleteMany({userId:"user_123"});
    await Expense.insertMany(testExpenses)
    process.exit(0);
}

seed();