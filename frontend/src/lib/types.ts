export type ExpenseCategory = "Meals" | "Travel" | "Equipment" | "Software" | "Other";
export type ExpenseDecision = "pending" | "auto-approved" | "flagged" | "rejected";

export type Expense = {
  _id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  hasReceipt: boolean;
  receiptUrl?: string;
  receiptText?: string;
  date: string;
  decision: ExpenseDecision;
  reasoning?: string;
  confidence?: number;
  flaggedRules?: string[];
  managerOverride?: {
    decision: "approved" | "rejected";
    overriddenBy: string;
    overriddenAt: string;
  };
  createdAt: string;
};

export type ExpenseFormData = {
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  receiptUrl?: string;
  receiptText?: string;
};

export type UploadReceiptResponse = {
  receiptUrl: string;
  receiptText?: string;
};