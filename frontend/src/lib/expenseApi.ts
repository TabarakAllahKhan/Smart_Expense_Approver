import { apiClient } from "./apiClient";
import type { Expense,ExpenseFormData } from "./types";


export function submitExpense(data:ExpenseFormData,token:string|null):Promise<Expense>{
    return apiClient("/expenses",{method:"POST",body:data,token})
}

export function getMyExpenses(token:string|null):Promise<Expense[]>{
    return apiClient("/expenses",{method:"GET",token})
}

export function updateExpense(
    id:string,
    data:Partial<ExpenseFormData>,
    token:string|null
):Promise<Expense>{
    return apiClient(`expenses/${id}`,{method:"PATCH",body:data,token})
}

export function deleteExpense(id:string,token:string|null) {
    return apiClient(`expenses/${id}`,{method:"DELETE",token})
    
}