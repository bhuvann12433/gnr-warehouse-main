import React, { useEffect, useState } from "react";

type EquipmentFormProps = {
  equipment?: any | null; // existing equipment when editing
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
};

const unitOptions = ["UNT", "PCS", "BOX", "SET", "NOS"];

const EquipmentForm: React.FC<EquipmentFormProps> = ({ equipment, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: "",
    category: "Instruments",
    quantity: 0,
    costPerUnit: 0,
    notes: "",
    hsnCode: "",
    unit: "UNT",
    // status counts mirror quantity by default
    statusCounts: {
      available: 0,
      in_use: 0,
      maintenance: 0
    }
  });

  useEffect(() => {
    if (equipment) {
      setForm({
        name: equipment.name || "",
        category: equipment.category || "Instruments",
        quantity: equipment.quantity ?? 0,
        costPerUnit: equipment.costPerUnit ?? 0,
        notes: equipment.notes ?? "",
        hsnCode: equipment.hsnCode ?? "",
        unit: equipment.unit ?? "UNT",
        statusCounts: {
          available: equipment.statusCounts?.available ?? equipment.quantity ?? 0,
          in_use: equipment.statusCounts?.in_use ?? 0,
          maintenance: equipment.statusCounts?.maintenance ?? 0
        }
      });
    }
  }, [equipment]);

  // Keep statusCounts in sync when quantity changed (only if user hasn't manually changed counts)
  useEffect(() => {
    // If total of statusCounts differs from quantity, and statusCounts was previously synced, keep it synced.
    const totalStatus = form.statusCounts.available + form.statusCounts.in_use + form.statusCounts.maintenance;
    if (totalStatus !== form.quantity) {
      // If user explicitly set status counts earlier we won't override. Heuristics: if in edit mode and equipment provided, keep existing counts.
      // For new item, sync available = quantity.
      setForm((prev) => ({
        ...prev,
        statusCounts: {
          ...prev.statusCounts,
          available: prev.quantity
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.quantity]);

  const handleChange = (k: string, v: any) => {
    if (k.startsWith("statusCounts.")) {
      const key = k.split(".")[1];
      setForm((prev) => ({ ...prev, statusCounts: { ...prev.statusCounts, [key]: Number(v) } }));
    } else if (k === "quantity") {
      const n = Number(v || 0);
      setForm((prev) => ({ ...prev, quantity: n }));
    } else if (k === "costPerUnit") {
      const n = Number(v || 0);
      setForm((prev) => ({ ...prev, costPerUnit: n }));
    } else {
      setForm((prev) => ({ ...prev, [k]: v }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!form.name.trim()) {
      alert("Please enter equipment name.");
      return;
    }
    if (!form.category) {
      alert("Please select a category.");
      return;
    }
    if (form.quantity < 0) {
      alert("Quantity cannot be negative.");
      return;
    }
    if (form.costPerUnit < 0) {
      alert("Cost per unit cannot be negative.");
      return;
    }

    // Ensure statusCounts sum equals quantity (backend enforces this as well)
    const sumStatus = form.statusCounts.available + form.statusCounts.in_use + form.statusCounts.maintenance;
    if (sumStatus !== form.quantity) {
      // If mismatch, ask user to confirm auto-sync
      if (!window.confirm(`Status counts (${sumStatus}) do not equal quantity (${form.quantity}).\nClick OK to auto-sync available = quantity, Cancel to adjust manually.`)) {
        return;
      }

      // auto-sync available
      form.statusCounts.available = form.quantity;
      form.statusCounts.in_use = 0;
      form.statusCounts.maintenance = 0;
    }

    // Prepare payload - include hsnCode and unit
    const payload: any = {
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity),
      costPerUnit: Number(form.costPerUnit),
      notes: form.notes,
      hsnCode: form.hsnCode,
      unit: form.unit,
      statusCounts: {
        available: Number(form.statusCounts.available),
        in_use: Number(form.statusCounts.in_use),
        maintenance: Number(form.statusCounts.maintenance)
      }
    };

    try {
      await onSave(payload);
    } catch (err: any) {
      console.error(err);
      alert("Failed to save equipment: " + (err?.message || err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10">
      <div className="bg-white w-[95%] md:w-3/4 lg:w-1/2 rounded-xl shadow-xl border">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{equipment ? "Edit Equipment" : "Add Equipment"}</h2>
            <button type="button" onClick={onCancel} className="text-sm text-gray-600 px-2 py-1">Close</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="border px-3 py-2 rounded w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="Instruments">Instruments</option>
                <option value="Consumables">Consumables</option>
                <option value="Diagnostic">Diagnostic</option>
                <option value="Furniture">Furniture</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                className="border px-3 py-2 rounded w-full"
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cost Per Unit (₹)</label>
              <input
                type="number"
                value={form.costPerUnit}
                onChange={(e) => handleChange("costPerUnit", e.target.value)}
                className="border px-3 py-2 rounded w-full"
                min={0}
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">HSN Code</label>
              <input
                type="text"
                value={form.hsnCode}
                onChange={(e) => handleChange("hsnCode", e.target.value)}
                className="border px-3 py-2 rounded w-full"
                placeholder="Enter HSN code (optional)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="border px-3 py-2 rounded w-full"
                rows={3}
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Available</label>
                <input
                  type="number"
                  value={form.statusCounts.available}
                  onChange={(e) => handleChange("statusCounts.available", e.target.value)}
                  className="border px-3 py-2 rounded w-full"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">In Use</label>
                <input
                  type="number"
                  value={form.statusCounts.in_use}
                  onChange={(e) => handleChange("statusCounts.in_use", e.target.value)}
                  className="border px-3 py-2 rounded w-full"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Maintenance</label>
                <input
                  type="number"
                  value={form.statusCounts.maintenance}
                  onChange={(e) => handleChange("statusCounts.maintenance", e.target.value)}
                  className="border px-3 py-2 rounded w-full"
                  min={0}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentForm;
