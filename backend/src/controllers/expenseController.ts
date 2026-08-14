import { Request,Response } from "express";
import { runAgentLoop,ExpenseInput } from "../agent/agent-loop";
import { Expense } from "../models/Expense";

export async function submitExpense(req:Request,res:Response) {
    try {
        const expenseInput:ExpenseInput=req.body;
        const verdict=await runAgentLoop(expenseInput);

        const savedExpense = await Expense.create({
      ...expenseInput,
      date: new Date(expenseInput.date),
      decision: verdict.decision,
      resoning: verdict.reasoning,
      confidence: verdict.confidence,
      flaggedRules: verdict.flaggedRules,
    });
    
    if(savedExpense){
        res.status(201).json(savedExpense);
    }
    } catch (error) {
        console.error("Error processing expense",error);
        res.status(500).json({error:"Failed to process expense"})
    }
    
}