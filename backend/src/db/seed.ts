import {connectToDatabase} from "../db/connect";
import {ExpenseRule} from "../models/ExpenseRules";

const defaultRules = [
  { category: "Meals", spendingLimit: 50, receiptThreshold: 50 },
  { category: "Travel", spendingLimit: 500, receiptThreshold: 50 },
  { category: "Equipment", spendingLimit: 1000, receiptThreshold: 50 },
  { category: "Software", spendingLimit: 200, receiptThreshold: 50 },
  { category: "Other", spendingLimit: 100, receiptThreshold: 50 },
];

async function seed(){
    await connectToDatabase();
    for(const rule of defaultRules){
        await ExpenseRule.findOneAndUpdate(
            {category:rule.category},
            rule,
            {upsert:true,new:true}
        )
    }
    console.log("Database seeding completed.");
    process.exit(0);
}

seed();