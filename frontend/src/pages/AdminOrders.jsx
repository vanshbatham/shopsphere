import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Search,
  X,
  ShoppingBag,
  PackageCheck,
  PackageSearch,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "http://localhost:8080/api/v1";

// ─── Animation Variants (mirrors Orders.jsx for visual consistency) ──────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

// ─── Status Config (same palette as buyer-facing Orders.jsx) ────────────────

const STATUS_CONFIG = {
  PLACED: {
    icon: Clock,
    label: "Placed",
    className:
      "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900",
  },
  PROCESSING: {
    icon: Clock,
    label: "Processing",
    className:
      "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900",
  },
  SHIPPED: {
    icon: Truck,
    label: "Shipped",
    className: "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900",
  },
  DELIVERED: {
    icon: CheckCircle2,
    label: "Delivered",
    className:
      "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900",
  },
  CANCELLED: {
    icon: XCircle,
    label: "Cancelled",
    className:
      "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900",
  },
};

const STATUS_TABS = [
  "ALL",
  "PLACED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] || null;
  const Icon = cfg?.icon || null;
  return (
    <span
      className={`font-semibold text-xs rounded-full inline-flex px-3 items-center gap-1.5 h-7 ${cfg?.className || "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"}`}
    >
      {Icon && <Icon className="size-3.5" />}
      {cfg?.label || status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminOrders() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  // Map of userId -> { firstName, lastName, email }, resolved in one batch
  // call after orders load — avoids an N+1 lookup per row.
  const [buyerInfo, setBuyerInfo] = useState({});

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3500,
    );
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_BASE}/orders/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        navigate("/");
        return;
      }
      if (!res.ok) throw new Error("Failed to load orders.");
      const data = await res.json();
      // Most recent first
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setOrders(sorted);
      resolveBuyerInfo(sorted, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resolveBuyerInfo = async (orderList, token) => {
    const uniqueIds = [
      ...new Set(orderList.map((o) => o.userId).filter(Boolean)),
    ];
    if (uniqueIds.length === 0) return;
    try {
      const params = new URLSearchParams();
      uniqueIds.forEach((id) => params.append("userIds", id));
      const res = await fetch(
        `${API_BASE}/users/admin/lookup?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) return; // non-fatal — table just falls back to showing IDs
      const users = await res.json();
      const map = {};
      users.forEach((u) => {
        map[u.id] = u;
      });
      setBuyerInfo(map);
    } catch (err) {
      console.error("Failed to resolve buyer info", err);
    }
  };

  useEffect(() => {
    const currentRole = user?.role?.toUpperCase();
    if (!isAuthenticated || currentRole !== "ADMIN") {
      navigate("/");
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate]);

  const handleStatusUpdate = async (order, newStatus) => {
    setUpdatingOrderId(order.id);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${API_BASE}/orders/${order.id}/status?status=${newStatus}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Failed to mark order as ${newStatus}.`);
      }
      showNotification(
        `Order marked as ${newStatus.toLowerCase()}.`,
        "success",
      );
      // Optimistically patch local state instead of a full refetch
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, orderStatus: newStatus } : o,
        ),
      );
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getCountForStatus = (status) => {
    if (status === "ALL") return orders.length;
    return orders.filter((o) => o.orderStatus === status).length;
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter !== "ALL" && order.orderStatus !== activeFilter)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const buyer = buyerInfo[order.userId];
      const matchesOrder = order.orderNumber?.toLowerCase().includes(q);
      const matchesUser = order.userId?.toLowerCase().includes(q);
      const matchesSku = order.orderLineItems?.some((i) =>
        i.skuCode?.toLowerCase().includes(q),
      );
      const matchesBuyerName = buyer
        ? `${buyer.firstName} ${buyer.lastName}`.toLowerCase().includes(q)
        : false;
      const matchesBuyerEmail = buyer?.email?.toLowerCase().includes(q);
      return (
        matchesOrder ||
        matchesUser ||
        matchesSku ||
        matchesBuyerName ||
        matchesBuyerEmail
      );
    }
    return true;
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-950 min-h-screen w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 font-medium animate-pulse">
          <Loader2 className="size-4 animate-spin" /> Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 w-full min-h-screen relative">
      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100]"
          >
            <div
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold text-white ${notification.type === "error" ? "bg-red-600" : "bg-neutral-900 dark:bg-neutral-700"}`}
            >
              {notification.type === "error" ? (
                <AlertCircle className="h-5 w-5 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              )}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1700px] mx-auto px-4 md:px-8 py-10 w-full">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8 pb-6 border-b border-neutral-100 dark:border-neutral-800"
        >
          <motion.div variants={fadeUp}>
            <h1 className="font-black text-3xl tracking-tight text-neutral-900 dark:text-neutral-100">
              Manage Orders
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium">
              Track every order and move it through fulfillment.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500" />
            <input
              className="w-full pl-10 pr-9 h-10 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:bg-white dark:focus:bg-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 transition-all font-medium"
              placeholder="Search order #, SKU, buyer name, or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </motion.div>
        </motion.div>

        {/* ── Filter Tabs ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-2"
        >
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`relative font-semibold rounded-full text-sm flex px-4 items-center gap-2 h-9 shrink-0 transition-colors ${
                activeFilter === status
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100/80 dark:hover:bg-neutral-800"
              }`}
            >
              <span className="capitalize">
                {status === "ALL" ? "All Orders" : status.toLowerCase()}
              </span>
              <span
                className={`rounded-full text-[10px] px-1.5 font-bold py-0.5 ${
                  activeFilter === status
                    ? "bg-white/20 dark:bg-black/20 text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {getCountForStatus(status)}
              </span>
            </button>
          ))}
        </motion.div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900 text-sm font-medium">
            {error}
          </div>
        )}

        {/* ── Orders Table ─────────────────────────────────────────────────── */}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-center">
            <ShoppingBag className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-4" />
            <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
              No matching orders
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1.5">
              Try a different filter or search term.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-neutral-600 dark:text-neutral-400">
                <thead className="text-xs text-neutral-500 dark:text-neutral-400 uppercase bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Order</th>
                    <th className="px-6 py-4 font-semibold">Buyer</th>
                    <th className="px-6 py-4 font-semibold">Placed</th>
                    <th className="px-6 py-4 font-semibold">Items</th>
                    <th className="px-6 py-4 font-semibold">Total</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredOrders.map((order) => {
                      const itemCount =
                        order.orderLineItems?.reduce(
                          (s, i) => s + i.quantity,
                          0,
                        ) || 0;
                      const isUpdating = updatingOrderId === order.id;
                      const canShip = order.orderStatus === "PROCESSING";
                      const canDeliver = order.orderStatus === "SHIPPED";

                      return (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-neutral-900 dark:text-neutral-100">
                            #{order.orderNumber?.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-6 py-4">
                            {buyerInfo[order.userId] ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {buyerInfo[order.userId].firstName}{" "}
                                  {buyerInfo[order.userId].lastName}
                                </span>
                                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                  {buyerInfo[order.userId].email}
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono text-xs">
                                {order.userId?.slice(0, 8)}…
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4">{itemCount}</td>
                          <td className="px-6 py-4 font-bold text-neutral-900 dark:text-neutral-100">
                            {formatPrice(order.totalPrice)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={order.orderStatus} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            {canShip && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(order, "SHIPPED")
                                }
                                disabled={isUpdating}
                                className="gap-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs"
                              >
                                <PackageSearch className="size-3.5" />
                                {isUpdating ? "..." : "Mark Shipped"}
                              </Button>
                            )}
                            {canDeliver && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(order, "DELIVERED")
                                }
                                disabled={isUpdating}
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                              >
                                <PackageCheck className="size-3.5" />
                                {isUpdating ? "..." : "Mark Delivered"}
                              </Button>
                            )}
                            {!canShip && !canDeliver && (
                              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                —
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
