import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TransactionForm from "../components/TransactionForm";
import { useRef } from "react";
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

/* ---------- SIMPLE MODAL ---------- */
function TransactionModal({ open, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-80 space-y-4">
        {children}
      </div>
    </div>
  );
}

export default function IncomeList() {
  const highlightTimeoutRef = useRef(null);
  const [incomeList, setIncomeList] = useState([]);
  const navigate = useNavigate();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editIncome, setEditIncome] = useState(null);
  const [highlightId, setHighlightId] = useState(null);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  useEffect(() => {
  return () => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
  };
}, []);
useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/");
  }
}, [navigate]);
  /* ---------- FETCH ---------- */
  useEffect(() => {
    async function fetchIncome() {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await apiFetch("/income");

      const data = await res.json();
      setIncomeList(Array.isArray(data) ? data : []);
    }

    fetchIncome();
  }, []);

  const totalIncome = incomeList.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  /* ---------- DELETE ---------- */
  async function deleteIncome(id) {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await apiFetch(`/income/${id}`, {
  method: "DELETE",
});

    if (!res.ok) {
      console.error(
        "Income DELETE failed:",
        res.status,
        await res.text()
      );
    }
    setIncomeList((prev) => prev.filter((i) => i.id !== id));
    setConfirmDeleteId(null);
  }

  /* ---------- ADD / EDIT ---------- */
  function startAdd() {
    setEditIncome({ id: null });
  }

  function startEdit(item) {
    setEditIncome(item);
  }

  /* ---------- SAVE ---------- */
  async function handleSubmit(payload) {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!editIncome.id) {
      const res = await apiFetch("/income", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

      if (!res.ok) {
        console.error("Income ADD failed:", res.status, await res.text());
      }

      const created = await res.json();
      const entry = created.entry ?? created;

      setIncomeList((prev) => [entry, ...prev]);
      setHighlightId(entry.id);
    } else {
     const res = await apiFetch(`/income/${editIncome.id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

      if (!res.ok) {
        console.error(
          "Income EDIT failed:",
          res.status
        );
      }

      setIncomeList((prev) =>
        prev.map((i) =>
          i.id === editIncome.id ? { ...i, ...payload } : i
        )
      );

      setHighlightId(editIncome.id);
    }

    if (highlightTimeoutRef.current) {
  clearTimeout(highlightTimeoutRef.current);
}

highlightTimeoutRef.current = setTimeout(() => {
  setHighlightId(null);
}, 2000);
    setEditIncome(null);
  }

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-lg mx-auto bg-white shadow rounded p-6">
        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-gray-400 hover:text-gray-700"
            >
              ← Dashboard
            </button>
            <h1 className="text-xl font-semibold">Income</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            Log out
          </button>
        </header>

        <p className="text-center text-sm text-gray-600 mt-1">
          Total income: <span className="font-semibold">£{totalIncome}</span>
        </p>

        <button
          onClick={startAdd}
          className="w-full mt-4 mb-3 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          + Add Income
        </button>

        <ul className="mt-4 space-y-2">
          {incomeList.map((item) => (
            <li
              key={item.id}
              className={`p-3 border rounded flex justify-between items-center ${
                highlightId === item.id
                  ? "bg-blue-50 border-blue-400"
                  : ""
              }`}
            >
              <div>
                <div className="font-semibold">£{item.amount}</div>
                <div className="text-sm text-gray-500">
                  {item.customerName || "—"} ·{" "}
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
                    onClick={() => deleteIncome(item.id)}
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
      <TransactionModal
        open={!!editIncome}
        onClose={() => setEditIncome(null)}
      >
        <TransactionForm
          title={editIncome?.id ? "Edit Income" : "Add Income"}
          submitLabel="Save"
          nameLabel="Customer"
          nameField="customerName"
          color="blue"
          initialData={
            editIncome?.id
              ? {
                  amount: editIncome.amount,
                  name: editIncome.customerName,
                  date: editIncome.date,
                }
              : null
          }
          onSubmit={handleSubmit}
          onCancel={() => setEditIncome(null)}
        />
      </TransactionModal>
    </div>
  );
}