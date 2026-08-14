import { ExpenseRule } from "../models/ExpenseRule";
import { Expense } from "../models/Expense";

type SpendingLimitResult={
    withinLimit:boolean,
    limit:number,
    category:string
};

type ReceiptCheckResult={
    receiptRequired:boolean,
    receiptProvided:boolean,
}

type DuplicateCheckResult={
    duplicateFound:boolean,
    matchingExpenseId?:string
};

type PurchaseHistoryResult={
    recentExpenses:Array<{
        amount:number,
        category:string,
        date:string
        decision:string
    }>;
    flagRate:number; // percentage of recent expenses that were flagged
}



export async function checkSpendingLimit(category:string,amount:number):Promise<SpendingLimitResult>{
    const rule=await ExpenseRule.findOne({category});

    const limit=rule?.spendingLimit ?? 0;
    return{
        withinLimit:amount<=limit,
        limit,
        category,
    }
}

export function checkReceiptRequired(amount:number,hasReceipt:boolean):ReceiptCheckResult{
    const RECEIPT_THRESHOLD=50;
    return{
        receiptRequired:amount>RECEIPT_THRESHOLD,
        receiptProvided:hasReceipt
    }
}

export async function checkDuplicateSubmission(userId:string,amount:number,date:string):Promise<DuplicateCheckResult> {
    const targetDate=new Date(date);
    const threeDaysBefore=new Date(targetDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate()-3);
    const threeDaysAfter=new Date(targetDate);
    threeDaysAfter.setDate(threeDaysAfter.getDate()+3);

    const match=await Expense.findOne({
        userId,
        amount,
        date:{$gte:threeDaysBefore,$lte:threeDaysAfter}
    })

    return{
        duplicateFound:!!match,
        matchingExpenseId:match?.id
    }
    
}

export async function viewPurchaseHistory(
  userId: string
): Promise<PurchaseHistoryResult> {
  const recent = await Expense.find({ userId })
    .sort({ date: -1 })
    .limit(10);

  if (recent.length === 0) {
    return { recentExpenses: [], flagRate: 0 };
  }

  const flaggedOrRejected = recent.filter(
    (exp) => exp.decision === "flagged" || exp.decision === "rejected"
  ).length;

  return {
    recentExpenses: recent.map((exp) => ({
      amount: exp.amount,
      category: exp.category,
      date: exp.date.toISOString().split("T")[0], // This convert the Mongodb Date into YYY-MM-DD
      decision: exp.decision,
    })),
    flagRate: flaggedOrRejected / recent.length,
  };
}

