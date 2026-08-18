import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ReceiptUpload } from "./receiptUpload";
import { submitExpense } from "../../lib/expenseApi";
import type { ExpenseCategory, ExpenseFormData } from "../../lib/types";

const CATEGORIES: ExpenseCategory[] = ["Meals", "Travel", "Equipment", "Software", "Other"];

type ExpenseFormProps = {
  onSubmitted: () => void;
};

export function ExpenseForm({ onSubmitted }: ExpenseFormProps) {
  const { getToken } = useAuth();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Meals");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [receiptText, setReceiptText] = useState<string | undefined>(undefined);
  const [isReceiptUploading, setIsReceiptUploading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleUploadComplete(url: string, text?: string) {
    setReceiptUrl(url);
    setReceiptText(text);
    setIsReceiptUploading(false);
  }
  function handleUploadStart() {
    setIsReceiptUploading(true);
  }
  function handleUploadClear() {
    setReceiptUrl(undefined);
    setReceiptText(undefined);
    setIsReceiptUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!amount || !description || !date) {
      setSubmitError("Please fill in amount, description, and date.");
      return;
    }

    const formData: ExpenseFormData = {
      amount: parseFloat(amount),
      category,
      description,
      date,
      receiptUrl,
      receiptText,
    };

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await submitExpense(formData, token);

      setAmount("");
      setCategory("Meals");
      setDescription("");
      setDate("");
      setReceiptUrl(undefined);
      setReceiptText(undefined);

      onSubmitted();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit expense");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isBusy = isSubmitting || isReceiptUploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          required
        />
      </div>

      <ReceiptUpload
        onUploadStart={handleUploadStart}
        onUploadComplete={handleUploadComplete}
        onClear={handleUploadClear}
      />

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={isBusy}
        className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Submitting…" : isReceiptUploading ? "Waiting for receipt…" : "Submit Expense"}
      </button>
    </form>
  );
}