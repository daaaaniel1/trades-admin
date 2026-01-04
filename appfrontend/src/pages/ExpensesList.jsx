import { useState, useEffect, useRef } from "react";
import TransactionForm from "../components/TransactionForm";
import { apiFetch } from "../utils/apiFetch.js";
import { useNavigate } from "react-router-dom";
function parseLocalDate(value) {
  if (!value) return null;

  // If it's already a full ISO string or timestamp, let Date handle it
  if (value.includes("T")) {
    const d = new Date(value);
    return isNaN(d) ? null : d;
  }

  // Handle YYYY-MM-DD safely as local date
  const [y, m, d] = value.split("-");
  return new Date(y, m - 1, d);
}

export default function ExpensesList() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [editExpense, setEditExpense] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const highlightTimeoutRef = useRef(null);
useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/");
  }
}, [navigate]);
  /* ---------- FETCH ---------- */
  useEffect(() => {
    async function fetchExpenses() {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await apiFetch("/expenses");

      const data = await res.json();

      setExpenses(
        Array.isArray(data)
          ? data.map((e) => ({
              ...e,
              supplierName:
                e.supplierName ??
                e.customer ??
                e.customerName ??
                "",
            }))
          : []
      );
    }

    fetchExpenses();
  }, []);

  useEffect(() => {
  return () => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
  };
}, []);

  /* ---------- DELETE ---------- */
  async function deleteExpense(id) {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await apiFetch(`/expenses/${id}`, {
      method: "DELETE",
    });

if (!res.ok) {
  console.error(
    "Expense DELETE failed:",
    res.status,
    await res.text()
  );
}

    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteId(null);
  }

  /* ---------- ADD / EDIT ---------- */
  function startAdd() {
  setEditExpense({
    id: null,
    amount: "",
    supplierName: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
}

  function startEdit(item) {
    setEditExpense({
      id: item.id,
      amount: item.amount,
      supplierName: item.supplierName ?? "",
      description: item.description ?? "",
      date: item.date,
    });
  }

  function closeModal() {
    setEditExpense(null);
  }

  /* ---------- SAVE ---------- */
  async function handleSubmit(payload) {
    const token = localStorage.getItem("token");
    if (!token) return;

    // ADD
    if (!editExpense.id) {
      const res = await apiFetch("/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        "Expense ADD failed:",
        res.status,
        await res.text()
      );
    }

const created = await res.json();
const entry = created.entry ?? created;

      setExpenses((prev) => [entry, ...prev]);

      setHighlightId(entry.id);
    }
    // EDIT
    else {
      const res = await apiFetch(`/expenses/${editExpense.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        "Expense EDIT failed:",
        res.status
      );
    }

      setExpenses((prev) =>
        prev.map((e) =>
          e.id === editExpense.id
            ? { ...e, ...payload }
            : e
        )
      );

      setHighlightId(editExpense.id);
    }

    if (highlightTimeoutRef.current) {
  clearTimeout(highlightTimeoutRef.current);
}

highlightTimeoutRef.current = setTimeout(() => {
  setHighlightId(null);
}, 2000);
    closeModal();
  }

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-lg mx-auto bg-white shadow rounded p-6">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              ← Dashboard
            </button>

            <h1 className="text-xl font-semibold">
              Expenses
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Log out
          </button>
        </header>

        <p className="text-sm text-gray-600 mb-3">
          Total expenses: <span className="font-semibold">£{totalExpenses}</span>
        </p>

        <button
          onClick={startAdd}
          className="w-full mt-4 mb-3 bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          + Add Expense
        </button>

        <ul className="mt-4 space-y-2">
          {expenses.map((item) => (
            <li
              key={item.id}
              className={`p-3 border rounded flex justify-between items-center transition ${
                highlightId === item.id
                  ? "bg-red-50 border-red-400"
                  : ""
              }`}
            >
              <div>
                <div className="font-semibold">£{item.amount}</div>
                <div className="text-sm text-gray-500">
                  {item.supplierName || "—"} ·{" "}
                  {parseLocalDate(item.date).toLocaleDateString("en-GB")}
                </div>
                {item.description && (
                <div className="text-xs text-gray-500">
                  {item.description}
                </div>
              )}
              </div>

              {confirmDeleteId === item.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteExpense(item.id)}
                    className="text-sm px-3 py-1 rounded bg-red-600 text-white"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-sm px-3 py-1 rounded bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ---------- MODAL ---------- */}
      {editExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <TransactionForm
              title={editExpense.id ? "Edit Expense" : "Add Expense"}
              submitLabel="Save"
              nameLabel="Supplier"
              nameField="supplierName"
              color="red"
              initialData={editExpense.id ? editExpense : null}
              onSubmit={handleSubmit}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}