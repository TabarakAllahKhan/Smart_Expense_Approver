
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

const MOCK_USER_HISTORY:Record<string,PurchaseHistoryResult>={
    user_123:{
        recentExpenses:[
            {amount:75,category:"Meals",date:"2026-08-10",decision:"auto-approved"},
            {amount:200,category:"Travel",date:"2026-08-11",decision:"flagged"},
            {amount:30,category:"Software",date:"2026-08-09",decision:"auto-approved"},
        ],
        flagRate:0.33
    }
}
const MOCK_EXISTING_EXPENSES=[
    {id:"exp_001",userId:"user_123",amount:75,date:"2026-08-10",category:"Meals"},
    {id:"exp_002",userId:"user_456",amount:200,date:"2026-08-11",category:"Travel"},
]
const MOCK_LIMITS:Record<string,number>={
    Meals:50,
    Travel:500,
    Equipment:1000,
    Software:200,
    Other:100
}

export function checkSpendingLimit(category:string,amount:number):SpendingLimitResult{
    const limit=MOCK_LIMITS[category] ?? 100; 
    return{
        withinLimit:amount<=limit,
        limit,
        category
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