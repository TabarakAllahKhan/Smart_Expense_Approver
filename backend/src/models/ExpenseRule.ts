import mongoose, {Schema} from "mongoose";

export interface ExpenseRuleDoc extends mongoose.Document{
    category:string;
    spendingLimit:number;
    receiptThreshold:number;
}

const expenseRuleSchema=new Schema<ExpenseRuleDoc>({
    category:{type:String,required:true,unique:true},
    spendingLimit:{type:Number,required:true},
    receiptThreshold:{type:Number,required:true,default:50}
})


export const ExpenseRule=mongoose.model<ExpenseRuleDoc>("ExpenseRule",expenseRuleSchema);