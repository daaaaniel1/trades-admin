import { useState, useEffect } from "react";

export default function TransactionForm({
  title,
  submitLabel,
  nameLabel,
  nameField,        // "customerName" | "supplierName"
  initialData,      // null or existing entry
  onSubmit,
  onCancel,
  color = "blue",   // "blue" | "red"
}) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount ?? "");
      setName(initialData[nameField] ?? "");
      setDescription(initialData.description ?? "");
      setDate(initialData.date?.slice(0, 10) ?? "");
    } else {
      setAmount("");
      setName("");
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [initialData, nameField]);

  function handleSubmit(e) {
    e.preventDefault();

    onSubmit({
      amount: Number(amount),
      [nameField]: name,
      description: description?.trim() || null,
      date,
    });
  }

  const buttonColor =
    color === "red"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-blue-600 hover:bg-blue-700";

  const presets =
    nameField === "supplierName"
      ? ["Materials", "Fuel / travel", "Tools / equipment", "Subcontractor", "Other"]
      : ["Call-out", "Labour", "Invoice payment", "Other"];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>

      <input
        type="number"
        className="w-full p-2 border rounded"
        placeholder="Amount (£)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <input
        type="text"
        className="w-full p-2 border rounded"
        placeholder={nameLabel}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      {/* ✅ Description field */}
      <input
        type="text"
        className="w-full p-2 border rounded"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* ✅ Preset buttons */}
      <div className="flex flex-wrap gap-2 text-sm">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setDescription(preset)}
            className="px-3 py-1 border rounded-full text-gray-600 hover:bg-gray-100"
          >
            {preset}
          </button>
        ))}
      </div>

      <input
        type="date"
        className="w-full p-2 border rounded"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <button className={`w-full text-white p-2 rounded ${buttonColor}`}>
        {submitLabel}
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full bg-gray-300 p-2 rounded"
      >
        Cancel
      </button>
    </form>
  );
}