import { Request,Response } from "express";
import { runAgentLoop,ExpenseInput } from "../agent/agent-loop";
import { Expense } from "../models/Expense";
import { getAuth } from "@clerk/express";
import { sendEmployeeDecisionEmail,sendManagerFlagEmail,sendOverrideNotificationEmail } from "../services/emailService";
import { getUserEmail,getManagerEmails } from "../services/clerkService";

export async function submitExpense(req:Request,res:Response) {
    try {

        const {isAuthenticated,userId}=getAuth(req);
        if(!isAuthenticated){
            res.status(401).json({error:"User not Authenticated"});
            
        }

        const {hasReceipt:_ignoredHasReceipt,...clientBody}=req.body;
        const expenseInput:ExpenseInput={
          ...clientBody,
          userId,
          hasReceipt:!!clientBody.receiptUrl,
        }
        const verdict=await runAgentLoop(expenseInput);


        const savedExpense = await Expense.create({
      ...expenseInput,
      date: new Date(expenseInput.date),
      decision: verdict.decision,
      resoning: verdict.reasoning,
      confidence: verdict.confidence,
      flaggedRules: verdict.flaggedRules,
    });

    if(verdict.decision==="flagged"){
      const managerEmails=await getManagerEmails();

      for(const email of managerEmails){
         sendManagerFlagEmail(email,{
           amount:savedExpense.amount,
           category:savedExpense.category,
           reasoning:savedExpense.resoning ?? ""
         });
      }
    }else{
      const employeeEmail=await getUserEmail(userId!);
      if(employeeEmail){
         sendEmployeeDecisionEmail(employeeEmail,{
           amount:savedExpense.amount,
           category:savedExpense.category,
           decision:savedExpense.decision,
           reasoning:savedExpense.resoning ?? "",
         })
      }
    }
    
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

    const role = (sessionClaims as { publicMetadata?: { role?: string } } | undefined)?.publicMetadata?.role;

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

        const role = (sessionClaims as { publicMetadata?: { role?: string } } | undefined)?.publicMetadata?.role;

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

        const employeeEmail=await getUserEmail(expense.userId);
        if(employeeEmail){
          sendOverrideNotificationEmail(employeeEmail,{
            amount:expense.amount,
            category:expense.category,
            overrideDecision:decision
          })
        }

        res.status(200).json(expense);

    } catch (error) {

        console.error("Error overRiding expense",error);
        res.status(500).json({error:"Failed to override expense"})
    }
    
}

export async function updateExpense(req:Request,res:Response) {
   try {
      const {isAuthenticated,userId}=getAuth(req);
      if(!isAuthenticated){
        return res.status(401).json({error:"User is not Authenticated"});
      }
      const {id} = req.params;
      const expense=await Expense.findById(id);

      if(!expense){
        return res.status(404).json({error:"Expense Not found"});

      }

      // Only the orignal submitter can edit their expense
      if(expense.userId!==userId){
        return res.status(403).json({error:"You can only edit your own expense"});
      }

      // Only editable when decision is flagged

      const editableStates=["pending","flagged"];

      if (!editableStates.includes(expense.decision) || expense.managerOverride?.decision) {
             return res.status(400).json({
             error: "This expense cannot be edited as it has already been finalized",
            });
      }

      const {amount,category,description,date}=req.body;

      //Applying edits

      if(amount!==undefined) expense.amount=amount;
      if(category!==undefined) expense.category=category;
      if(description!==undefined) expense.description=description;
      if(date!==undefined) expense.date=new Date(date);
      


      // call the agent again

      const verdict=await runAgentLoop({
        userId:expense.userId,
        amount:expense.amount,
        category:expense.category,
        description:expense.description,
        hasReceipt:expense.hasReceipt,
        date:expense.date.toISOString().split("T")[0]
      })

      expense.decision=verdict.decision;
      expense.resoning=verdict.reasoning;
      expense.confidence=verdict.confidence;
      expense.flaggedRules=verdict.flaggedRules;

      await expense.save();

      res.status(200).json(expense);

   } catch (error) {
       console.error("Error updating expense:",error);
       res.status(500).json({error:"Failed to update expense"})
   }
    
}


export async function deleteExpense(req:Request,res:Response){
     try {
         const {isAuthenticated,userId}=getAuth(req);

     if(!isAuthenticated){
          return res.status(401).json({error:"The user is not authenticated"});
     }
     const {id}=req.params;

     const expense=await Expense.findById(id);

     if(!expense){
        return res.status(404).json({
           error:"Expense not found"
        })
     }

     if(expense?.userId!==userId){
       return res.status(403).json({error:"Only you can delete your own expense"});

     }

     const editableStates=["pending","flagged"];

    if (!editableStates.includes(expense.decision) || expense.managerOverride?.decision) {
             return res.status(400).json({
             error: "This expense cannot be deleted as it has already been finalized",
            });
      }

      await expense.deleteOne()

      res.status(200).json({msg:"Expense deleted successfully",id});

      
     } catch (error) {
       console.error("Error deleting the Expense",error);
       return res.status(500).json({error:"Action cant be completed"});
     }
     




}