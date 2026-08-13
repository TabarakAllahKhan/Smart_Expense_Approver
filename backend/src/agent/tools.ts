import { ExpenseRule } from "../models/ExpenseRule";

const MOCK_EXISTING_EXPENSES = [
    {
        id: "exp_1001",
        userId: "user_123",
        amount: 75,
        category: "Meals",
        date: "2026-08-09",
        decision: "approved",
    },
    {
        id: "exp_1002",
        userId: "user_456",
        amount: 120,
        category: "Travel",
        date: "2026-08-10",
        decision: "flagged",
    },
    {
        id: "exp_1003",
        userId: "user_123",
        amount: 75,
        category: "Meals",
        date: "2026-08-12",
        decision: "rejected",
    },
];

const MOCK_USER_HISTORY: Record<string, { recentExpenses: Array<{ amount: number; category: string; date: string; decision: string }>; flagRate: number }> = {
    user_123: {
        recentExpenses: [
            { amount: 60, category: "Meals", date: "2026-08-01", decision: "approved" },
            { amount: 90, category: "Meals", date: "2026-08-05", decision: "flagged" },
            { amount: 75, category: "Meals", date: "2026-08-09", decision: "approved" },
        ],
        flagRate: 33.33,
    },
    user_456: {
        recentExpenses: [
            { amount: 180, category: "Travel", date: "2026-08-02", decision: "approved" },
            { amount: 120, category: "Travel", date: "2026-08-10", decision: "flagged" },
        ],
        flagRate: 50,
    },
};

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

export function checkDuplicateSubmission(userId:string,amount:number,date:string):DuplicateCheckResult{
    const match=MOCK_EXISTING_EXPENSES.find((exp)=>{
        const sameUser=exp.userId===userId;
        const sameAmount=exp.amount===amount;
        const daysApart=Math.abs(new Date(date).getTime() - new Date(exp.date).getTime())/(1000*60*60*24);
        return sameUser && sameAmount && daysApart<=3;
    })

    return{
        duplicateFound:!!match,
        matchingExpenseId:match?.id
    }
    
}

export function viewPurchaseHistory(userId:string):PurchaseHistoryResult{
    return (
        MOCK_USER_HISTORY[userId] ?? {
            recentExpenses:[],
            flagRate:0
        }
    )
}