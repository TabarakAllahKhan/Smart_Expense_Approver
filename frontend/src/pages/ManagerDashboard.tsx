import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getFlaggedExpenses, overrideExpense } from "../lib/expenseApi";
import type { Expense } from "../lib/types";

export function ManagerDashboard() {
  const { getToken } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadFlagged = useCallback(async () => {
  setIsLoading(true);
  setLoadError(null);
  try {
    const token = await getToken();
    const data = await getFlaggedExpenses(token);
    const pendingReview = data.filter((e) => !e.managerOverride?.decision);
    setExpenses(pendingReview);
  } catch (err) {
    setLoadError(err instanceof Error ? err.message : "Failed to load flagged expenses");
  } finally {
    setIsLoading(false);
  }
}, [getToken]);

  useEffect(() => {
    loadFlagged();
  }, [loadFlagged]);

  async function handleOverride(id: string, decision: "approved" | "rejected") {
    setActionError(null);
    setProcessingId(id);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token unavailable");
      }
      await overrideExpense(id, decision, token);
      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to override expense");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Flagged Expenses — Review Queue</h2>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {loadError && <p className="text-sm text-red-600">{loadError}</p>}
      {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}

      {!isLoading && !loadError && expenses.length === 0 && (
        <p className="text-sm text-gray-500">No flagged expenses right now.</p>
      )}

      <ul className="space-y-3">
        {expenses.map((expense) => (
          <li
            key={expense._id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  ${expense.amount.toFixed(2)} — {expense.category}
                </p>
                <p className="text-sm text-gray-500">{expense.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Submitted by user: {expense.userId}
                </p>
                {expense.reasoning && (
                  <p className="text-xs text-gray-600 mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                    <span className="font-medium">Agent reasoning:</span> {expense.reasoning}
                  </p>
                )}
                {expense.flaggedRules && expense.flaggedRules.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Flags: {expense.flaggedRules.join(", ")}
                  </p>
                )}
                {expense.receiptUrl && (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    View receipt
                  </a>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleOverride(expense._id, "approved")}
                    disabled={processingId === expense._id}
                    className="text-xs font-medium px-3 py-1.5 rounded-md bg-green-600 text-white disabled:opacity-50"
                  >
                    {processingId === expense._id ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={() => handleOverride(expense._id, "rejected")}
                    disabled={processingId === expense._id}
                    className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-600 text-white disabled:opacity-50"
                  >
                    {processingId === expense._id ? "…" : "Reject"}
                  </button>
                </div>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 whitespace-nowrap">
                flagged
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}