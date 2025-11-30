// frontend/src/App.tsx
import { useState, useEffect } from "react";
import { Package, Plus } from "lucide-react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import EquipmentTable from "./components/EquipmentTable";
import EquipmentForm from "./components/EquipmentForm";
import CategorySidebar from "./components/CategorySidebar";
import InvoicePage from "./components/InvoicePage";
import CartPage from "./components/CartPage";
import ExhaustedPage from "./components/ExhaustedPage";

import { Equipment, EquipmentStats } from "./types/Equipment";

// ==========================
// API BASE URL
// ==========================
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `http://${window.location.hostname}:5000/api`;

// ==========================
// HTTP Helper
// ==========================
async function apiFetch(url: string, options: RequestInit = {}) {
  const fullUrl = url.startsWith("/") ? `${API_BASE}${url}` : url;

  const token = localStorage.getItem("gnr_token");
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(fullUrl, { ...options, headers });

  if (!res.ok) {
    const txt = await res.text();
    let parsed: any = txt;
    try {
      parsed = JSON.parse(txt);
    } catch {}

    const message = parsed?.message || txt || res.statusText;
    throw new Error(`${res.status} ${message}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ==========================
// Fetch helpers
// ==========================
async function fetchEquipment(params: {
  category?: string;
  search?: string;
  status?: string;
} = {}): Promise<Equipment[]> {
  const q = new URLSearchParams();
  if (params.category && params.category !== "all")
    q.append("category", params.category);
  if (params.search) q.append("search", params.search);
  if (params.status && params.status !== "all")
    q.append("status", params.status);

  return apiFetch(`/equipment?${q.toString()}`);
}

async function fetchStats(): Promise<EquipmentStats> {
  return apiFetch("/stats/summary");
}

// ==========================
// MAIN APP
// ==========================
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    Boolean(localStorage.getItem("gnr_token"))
  );
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // --------------------------
  // CART
  // --------------------------
  const [cart, setCart] = useState<
    Record<
      string,
      { id: string; name: string; qty: number; unitPrice: number; hsnCode?: string; unit?: string }
    >
  >(() => {
    try {
      const raw = localStorage.getItem("gnr_cart");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      Object.keys(parsed).forEach((k) => {
        parsed[k].hsnCode = parsed[k].hsnCode || "";
        parsed[k].unit = parsed[k].unit || "UNT";
      });
      return parsed;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("gnr_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const updateCart = (id: string, qty: number) => {
    setCart((prev) => {
      const copy = { ...prev };
      if (qty <= 0) {
        delete copy[id];
      } else {
        const existing = copy[id] || { id, name: "Item", unitPrice: 0, hsnCode: "", unit: "UNT" };
        copy[id] = { ...existing, qty };
      }
      return copy;
    });
  };

  const addToCart = async (item: Equipment) => {
    setCart((prev) => {
      const existing =
        prev[item._id] || {
          id: item._id,
          name: item.name,
          qty: 0,
          unitPrice: item.costPerUnit || 0,
          hsnCode: (item as any).hsnCode || "",
          unit: (item as any).unit || "UNT",
        };
      return {
        ...prev,
        [item._id]: { ...existing, qty: existing.qty + 1 },
      };
    });

    try {
      await handleUpdateStatus(item._id, "available", -1);
      await loadData();
    } catch {}
  };

  const removeFromCart = async (id: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      if (!copy[id]) return copy;
      const newQty = copy[id].qty - 1;
      if (newQty <= 0) delete copy[id];
      else copy[id] = { ...copy[id], qty: newQty };
      return copy;
    });

    try {
      await handleUpdateStatus(id, "available", +1);
      await loadData();
    } catch {}
  };

  const clearCart = () => setCart({});

  const handleLogin = async (username: string, password: string) => {
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (res?.token) {
        localStorage.setItem("gnr_token", res.token);
        setIsLoggedIn(true);
        return { ok: true };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gnr_token");
    setIsLoggedIn(false);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    loadData();
  }, [selectedCategory, selectedStatus, searchTerm, isLoggedIn]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eq, st] = await Promise.all([
        fetchEquipment({
          category: selectedCategory,
          search: searchTerm,
          status: selectedStatus,
        }),
        fetchStats(),
      ]);
      setEquipment(eq);
      setStats(st);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditEquipment = (item: Equipment) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!window.confirm("Delete this item?")) return;
    await apiFetch(`/equipment/${id}`, { method: "DELETE" });
    await loadData();
  };

  const handleSaveEquipment = async (data: Partial<Equipment>) => {
    if (editingItem) {
      await apiFetch(`/equipment/${editingItem._id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } else {
      await apiFetch("/equipment", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    await loadData();
  };

  const handleUpdateStatus = async (id: string, status: any, change: number) => {
    await apiFetch(`/equipment/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, change }),
    });
  };

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  if (loading && !stats)
    return <div className="p-10 text-center">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* HOME */}
        <Route
          path="/"
          element={
            <div>
              <header className="bg-white shadow-sm">
                <div className="p-4 flex justify-between items-center">
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <Package className="text-blue-600" /> GNR SURGICALS
                  </h1>

                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      className="border px-3 py-1 rounded"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <button
                      onClick={handleAddEquipment}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </button>

                    <Link to="/cart" className="bg-yellow-600 text-white px-3 py-1 rounded">
                      Cart ({Object.values(cart).reduce((s, a) => s + a.qty, 0)})
                    </Link>

                    <Link to="/invoice" className="bg-green-600 text-white px-3 py-1 rounded">
                      Invoice
                    </Link>

                    <Link to="/exhausted" className="bg-red-600 text-white px-3 py-1 rounded">
                      Exhausted
                    </Link>

                    <button onClick={handleLogout} className="px-3 py-1 border rounded">
                      Logout
                    </button>
                  </div>
                </div>
              </header>

              <div className="flex">
                <CategorySidebar
                  categories={stats?.categoryTotals || {}}
                  selectedCategory={selectedCategory}
                  selectedStatus={selectedStatus}
                  onCategoryChange={setSelectedCategory}
                  onStatusChange={setSelectedStatus}
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                />

                <main className="flex-1 p-4">
                  {stats && <Dashboard stats={stats} />}
                  <EquipmentTable
                    equipment={equipment}
                    onEdit={handleEditEquipment}
                    onDelete={handleDeleteEquipment}
                    onUpdateStatus={handleUpdateStatus}
                    loading={loading}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                  />
                </main>
              </div>

              {showForm && (
                <EquipmentForm
                  equipment={editingItem}
                  onSave={handleSaveEquipment}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                />
              )}
            </div>
          }
        />

        {/* CART */}
        <Route
          path="/cart"
          element={
            <CartPage
              cart={cart}
              updateCart={updateCart}
              removeFromCart={(id) => updateCart(id, 0)}
            />
          }
        />

        {/* INVOICE */}
        <Route
          path="/invoice"
          element={
            <InvoicePage cart={cart} updateCart={updateCart} clearCart={clearCart} gstPercentage={5} />
          }
        />

        {/* EXHAUSTED PAGE */}
        <Route
          path="/exhausted"
          element={
            <ExhaustedPage
              items={equipment.filter((i) => i.statusCounts.available <= 0)}

            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
