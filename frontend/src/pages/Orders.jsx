import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  Truck,
  XCircle,
  Clock,
  AlertCircle,
  ImageIcon,
  ShoppingBag,
  X,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import RateReviewModal from "@/components/RateReviewModal";

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 22, scale: 0.985 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.18 } },
};

const badgeVariant = {
  hidden: { opacity: 0, scale: 0.7, y: 4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 18 },
  },
};

// ─── Status Config ────────────────────────────────────────────────────────────

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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] || null;
  const Icon = cfg?.icon || null;
  return (
    <motion.span
      variants={badgeVariant}
      initial="hidden"
      animate="visible"
      className={`font-semibold text-xs rounded-full flex px-3 items-center gap-1.5 h-7 ${cfg?.className || "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"}`}
    >
      {Icon && <Icon className="size-3.5" />}
      {cfg?.label || status}
    </motion.span>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function OrderSkeleton() {
  return (
    <motion.div
      className="flex flex-col gap-5"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          custom={i - 1}
          variants={fadeUp}
          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex flex-col gap-5 animate-pulse"
          style={{ opacity: 1 - (i - 1) * 0.15 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-36 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
                <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
              </div>
              <div className="h-7 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
            </div>
            <div className="h-7 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
          </div>
          <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800" />
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="size-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
                />
              ))}
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-28 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
              <div className="h-9 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Filter Tab ───────────────────────────────────────────────────────────────

function FilterTab({ label, count, isActive, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      className={`relative font-semibold rounded-full text-sm flex px-4 items-center gap-2 h-9 shrink-0 transition-colors ${
        isActive
          ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm"
          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100/80 dark:hover:bg-neutral-800"
      }`}
    >
      <span className="capitalize">{label}</span>
      <motion.span
        layout
        className={`rounded-full text-[10px] px-1.5 font-bold py-0.5 transition-colors ${
          isActive
            ? "bg-white/20 dark:bg-black/20 text-white dark:text-neutral-900"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
        }`}
      >
        {count}
      </motion.span>
    </motion.button>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  index,
  formatPrice,
  formatDate,
  navigate,
  onReview,
}) {
  const totalItemsCount =
    order.orderLineItems?.reduce((s, i) => s + i.quantity, 0) || 0;
  const isDelivered = order.orderStatus === "DELIVERED";

  return (
    <motion.div
      custom={index}
      variants={cardVariant}
      layout
      whileHover={{
        y: -3,
        boxShadow:
          "0 8px 32px -4px rgba(0,0,0,0.10), 0 2px 8px -2px rgba(0,0,0,0.06)",
      }}
      transition={{ hover: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
    >
      <Card className="border-neutral-200 dark:border-neutral-700/60 p-5 gap-0 flex flex-col shadow-sm bg-white dark:bg-neutral-900">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5">
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <div className="flex flex-col">
              <span className="font-extrabold text-neutral-900 dark:text-neutral-100 text-sm tracking-tight">
                Order #{order.orderNumber?.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-neutral-400 dark:text-neutral-500 text-[11px] font-semibold mt-0.5 uppercase tracking-wider">
                Placed {formatDate(order.createdAt)}
              </span>
            </div>
            <StatusBadge status={order.orderStatus} />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
              {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
            </span>
            <span className="font-black text-neutral-900 dark:text-neutral-100 text-lg tracking-tight tabular-nums">
              {formatPrice(order.totalPrice)}
            </span>
          </div>
        </div>

        <Separator
          className="bg-neutral-100 dark:bg-neutral-800 mb-5"
          style={{ display: "block", height: "1px" }}
        />

        {/* Items + Actions Row */}
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
          {/* Thumbnail strip */}
          <div className="flex flex-wrap items-start gap-4">
            {order.orderLineItems?.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 w-16">
                <motion.div
                  whileHover={{
                    scale: 1.1,
                    y: -2,
                    boxShadow: "0 6px 16px -2px rgba(0,0,0,0.12)",
                  }}
                  transition={{ type: "spring", stiffness: 340, damping: 18 }}
                  className="size-14 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center overflow-hidden p-1 relative cursor-default"
                  title={`${item.name} (Qty: ${item.quantity})`}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.skuCode}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <ImageIcon className="size-5 text-neutral-300 dark:text-neutral-600 opacity-60" />
                  )}
                  <span className="absolute bottom-0.5 right-0.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[9px] font-black h-3.5 min-w-3.5 px-1 rounded-md flex items-center justify-center border border-white dark:border-neutral-900 shadow-sm">
                    {item.quantity}
                  </span>
                </motion.div>

                {isDelivered && (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onReview(item)}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <Star className="size-3 shrink-0 fill-blue-600 dark:fill-blue-400" />{" "}
                    Review
                  </motion.button>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {order.orderStatus === "CANCELLED" || isDelivered ? (
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.96 }}
                className="font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-sm flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <RotateCcw className="size-4 shrink-0" /> Reorder
              </motion.button>
            ) : (
              <motion.button
                onClick={() => navigate(`/order-lifecycle/${order.id}`)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.96 }}
                className="font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-sm flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <MapPin className="size-4 shrink-0" /> Track Package
              </motion.button>
            )}

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
              <Button
                onClick={() => navigate(`/order-lifecycle/${order.id}`)}
                className="text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 h-9 font-bold text-xs hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-neutral-900 hover:border-neutral-900 dark:hover:border-white transition-all"
                variant="outline"
              >
                View Order
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const STATUS_TABS = ["ALL", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [reviewTarget, setReviewTarget] = useState(null);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  useEffect(() => {
    const fetchOrdersAndProducts = async () => {
      const token = localStorage.getItem("accessToken");
      if (!isAuthenticated && !token) {
        navigate("/login");
        return;
      }
      try {
        const orderRes = await fetch("http://localhost:8080/api/v1/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!orderRes.ok) throw new Error("Failed to load your order history.");
        const ordersData = await orderRes.json();

        const prodRes = await fetch("http://localhost:8080/api/v1/products");
        const prodData = await prodRes.json();
        const catalogProducts = prodData.content || prodData || [];

        const enriched = ordersData.map((order) => {
          const itemsWithImages = (order.orderLineItems || []).map((item) => {
            const matched = catalogProducts.find(
              (p) => p.skuCode === item.skuCode,
            );
            return {
              ...item,
              imageUrl: matched?.imageUrl || "",
              name: matched?.name || "Product Item",
            };
          });
          return { ...order, orderLineItems: itemsWithImages };
        });
        setOrders(enriched);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrdersAndProducts();
  }, [isAuthenticated, navigate]);

  const getCountForStatus = (statusGroup) => {
    if (statusGroup === "ALL") return orders.length;
    if (statusGroup === "PROCESSING")
      return orders.filter(
        (o) => o.orderStatus === "PROCESSING" || o.orderStatus === "PLACED",
      ).length;
    return orders.filter((o) => o.orderStatus === statusGroup).length;
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "PROCESSING") {
      if (order.orderStatus !== "PROCESSING" && order.orderStatus !== "PLACED")
        return false;
    } else if (activeFilter !== "ALL" && order.orderStatus !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(q) ||
        order.orderLineItems?.some((i) => i.skuCode?.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 w-full min-h-screen">
        <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full">
          <div className="flex mb-8 justify-between items-end pb-2 animate-pulse">
            <div className="flex flex-col gap-2">
              <div className="h-8 w-44 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
              <div className="h-4 w-64 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-72 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
              <div className="h-10 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 mb-8 pb-2 border-b border-neutral-100 dark:border-neutral-800 animate-pulse">
            {STATUS_TABS.map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-full"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
          <OrderSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 w-full min-h-screen relative">
      {/* ── Toast ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-[100]"
          >
            <div
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold text-white ${
                notification.type === "error"
                  ? "bg-red-600"
                  : "bg-neutral-900 dark:bg-neutral-700"
              }`}
              style={{ boxShadow: "0 8px 32px -4px rgba(0,0,0,0.22)" }}
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

      {/* ── Rate & Review Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {reviewTarget && (
          <RateReviewModal
            skuCode={reviewTarget.skuCode}
            productName={reviewTarget.name}
            onClose={() => setReviewTarget(null)}
            onSubmitted={() => {
              setReviewTarget(null);
              showNotification("Review published!", "success");
            }}
          />
        )}
      </AnimatePresence>

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full">
        {/* ── Page Header ────────────────────────────────────────────────── */}
        <motion.div
          className="flex mb-8 flex-col sm:flex-row justify-between sm:items-end gap-4 pb-2"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="flex flex-col gap-1">
            <h1 className="font-black text-neutral-900 dark:text-neutral-100 text-3xl tracking-tight">
              My Orders
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              Track and manage all your secure purchases
            </p>
          </motion.div>

          {/* Search + Filter */}
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 size-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
              <input
                className="pl-10 pr-9 h-10 w-72 rounded-full
                           border border-neutral-200 dark:border-neutral-700
                           bg-neutral-50/50 dark:bg-neutral-900
                           text-sm text-neutral-900 dark:text-neutral-100
                           placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                           outline-none focus:bg-white dark:focus:bg-neutral-800
                           focus:border-neutral-400 dark:focus:border-neutral-500
                           focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800
                           transition-all font-medium"
                placeholder="Search order ID or SKU…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  >
                    <X className="size-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <Button
              className="text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 gap-2 h-10 font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
              variant="outline"
            >
              <SlidersHorizontal className="size-4" /> Filter
            </Button>
          </motion.div>
        </motion.div>

        {/* ── Filter Tabs ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex mb-8 items-center gap-1.5 overflow-x-auto pb-2 border-b border-neutral-100 dark:border-neutral-800"
        >
          {STATUS_TABS.map((statusGroup) => (
            <FilterTab
              key={statusGroup}
              label={
                statusGroup === "ALL" ? "All Orders" : statusGroup.toLowerCase()
              }
              count={getCountForStatus(statusGroup)}
              isActive={activeFilter === statusGroup}
              onClick={() => setActiveFilter(statusGroup)}
            />
          ))}
        </motion.div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 mb-6 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Orders List ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {filteredOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center py-24 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mb-4"
              >
                <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                </div>
              </motion.div>
              <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                No matching orders found
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1.5 max-w-xs font-medium leading-relaxed">
                There are no matching transaction history updates under this
                selection right now.
              </p>
              {(searchQuery || activeFilter !== "ALL") && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-5"
                >
                  <Button
                    variant="outline"
                    className="border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 text-xs font-semibold"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("ALL");
                    }}
                  >
                    Clear filters
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`${activeFilter}-${searchQuery}`}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              className="flex flex-col gap-5"
            >
              {filteredOrders.map((order, i) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={i}
                  formatPrice={formatPrice}
                  formatDate={formatDate}
                  navigate={navigate}
                  onReview={(item) =>
                    setReviewTarget({ skuCode: item.skuCode, name: item.name })
                  }
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pagination Footer ──────────────────────────────────────────── */}
        <AnimatePresence>
          {filteredOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex mt-10 justify-between items-center border-t border-neutral-100 dark:border-neutral-800 pt-6"
            >
              <span className="text-neutral-400 dark:text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                Showing {filteredOrders.length} of {orders.length} orders
              </span>
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Button
                    className="text-neutral-700 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 gap-1.5 h-9 font-semibold text-xs"
                    variant="outline"
                    disabled
                  >
                    <ChevronLeft className="size-4" /> Previous
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Button
                    className="text-neutral-700 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 gap-1.5 h-9 font-semibold text-xs"
                    variant="outline"
                    disabled
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
