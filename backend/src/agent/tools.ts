
type SpendingLimitResult={
    withinLimit:boolean,
    limit:number,
    category:string
};

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