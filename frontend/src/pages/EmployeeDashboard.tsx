import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ExpenseForm } from "../components/expenses/ExpenseForm";
import { getMyExpenses, deleteExpense } from "../lib/expenseApi";
import type { Expense } from "../lib/types";

function isEditable(expense: Expense): boolean {
  const editableStates: Expense["decision"][] = ["pending", "flagged"];
  return editableStates.includes(expense.decision) && !expense.managerOverride?.decision;
}

function getDisplayStatus(expense: Expense): { label: string; style: string } {
  if (expense.managerOverride?.decision) {
    return expense.managerOverride.decision === "approved"
      ? { label: "approved (manager)", style: "bg-green-100 text-green-700" }
      : { label: "rejected (manager)", style: "bg-red-100 text-red-700" };
  }

  const decisionStyles: Record<Expense["decision"], string> = {
    "auto-approved": "bg-green-100 text-green-700",
    flagged: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    pending: "bg-gray-100 text-gray-600",
  };

  return { label: expense.decision, style: decisionStyles[expense.decision] };
}

export function EmployeeDashboard() {
  const { getToken } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const token = await getToken();
      const data = await getMyExpenses(token);
      setExpenses(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  function handleSubmitted() {
    setFormKey((k) => k + 1);
    loadExpenses();
  }

  function handleEditSubmitted() {
    setEditingId(null);
    loadExpenses();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this expense? This cannot be undone.");
    if (!confirmed) return;

    setActionError(null);
    setDeletingId(id);
    try {
      const token = await getToken();
      await deleteExpense(id, token);
      loadExpenses();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit an Expense</h2>
        <ExpenseForm key={formKey} onSubmitted={handleSubmitted} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Expenses</h2>

        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        {actionError && <p className="text-sm text-red-600 mb-2">{actionError}</p>}

        {!isLoading && !loadError && expenses.length === 0 && (
          <p className="text-sm text-gray-500">No expenses submitted yet.</p>
        )}

        <ul className="space-y-3">
          {expenses.map((expense) => {
            const status = getDisplayStatus(expense);

            return (
              <li
                key={expense._id}
                className="border border-gray-200 rounded-lg p-4"
              >
                {editingId === expense._id ? (
                  <ExpenseForm
                    existingExpense={expense}
                    onSubmitted={handleEditSubmitted}
                    onCancelEdit={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        ${expense.amount.toFixed(2)} — {expense.category}
                      </p>
                      <p className="text-sm text-gray-500">{expense.description}</p>
                      {expense.reasoning && (
                        <p className="text-xs text-gray-400 mt-1">{expense.reasoning}</p>
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

                      {isEditable(expense) && (
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => setEditingId(expense._id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(expense._id)}
                            disabled={deletingId === expense._id}
                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            {deletingId === expense._id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${status.style}`}
                    >
                      {status.label}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}