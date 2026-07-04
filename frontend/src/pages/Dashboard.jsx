import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Box,
  ImageIcon,
  Pencil,
  Trash2,
  TrendingUp,
  PieChart,
  Upload,
  Loader2,
  LayoutGrid,
  Wallet,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "http://localhost:8080/api/v1";

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Donut Chart Palette ──────────────────────────────────────────────────────

const PALETTE = [
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#10b981", // Emerald
  "#f43f5e", // Rose
  "#0ea5e9", // Cyan
  "#f97316", // Orange
  "#84cc16", // Lime
];

// ─── Enhanced Category Donut Chart ────────────────────────────────────────────

function CategoryDonutChart({ data, formatPrice }) {
  const size = 220;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const fraction = total > 0 ? d.value / total : 0;
    const length = fraction * circumference;
    const dashoffset = -cumulative;
    cumulative += length;
    return {
      ...d,
      length,
      dashoffset,
      color: PALETTE[i % PALETTE.length],
      pct: total > 0 ? Math.round(fraction * 100) : 0,
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14 py-4">
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Decorative glow behind the chart */}
        <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl scale-110 pointer-events-none" />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="relative z-10"
          style={{ filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.1))" }}
        >
          {/* Base track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-neutral-100 dark:stroke-neutral-800/80"
          />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments.map((seg, i) => (
              <motion.circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                strokeLinecap={segments.length > 1 ? "butt" : "round"}
                // Animate the drawing of the donut lines
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: seg.dashoffset }}
                transition={{
                  duration: 1.5,
                  ease: "easeOut",
                  delay: 0.1 + i * 0.05,
                }}
                className="transition-all duration-300 hover:opacity-80 cursor-pointer"
              />
            ))}
          </g>
        </svg>

        {/* Central Data Display */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-1">
            Revenue
          </span>
          <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            {total > 0 ? formatPrice(total) : "₹0"}
          </span>
        </motion.div>
      </div>

      {/* Enhanced Legend */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {segments.length === 0 ? (
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 text-center">
            <p className="text-sm text-neutral-400 dark:text-neutral-500 font-medium">
              No completed sales yet.
            </p>
          </div>
        ) : (
          segments.map((seg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="group flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center size-8 rounded-lg bg-white dark:bg-neutral-900 shadow-sm border border-neutral-100 dark:border-neutral-800 shrink-0 group-hover:scale-105 transition-transform">
                  <span
                    className="size-3 rounded-full"
                    style={{
                      backgroundColor: seg.color,
                      boxShadow: `0 0 8px ${seg.color}60`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                  {seg.label}
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-sm font-black text-neutral-900 dark:text-neutral-100 tabular-nums tracking-tight">
                  {formatPrice(seg.value)}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md mt-0.5">
                  {seg.pct}%
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Enhanced Stat Card ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm hover:shadow-lg dark:hover:shadow-indigo-500/5 transition-all duration-300 group"
    >
      {/* Decorative background icon watermark */}
      <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05] transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 pointer-events-none">
        <Icon className="size-32" />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 shadow-inner">
            <Icon className="size-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            {label}
          </span>
        </div>
        <p className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("products"); // "products" | "earnings"

  // --- Inventory Modal State ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentStock, setCurrentStock] = useState(null);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState("");
  const [isSubmittingInventory, setIsSubmittingInventory] = useState(false);

  // --- Add/Edit Product Modal State ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [editingProductId, setEditingProductId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    skuCode: "",
    categoryId: "",
  });
  const [existingImageUrls, setExistingImageUrls] = useState([]); // strings, edit mode
  const [newImageFiles, setNewImageFiles] = useState([]); // File objects
  const [newImagePreviews, setNewImagePreviews] = useState([]); // object URLs
  const fileInputRef = useRef(null);

  // --- Delete Confirm State ---
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Earnings State ---
  const [earnings, setEarnings] = useState({
    isLoading: true,
    error: "",
    skuSummaries: [],
    totalRevenue: 0,
    totalUnits: 0,
    categoryBreakdown: [],
    topProducts: [],
  });

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const showNotification = (message, type = "error") => {
    setActionMessage({ type, text: message });
    setTimeout(() => setActionMessage({ type: "", text: "" }), 3500);
  };

  // ── Fetch seller's products ────────────────────────────────────────────────
  const fetchSellerProducts = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/products/seller/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch your inventory.");
      const data = await response.json();
      setProducts(data.content || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const currentRole = user?.role?.toUpperCase();
    if (
      !isAuthenticated ||
      (currentRole !== "SELLER" && currentRole !== "ADMIN")
    ) {
      navigate("/");
      return;
    }
    if (user?.id) fetchSellerProducts();
  }, [isAuthenticated, user, navigate, fetchSellerProducts]);

  // ── Fetch earnings summary (only when Earnings tab is opened) ─────────────
  useEffect(() => {
    if (activeTab !== "earnings" || products.length === 0) return;

    const fetchEarnings = async () => {
      setEarnings((prev) => ({ ...prev, isLoading: true, error: "" }));
      try {
        const params = new URLSearchParams();
        products.forEach((p) => params.append("skuCodes", p.skuCode));

        const token = localStorage.getItem("accessToken");
        const res = await fetch(
          `${API_BASE}/orders/seller-summary?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error("Failed to load earnings data.");
        const summaries = await res.json();

        const summaryBySku = Object.fromEntries(
          summaries.map((s) => [s.skuCode, s]),
        );

        let totalRevenue = 0;
        let totalUnits = 0;
        const categoryMap = {};

        const productsWithRevenue = products.map((p) => {
          const s = summaryBySku[p.skuCode];
          const revenue = s?.revenue || 0;
          const quantitySold = s?.quantitySold || 0;
          totalRevenue += revenue;
          totalUnits += quantitySold;

          const catName =
            typeof p.category === "string"
              ? p.category
              : p.category?.name || "Uncategorized";
          if (revenue > 0) {
            categoryMap[catName] = (categoryMap[catName] || 0) + revenue;
          }

          return { ...p, revenue, quantitySold };
        });

        const categoryBreakdown = Object.entries(categoryMap)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value);

        const topProducts = [...productsWithRevenue]
          .sort((a, b) => b.revenue - a.revenue)
          .filter((p) => p.revenue > 0)
          .slice(0, 5);

        setEarnings({
          isLoading: false,
          error: "",
          skuSummaries: summaries,
          totalRevenue,
          totalUnits,
          categoryBreakdown,
          topProducts,
        });
      } catch (err) {
        setEarnings((prev) => ({
          ...prev,
          isLoading: false,
          error: err.message,
        }));
      }
    };

    fetchEarnings();
  }, [activeTab, products]);

  // ── Add/Edit Product Modal ─────────────────────────────────────────────────

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      skuCode: "",
      categoryId: "",
    });
    setExistingImageUrls([]);
    newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewImageFiles([]);
    setNewImagePreviews([]);
  };

  const openAddProductModal = async () => {
    resetProductForm();
    setModalMode("add");
    setEditingProductId(null);
    setIsProductModalOpen(true);

    try {
      const response = await fetch(`${API_BASE}/products/categories`);
      if (response.ok) setCategories(await response.json());
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const openEditProductModal = async (product) => {
    setModalMode("edit");
    setEditingProductId(product.id);

    const catName =
      typeof product.category === "string"
        ? product.category
        : product.category?.name || "";

    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      skuCode: product.skuCode || "",
      categoryId: "", // resolved below once categories load
    });

    const gallery =
      product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : product.imageUrl
          ? [product.imageUrl]
          : [];
    setExistingImageUrls(gallery);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setIsProductModalOpen(true);

    try {
      const response = await fetch(`${API_BASE}/products/categories`);
      if (response.ok) {
        const cats = await response.json();
        setCategories(cats);
        // ProductResponse only returns category NAME, not id — match by name
        // so the dropdown can preselect it. If no match, seller re-picks.
        const match = cats.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase(),
        );
        if (match) {
          setProductForm((prev) => ({ ...prev, categoryId: match.id }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    resetProductForm();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewImageFiles((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [...prev, ...previews]);
    e.target.value = ""; // allow re-selecting the same file
  };

  const removeExistingImage = (index) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setIsSubmittingProduct(true);
    setActionMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("accessToken");

      // 1. Upload any newly-selected files first
      let uploadedUrls = [];
      if (newImageFiles.length > 0) {
        const formData = new FormData();
        newImageFiles.forEach((file) => formData.append("files", file));

        const uploadRes = await fetch(`${API_BASE}/products/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }, // no Content-Type — browser sets multipart boundary
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload images.");
        const uploadData = await uploadRes.json();
        uploadedUrls = uploadData.imageUrls || [];
      }

      const finalImageUrls = [...existingImageUrls, ...uploadedUrls];

      const body = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        skuCode: productForm.skuCode,
        imageUrl: finalImageUrls[0] || "",
        imageUrls: finalImageUrls,
      };

      if (modalMode === "add") {
        const response = await fetch(
          `${API_BASE}/products/category/${productForm.categoryId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          },
        );
        if (!response.ok) {
          throw new Error(
            "Failed to create product. Check your permissions or SKU uniqueness.",
          );
        }
        showNotification("Product created successfully!", "success");
      } else {
        const response = await fetch(
          `${API_BASE}/products/${editingProductId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          },
        );
        if (!response.ok) throw new Error("Failed to update product.");
        showNotification("Product updated successfully!", "success");
      }

      closeProductModal();
      fetchSellerProducts();
    } catch (err) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // ── Delete Product ─────────────────────────────────────────────────────────

  const confirmDeleteProduct = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE}/products/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete product.");
      showNotification("Product deleted.", "success");
      setDeleteTarget(null);
      fetchSellerProducts();
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Inventory Modal ─────────────────────────────────────────────────────────

  const openStockModal = async (product) => {
    setSelectedProduct(product);
    setCurrentStock(null);
    setQuantityToAdd("");
    setActionMessage({ type: "", text: "" });
    setIsCheckingStock(true);

    try {
      const response = await fetch(`${API_BASE}/inventory/${product.skuCode}`);
      if (response.ok) {
        const textData = await response.text();
        try {
          const jsonData = JSON.parse(textData);
          setCurrentStock(jsonData.availableQuantity ?? jsonData.quantity ?? 0);
        } catch {
          setCurrentStock(textData || 0);
        }
      } else if (response.status === 404) {
        setCurrentStock(0);
      } else {
        throw new Error("Failed to fetch stock");
      }
    } catch (err) {
      setCurrentStock("Error");
    } finally {
      setIsCheckingStock(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!quantityToAdd || quantityToAdd < 1) return;

    setIsSubmittingInventory(true);
    setActionMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE}/inventory/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skuCode: selectedProduct.skuCode,
          quantity: parseInt(quantityToAdd),
        }),
      });
      if (!response.ok) throw new Error("Failed to add stock.");

      setActionMessage({ type: "success", text: "Stock added successfully!" });
      setQuantityToAdd("");
      setCurrentStock(
        (prev) => (parseInt(prev) || 0) + parseInt(quantityToAdd),
      );
    } catch (err) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmittingInventory(false);
    }
  };

  if (isLoading)
    return (
      <div className="bg-white dark:bg-neutral-950 min-h-screen w-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400 font-semibold animate-pulse">
          <div className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
            <Loader2 className="size-5 animate-spin text-indigo-500" />
          </div>
          Loading your workspace...
        </div>
      </div>
    );

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 w-full min-h-screen relative selection:bg-indigo-500/30">
      <main className="max-w-[1440px] mx-auto py-10 px-4 md:px-8 w-full">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Overview
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              Seller Dashboard
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm font-medium">
              Manage your products, stock, and track your earnings.
            </p>
          </div>
          {activeTab === "products" && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={openAddProductModal}
                className="gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-bold shadow-lg dark:shadow-white/10"
              >
                <Plus className="h-4 w-4" /> Add New Product
              </Button>
            </motion.div>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-8 bg-neutral-100/50 dark:bg-neutral-900/50 p-1.5 rounded-2xl w-fit border border-neutral-200 dark:border-neutral-800">
          {[
            { key: "products", label: "Products", icon: LayoutGrid },
            { key: "earnings", label: "Earnings", icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === key
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 border border-transparent hover:bg-white/50 dark:hover:bg-neutral-800/30"
              }`}
            >
              <Icon
                className={`size-4 ${activeTab === key ? "text-indigo-500" : ""}`}
              />{" "}
              {label}
            </button>
          ))}
        </div>

        {/* ── Global Action Message ───────────────────────────────────────── */}
        <AnimatePresence>
          {actionMessage.text &&
            !selectedProduct &&
            !isProductModalOpen &&
            !deleteTarget && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                className={`p-4 rounded-xl mb-8 flex items-center gap-3 border shadow-sm ${
                  actionMessage.type === "error"
                    ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50"
                    : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${actionMessage.type === "error" ? "bg-red-100 dark:bg-red-900/50" : "bg-emerald-100 dark:bg-emerald-900/50"}`}
                >
                  {actionMessage.type === "error" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </div>
                <span className="font-semibold text-sm">
                  {actionMessage.text}
                </span>
              </motion.div>
            )}
        </AnimatePresence>

        {/* ── PRODUCTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "products" &&
          (error ? (
            <div className="p-6 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900 font-medium">
              <AlertCircle className="h-5 w-5 mb-2" />
              {error}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-center"
            >
              <div className="size-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <Package className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="font-black text-2xl text-neutral-900 dark:text-neutral-100">
                Your catalog is empty
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2 max-w-sm mb-6">
                Start building your store by adding your first product. It only
                takes a few minutes.
              </p>
              <Button
                onClick={openAddProductModal}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                <Plus className="h-4 w-4" /> Create Product
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="px-6 py-5">Product Details</th>
                      <th className="px-6 py-5">SKU Code</th>
                      <th className="px-6 py-5">Category</th>
                      <th className="px-6 py-5">Price</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="group hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-700 shrink-0">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <ImageIcon
                              className="h-5 w-5 text-neutral-400 dark:text-neutral-500"
                              style={{
                                display: product.imageUrl ? "none" : "flex",
                              }}
                            />
                          </div>
                          <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[200px] md:max-w-xs text-base">
                            {product.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                            {product.skuCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-neutral-600 dark:text-neutral-300">
                          {typeof product.category === "string"
                            ? product.category
                            : product.category?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 font-black text-neutral-900 dark:text-neutral-100 text-base tabular-nums">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openStockModal(product)}
                              className="gap-1.5 h-8 font-semibold border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                            >
                              <Box className="h-3.5 w-3.5" /> Stock
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditProductModal(product)}
                              className="h-8 w-8 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setDeleteTarget(product)}
                              className="h-8 w-8 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}

        {/* ── EARNINGS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "earnings" && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col gap-6"
          >
            {products.length === 0 ? (
              <motion.div
                variants={fadeUp}
                className="flex flex-col items-center justify-center py-32 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-center"
              >
                <div className="size-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
                </div>
                <h3 className="font-black text-2xl text-neutral-900 dark:text-neutral-100">
                  No earnings data yet
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2 max-w-sm">
                  Add products to your catalog and start making sales to see
                  your revenue breakdown here.
                </p>
              </motion.div>
            ) : earnings.isLoading ? (
              <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400 font-semibold py-20 justify-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                <Loader2 className="size-5 animate-spin text-indigo-500" />{" "}
                Calculating metrics...
              </div>
            ) : earnings.error ? (
              <div className="p-6 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900 font-medium">
                <AlertCircle className="h-5 w-5 mb-2" />
                {earnings.error}
              </div>
            ) : (
              <>
                {/* Stat cards */}
                <motion.div
                  variants={fadeUp}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                >
                  <StatCard
                    icon={Wallet}
                    label="Total Revenue"
                    value={formatPrice(earnings.totalRevenue)}
                  />
                  <StatCard
                    icon={ShoppingBag}
                    label="Units Sold"
                    value={earnings.totalUnits.toLocaleString("en-IN")}
                  />
                  <StatCard
                    icon={Package}
                    label="Active Listings"
                    value={products.length}
                  />
                </motion.div>
                <motion.p
                  variants={fadeUp}
                  className="text-xs font-medium text-neutral-400 dark:text-neutral-500 -mt-2 ml-1"
                >
                  * Revenue counts only orders with a completed payment status.
                </motion.p>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6 mt-4">
                  {/* Category breakdown donut */}
                  <motion.div
                    variants={fadeUp}
                    className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm flex flex-col justify-center"
                  >
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <PieChart className="size-5" />
                      </div>
                      <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                        Revenue Distribution
                      </h3>
                    </div>
                    <CategoryDonutChart
                      data={earnings.categoryBreakdown}
                      formatPrice={formatPrice}
                    />
                  </motion.div>

                  {/* Top products */}
                  {earnings.topProducts.length > 0 && (
                    <motion.div
                      variants={fadeUp}
                      className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="p-8 pb-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <TrendingUp className="size-5" />
                        </div>
                        <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                          Top Performing Products
                        </h3>
                      </div>
                      <div className="overflow-x-auto flex-1 p-2">
                        <table className="w-full text-sm text-left">
                          <thead className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                            <tr>
                              <th className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                                Product
                              </th>
                              <th className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 text-right">
                                Units
                              </th>
                              <th className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 text-right">
                                Revenue
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {earnings.topProducts.map((p) => (
                              <tr
                                key={p.id}
                                className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors"
                              >
                                <td className="px-6 py-4 font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-50 dark:border-neutral-800/50">
                                  {p.name}
                                </td>
                                <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 font-semibold tabular-nums text-right border-b border-neutral-50 dark:border-neutral-800/50">
                                  <span className="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                                    {p.quantitySold}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-black text-neutral-900 dark:text-neutral-100 tabular-nums text-right text-base border-b border-neutral-50 dark:border-neutral-800/50">
                                  {formatPrice(p.revenue)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── ADD/EDIT PRODUCT MODAL ───────────────────────────────────────── */}
        <AnimatePresence>
          {isProductModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, type: "spring", bounce: 0.4 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                  <div>
                    <h3 className="font-black text-xl text-neutral-900 dark:text-neutral-100 tracking-tight">
                      {modalMode === "add"
                        ? "Create New Product"
                        : "Edit Product"}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
                      {modalMode === "add"
                        ? "Add a new item to your catalog."
                        : "Update this product's details."}
                    </p>
                  </div>
                  <button
                    onClick={closeProductModal}
                    className="h-10 w-10 rounded-full bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitProduct} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
                        Product Name
                      </label>
                      <Input
                        required
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g. Sony PlayStation 5"
                        className="h-11 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 font-medium"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
                        Description
                      </label>
                      <Input
                        required
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Brief product description"
                        className="h-11 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
                        SKU Code
                      </label>
                      <Input
                        required
                        disabled={modalMode === "edit"}
                        value={productForm.skuCode}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            skuCode: e.target.value,
                          })
                        }
                        placeholder="e.g. SONY-PS5-01"
                        className="h-11 font-mono text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 disabled:opacity-60 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
                        Price (₹)
                      </label>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: e.target.value,
                          })
                        }
                        placeholder="49990"
                        className="h-11 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 font-bold tabular-nums"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
                        Category
                      </label>
                      <select
                        required
                        value={productForm.categoryId}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            categoryId: e.target.value,
                          })
                        }
                        className="flex h-11 w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <option value="" disabled>
                          Select a category...
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {modalMode === "edit" && !productForm.categoryId && (
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                          <AlertCircle className="size-3" /> Please re-select
                          category.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ── Image Upload ─────────────────────────────────────── */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-3">
                      Product Images
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {existingImageUrls.map((url, i) => (
                        <div
                          key={`existing-${i}`}
                          className="relative size-24 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 group shadow-sm"
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {i === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-neutral-900/80 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest text-center py-1">
                              COVER
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(i)}
                            className="absolute top-1.5 right-1.5 size-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}

                      {newImagePreviews.map((url, i) => (
                        <div
                          key={`new-${i}`}
                          className="relative size-24 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 group shadow-sm"
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {existingImageUrls.length === 0 && i === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-neutral-900/80 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest text-center py-1">
                              COVER
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeNewImage(i)}
                            className="absolute top-1.5 right-1.5 size-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="size-24 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center gap-1.5 text-neutral-400 dark:text-neutral-500 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                      >
                        <Upload className="size-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Add
                        </span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mt-3">
                      First image is used as the cover. Drag isn't supported yet
                      — remove and re-add in order if you need to reorder.
                    </p>
                  </div>

                  {actionMessage.text && isProductModalOpen && (
                    <div
                      className={`text-sm font-bold rounded-xl px-4 py-3 border ${
                        actionMessage.type === "error"
                          ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50"
                          : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50"
                      }`}
                    >
                      {actionMessage.text}
                    </div>
                  )}

                  <div className="pt-6 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeProductModal}
                      className="font-bold border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingProduct}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      {isSubmittingProduct ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {modalMode === "add" ? "Creating..." : "Saving..."}
                        </>
                      ) : modalMode === "add" ? (
                        "Create Product"
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────────── */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex flex-col items-center text-center gap-4 mb-6">
                  <div className="size-16 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/50">
                    <Trash2 className="size-7 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-neutral-900 dark:text-neutral-100 mb-1">
                      Delete Product
                    </h3>
                    <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">
                      {deleteTarget.name}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-8 text-center bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg">
                  This permanently removes the product from your catalog. This
                  action cannot be undone.
                </p>
                <div className="flex justify-center gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteTarget(null)}
                    disabled={isDeleting}
                    className="flex-1 font-bold dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDeleteProduct}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Yes, Delete"
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── INVENTORY MODAL ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex items-center justify-between p-6 px-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                  <div>
                    <h3 className="font-black text-xl text-neutral-900 dark:text-neutral-100">
                      Manage Stock
                    </h3>
                    <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[250px]">
                      {selectedProduct.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="h-10 w-10 rounded-full bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-8">
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-5 mb-8 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-800">
                        <Box className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                          Current Stock
                        </p>
                        <p className="font-mono text-xs font-semibold text-neutral-400 dark:text-neutral-500 mt-1">
                          SKU: {selectedProduct.skuCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tabular-nums tracking-tight">
                      {isCheckingStock ? (
                        <RefreshCw className="h-6 w-6 animate-spin text-neutral-400 dark:text-neutral-500" />
                      ) : (
                        currentStock
                      )}
                    </div>
                  </div>

                  {actionMessage.text && (
                    <div
                      className={`p-4 rounded-xl text-sm font-bold mb-6 flex items-start gap-3 border shadow-sm ${
                        actionMessage.type === "error"
                          ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50"
                          : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                      }`}
                    >
                      {actionMessage.type === "error" ? (
                        <AlertCircle className="h-5 w-5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                      )}
                      <span>{actionMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddStock} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
                        Quantity to Add
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={quantityToAdd}
                        onChange={(e) => setQuantityToAdd(e.target.value)}
                        disabled={isSubmittingInventory}
                        className="h-14 text-xl font-bold tabular-nums dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 text-center"
                        required
                        placeholder="e.g. 50"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 text-base shadow-md"
                      disabled={isSubmittingInventory || !quantityToAdd}
                    >
                      {isSubmittingInventory ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                          Processing...
                        </>
                      ) : (
                        "Confirm & Add Stock"
                      )}
                    </Button>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
