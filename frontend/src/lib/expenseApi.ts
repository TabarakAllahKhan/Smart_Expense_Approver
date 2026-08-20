import { apiClient } from "./apiClient";
import type { Expense,ExpenseFormData,UploadReceiptResponse } from "./types";


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
    return apiClient(`/expenses/${id}`,{method:"PATCH",body:data,token})
}

export function deleteExpense(id:string,token:string|null) {
    return apiClient(`/expenses/${id}`,{method:"DELETE",token})
    
}

export function uploadReceipt(file:File,token:string|null):Promise<UploadReceiptResponse>{
    const formData=new FormData();
    formData.append("receipt",file);
    return apiClient("/upload",{method:"POST",body:formData,token})
}

export function getFlaggedExpenses(token:string|null):Promise<Expense[]> {
    return apiClient("/expenses/flagged",{method:"GET",token})
    
}

export function overrideExpense(id:string,decision:"approved" | "rejected",token:string):Promise<Expense>{
    return apiClient(`/expenses/${id}/override`,{method:"PATCH",body:{decision},token})

}