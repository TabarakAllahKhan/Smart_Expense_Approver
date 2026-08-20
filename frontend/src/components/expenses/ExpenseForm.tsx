import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ReceiptUpload } from "./ReceiptUpload";
import { submitExpense, updateExpense } from "../../lib/expenseApi";
import type { Expense, ExpenseCategory, ExpenseFormData } from "../../lib/types";

const CATEGORIES: ExpenseCategory[] = ["Meals", "Travel", "Equipment", "Software", "Other"];

type ExpenseFormProps = {
  existingExpense?: Expense;
  onSubmitted: () => void;
  onCancelEdit?: () => void;
};

export function ExpenseForm({ existingExpense, onSubmitted, onCancelEdit }: ExpenseFormProps) {
  const { getToken } = useAuth();
  const isEditMode = !!existingExpense;

  const [amount, setAmount] = useState(existingExpense ? String(existingExpense.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(existingExpense?.category ?? "Meals");
  const [description, setDescription] = useState(existingExpense?.description ?? "");
  const [date, setDate] = useState(existingExpense ? existingExpense.date.split("T")[0] : "");

  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [receiptText, setReceiptText] = useState<string | undefined>(undefined);
  const [isReceiptUploading, setIsReceiptUploading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleUploadStart() {
    setIsReceiptUploading(true);
  }

  function handleUploadComplete(url: string, text?: string) {
    setReceiptUrl(url);
    setReceiptText(text);
    setIsReceiptUploading(false);
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

    setIsSubmitting(true);
    try {
      const token = await getToken();

      if (isEditMode && existingExpense) {
        await updateExpense(
          existingExpense._id,
          {
            amount: parseFloat(amount),
            category,
            description,
            date,
          },
          token
        );
      } else {
        const formData: ExpenseFormData = {
          amount: parseFloat(amount),
          category,
          description,
          date,
          receiptUrl,
          receiptText,
        };
        await submitExpense(formData, token);

        setAmount("");
        setCategory("Meals");
        setDescription("");
        setDate("");
        setReceiptUrl(undefined);
        setReceiptText(undefined);
      }

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

      {isEditMode && existingExpense ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
          {existingExpense?.receiptUrl ? (
  <a
    href={existingExpense.receiptUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm text-blue-600 hover:underline"
  >
    View original receipt
  </a>
) : (
  <p className="text-sm text-gray-400">No receipt was attached.</p>
)}
          <p className="text-xs text-gray-400 mt-1">Receipt cannot be changed after submission.</p>
        </div>
      ) : (
        <ReceiptUpload
          onUploadStart={handleUploadStart}
          onUploadComplete={handleUploadComplete}
          onClear={handleUploadClear}
        />
      )}

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isBusy}
          className="flex-1 bg-blue-600 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? isEditMode
              ? "Saving…"
              : "Submitting…"
            : isReceiptUploading
              ? "Waiting for receipt…"
              : isEditMode
                ? "Save Changes"
                : "Submit Expense"}
        </button>

        {isEditMode && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}