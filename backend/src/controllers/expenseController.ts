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

export async function getFlaggedExpenses(req: Request, res: Response) {
  try {
    const { isAuthenticated, sessionClaims } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const role = (sessionClaims as { role?: string } | undefined)?.role;

    if (role !== "manager") {
      return res.status(403).json({ error: "Manager access required" });
    }

    const flaggedExpenses = await Expense.find({ decision: "flagged" }).sort({
      createdAt: -1,
    });

    res.status(200).json(flaggedExpenses);
  } catch (err) {
    console.error("Error fetching flagged expenses:", err);
    res.status(500).json({ error: "Failed to fetch flagged expenses" });
  }
}


export async function overrideExpense(req:Request,res:Response) {
    try {
        const {isAuthenticated,sessionClaims,userId}=getAuth(req);

        if(!isAuthenticated) return res.status(401).json({error:"user not authenticated"});

        const role=(sessionClaims as {role?:string} | undefined)?.role;

        if(role!=="manager"){ 
            return res.status(403).json({error:"Manager access required"})
        }

        const {id}=req.params;
        const {decision}=req.body;

        if(decision!=="approved" && decision!=="rejected"){
            return res.status(400).json({
                error:"decision must be 'approved' or 'rejected'"
            })

        }

        const expense=await Expense.findById(id);
        if(!expense){
            return res.status(404).json({error:"Expense not found"});
        }

        expense.managerOverride={
            decision,
            overridenBy:userId!,
            overridenAt:new Date()
        }
        await expense.save();

        res.status(200).json(expense);

    } catch (error) {

        console.error("Error overRiding expense",error);
        res.status(500).json({error:"Failed to override expense"})
    }
    
}