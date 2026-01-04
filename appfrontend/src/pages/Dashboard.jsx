import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TransactionForm from "../components/TransactionForm";
import TransactionModal from "../components/TransactionModal";
import { apiFetch } from "../utils/apiFetch.js";

/* ---------- HELPERS ---------- */
function parseLocalDate(value) {
  if (!value) return null;

  // ISO string or full timestamp → let Date handle it
  if (value.includes("T")) {
    const d = new Date(value);
    return isNaN(d) ? null : d;
  }

  // YYYY-MM-DD → local date
  const [y, m, d] = value.split("-");
  return new Date(y, m - 1, d);
}

const formatGBP = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "£0.00";
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
};

function getDailyNetForWeek(weekStart, incomes, expenses) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = parseLocalDate(weekStart);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  return days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const income = incomes
      .filter((e) => {
  const d = parseLocalDate(e.date);
  return d && d >= day && d < nextDay;
})
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const expense = expenses
      .filter((e) => {
  const d = parseLocalDate(e.date);
  return d && d >= day && d < nextDay;
})
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    return {
  date: day,
  label: day.toLocaleDateString("en-GB", { weekday: "short" }),
  net: income - expense,
};
  });
}

function getWeekInsight({ net, weeklyTarget, weekStart }) {
  if (!weeklyTarget || !weekStart) return null;

  const today = new Date();
  const start = new Date(weekStart);

  const dayIndex = Math.min(
    7,
    Math.max(1, Math.ceil((today - start) / (1000 * 60 * 60 * 24)))
  );

  const expectedSoFar = (weeklyTarget / 7) * dayIndex;

  if (net >= weeklyTarget) {
    return { type: "success", text: "🔥 You’ve already hit your weekly target." };
  }

  if (net >= expectedSoFar) {
    return { type: "success", text: "✅ You’re on track to hit your weekly target." };
  }

  const behind = Math.round(expectedSoFar - net);
  return {
    type: "warning",
    text: `⚠️ To stay on track this week, you’ll need to close a £${behind} gap.`,
  };
}
function getDailyTargetGuidance({ net, weeklyTarget, weekStart }) {
  if (!weeklyTarget) {
    return "Set a weekly target to see if you're on track.";
  }

  const today = new Date();
  const start = parseLocalDate(weekStart);

  const dayIndex = Math.min(
    7,
    Math.max(1, Math.ceil((today - start) / (1000 * 60 * 60 * 24)))
  );

  const daysRemaining = Math.max(0, 8 - dayIndex);
  const remainingDaysLabel =
  daysRemaining > 1
    ? `${daysRemaining} days remaining`
    : daysRemaining === 1
    ? "1 day remaining"
    : "Week ends today";
  const remainingAmount = weeklyTarget - net;

  if (daysRemaining === 0) {
    return remainingAmount <= 0
  ? "Week ends today · You've already hit your weekly target."
  : `Week ends today · You're ${formatGBP(
      remainingAmount
    )} short of your weekly target.`;
  }

  const perDay = Math.ceil(remainingAmount / daysRemaining);

  return remainingAmount <= 0
  ? `${remainingDaysLabel} · You can average ${formatGBP(
      Math.abs(perDay)
    )} per day and still hit your target.`
  : `${remainingDaysLabel} · You need to average ${formatGBP(
      perDay
    )} per day to hit your target.`;
}

function getBestAndWorstDay(dailyNet) {
  if (!dailyNet || dailyNet.length === 0) {
    return {
      best: null,
      worst: null,
    };
  }

  const nonZeroDays = dailyNet.filter((d) => d.net !== 0);

  if (nonZeroDays.length === 0) {
    return {
      best: null,
      worst: null,
    };
  }

  let best = nonZeroDays[0];
  let worst = nonZeroDays[0];

  for (const day of nonZeroDays) {
    if (day.net > best.net) best = day;
    if (day.net < worst.net) worst = day;
  }

  return { best, worst };
}

/* ---------- COMPONENT ---------- */
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [weeklyTargetInput, setWeeklyTargetInput] = useState("");
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showWeeklyTarget, setShowWeeklyTarget] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/");
  }
}, [navigate]);

  function handleLogout() {
  localStorage.removeItem("token");
  navigate("/");
}

  /* ---------- FETCH ---------- */
  async function fetchDashboard() {
    try {
      const res = await apiFetch("/dashboard/weekly");

      const json = await res.json();
      if (!res.ok) throw new Error();

      // normalize expense name field so UI is resilient
      const normalizedExpenseEntries = (json.expenseEntries || []).map((e) => ({
        ...e,
        supplierName:
          e.supplierName ?? e.customer ?? e.customerName ?? e.vendor ?? e.name ?? "",
      }));

      const dailyNet = getDailyNetForWeek(
        json.weekStart,
        json.incomeEntries || [],
        normalizedExpenseEntries
      );

      setData({
        ...json,
        expenseEntries: normalizedExpenseEntries,
        dailyNet,
      });

      setWeeklyTargetInput(String(json.weeklyTarget ?? 0));
      setLoading(false);
    } catch {
      setError("Failed to load dashboard");
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function saveWeeklyTarget() {
  await apiFetch("/settings/business", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      weeklyTargetIncome: Number(weeklyTargetInput || 0),
    }),
  });

  fetchDashboard();
}

  async function submitIncome(payload) {
  await apiFetch("/income", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  setShowIncomeModal(false);
  fetchDashboard();
}

  async function submitExpense(payload) {
  await apiFetch("/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  setShowExpenseModal(false);
  fetchDashboard();
}

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!data) return null;

  const insight = getWeekInsight({
    net: data.net,
    weeklyTarget: data.weeklyTarget,
    weekStart: data.weekStart,
  });

  const { best, worst } = getBestAndWorstDay(data.dailyNet);

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            Dashboard
          </h1>

          <button
            type="button"
            onClick={handleLogout}
            className="text-sm px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </header>

        <p className="text-center text-xs text-gray-500">
          Showing: This week (Mon–Sun)
        </p>

        {insight && (
          <div
            className={`border-l-4 p-3 rounded text-sm ${
              insight.type === "success"
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-yellow-500 bg-yellow-50 text-yellow-800"
            }`}
          >
            <div className="font-medium text-xs mb-0.5 uppercase tracking-wide">
              Weekly pace
            </div>
            <div>{insight.text}</div>
          </div>
        )}


        <div className="mt-3 border border-gray-200 rounded-md bg-gray-50">
          <button
            type="button"
            onClick={() => setShowWeeklyTarget((v) => !v)}
            className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium"
          >
            <span>
              Weekly target:{" "}
              <span className="font-semibold">
                {formatGBP(data.weeklyTarget || 0)}
              </span>
            </span>
            <span className="text-xs text-gray-500">
              {showWeeklyTarget ? "Hide" : "Edit"}
            </span>
          </button>

          {showWeeklyTarget && (
            <div className="px-3 pb-3">
              <input
                type="number"
                className="w-full p-2 border rounded-md mt-2"
                value={weeklyTargetInput}
                onChange={(e) => setWeeklyTargetInput(e.target.value)}
                onBlur={saveWeeklyTarget}
                placeholder="Enter weekly target"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <Stat title="Total Income" value={data.totalIncome} color="blue" />
          <Stat title="Expenses" value={data.totalExpenses} color="red" />
          <Stat
            title="Net this week"
            value={data.net}
            color={data.net < 0 ? "red" : "green"}
          />
        </div>

        <div className="mt-4">
          <h2 className="text-sm font-semibold mb-2 text-center">
            This Week (Daily Net)
          </h2>

          <div className="flex items-end justify-between h-32 bg-gray-50 rounded px-3">
            {data.dailyNet.map((day) => {
              const today = new Date();
              const isToday =
                day.date &&
                today.toDateString() === day.date.toDateString();

              return (
                <div
                  key={day.date?.toISOString() ?? Math.random()}
                  className={`flex flex-col items-center w-8 ${
                    isToday ? "bg-blue-50 rounded-md" : ""
                  }`}
                >
                  <div className="text-xs mb-1 whitespace-nowrap leading-tight">
                    {formatGBP(day.net)}
                  </div>
                  <div className="relative h-20 w-4 bg-gray-200 rounded">
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        height: `${Math.max(4, Math.min(Math.abs(day.net), 80))}px`,
                        width: "100%",
                        backgroundColor: day.net >= 0 ? "#22c55e" : "#ef4444",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div className="text-xs mt-1 flex flex-col items-center">
                    <span>{day.label}</span>
                    {isToday && (
                      <span className="text-[10px] text-blue-600 font-medium">
                        today
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 text-[11px] text-center text-gray-500">
          {best && worst ? (
            <>
              Best day: <span className="font-medium">{best.label}</span>{" "}
              ({formatGBP(best.net)}) · Worst day:{" "}
              <span className="font-medium">{worst.label}</span>{" "}
              ({formatGBP(worst.net)})
            </>
          ) : (
            <>No activity yet this week.</>
          )}
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setShowIncomeModal(true)}
            className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + Add Income
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex-1 bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            + Add Expense
          </button>
        </div>

        <div className="pt-4 mt-4 border-t flex justify-between text-sm">
          <Link
            to="/income"
            className="text-gray-500 hover:text-gray-900 flex items-center gap-1"
          >
            <span>Income</span>
            <span aria-hidden>→</span>
          </Link>

          <Link
            to="/expenses"
            className="text-gray-500 hover:text-gray-900 flex items-center gap-1"
          >
            <span>Expenses</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {/* ---------- MODALS ---------- */}
      <TransactionModal open={showIncomeModal} onClose={() => setShowIncomeModal(false)}>
        <TransactionForm
          title="Add Income"
          submitLabel="Save"
          nameLabel="Customer"
          nameField="customerName"
          initialData={null}
          onSubmit={submitIncome}
          onCancel={() => setShowIncomeModal(false)}
          color="blue"
        />
      </TransactionModal>

      <TransactionModal open={showExpenseModal} onClose={() => setShowExpenseModal(false)}>
        <TransactionForm
          title="Add Expense"
          submitLabel="Save"
          nameLabel="Supplier"
          nameField="supplierName"
          initialData={null}
          onSubmit={submitExpense}
          onCancel={() => setShowExpenseModal(false)}
          color="red"
        />
      </TransactionModal>
    </div>
  );
}

/* ---------- SMALL ---------- */
function Stat({ title, value, sub, color }) {
  const colors = {
    blue: "bg-blue-100",
    red: "bg-red-100",
    green: "bg-green-100",
    yellow: "bg-yellow-100",
  };

  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <h2 className="text-sm">{title}</h2>
      <p className="text-xl font-semibold">{formatGBP(value)}</p>
      {sub && <p className="text-sm">{sub}</p>}
    </div>
  );
}