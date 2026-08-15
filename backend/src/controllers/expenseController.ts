import { Request,Response } from "express";
import { runAgentLoop,ExpenseInput } from "../agent/agent-loop";
import { Expense } from "../models/Expense";
import { getAuth } from "@clerk/express";

export async function submitExpense(req:Request,res:Response) {
    try {

        const {isAuthenticated,userId}=getAuth(req);
        if(!isAuthenticated){
            res.status(401).json({error:"User not Authenticated"});
            
        }

        const expenseInput:ExpenseInput={...req.body,userId}
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

export async function getMyExpense(req:Request,res:Response) {
    try {
        const {isAuthenticated,userId}=getAuth(req)

        if(!isAuthenticated) return res.status(401).json({error:"User is not Authenticated"});

        const expenses=await Expense.find({userId}).sort({createdAt:-1});

        res.status(200).json(expenses)

    } catch (err) {
        console.error("Error fetching expenses:",err);
        res.status(500).json({err:"Failed to fetch expense"});
        
    }
    
}
