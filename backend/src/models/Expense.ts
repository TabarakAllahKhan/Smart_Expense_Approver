import mongoose,{Schema} from "mongoose";

export interface ExpenseDoc extends mongoose.Document{
    userId:string;
    amount:number;
    category:string;
    description:string;
    hasReceipt:boolean;
    date:Date;
    decision:"auto-approved"|"flagged"|"rejected" | "pending";
    resoning?:string;
    confidence?:number;
    flaggedRules?:string[];
    managerOverride?:{
        decision:"approved"|"rejected";
        overridenBy:string;
        overridenAt:Date;
    };
    createdAt:Date;
}

const expenseSchema=new Schema<ExpenseDoc>({
    userId:{type:String,required:true},
    amount:{type:Number,required:true},
    category:{type:String,required:true},
    description:{type:String,required:true},
    hasReceipt:{type:Boolean,required:true},
    date:{type:Date,required:true},
    decision:{type:String,enum:["auto-approved","flagged","rejected","pending"],default:"pending"},
    resoning:{type:String},
    confidence:{type:Number},
    flaggedRules:[{type:String}],
    managerOverride:{
        decision:{type:String,enum:["approved","rejected"]},
        overridenBy:{type:String},
        overridenAt:{type:Date}
    },
    createdAt:{type:Date,default:Date.now}
})

export const ExpenseModel=mongoose.model<ExpenseDoc>("Expense",expenseSchema);
