import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  CheckCircle,
  CreditCard,
  Download,
  MapPin,
  Package,
  Truck,
  ArrowLeft,
  AlertCircle,
  ImageIcon,
  XCircle,
  Banknote,
  Wallet,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";

// ─── Animation Variants ───────────────────────────────────────────────────────

const slideLeft = {
  hidden: { opacity: 0, x: -28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};
const slideRight = {
  hidden: { opacity: 0, x: 28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};
const dotVariant = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i = 0) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.3 + i * 0.18,
      type: "spring",
      stiffness: 380,
      damping: 18,
    },
  }),
};

// ─── Step color themes ────────────────────────────────────────────────────────
// Each lifecycle step gets its own accent color for visual richness

const STEP_THEMES = [
  {
    // Order Confirmed — blue
    dot: "bg-blue-600 dark:bg-blue-500 text-white shadow-blue-200 dark:shadow-blue-900",
    dotInactive:
      "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border-2 border-neutral-200 dark:border-neutral-700",
    line: "bg-blue-500 dark:bg-blue-400",
    pulse: "border-blue-400 dark:border-blue-300",
    label: "text-blue-700 dark:text-blue-400",
  },
  {
    // Processing — amber
    dot: "bg-amber-500 dark:bg-amber-400 text-white shadow-amber-200 dark:shadow-amber-900",
    dotInactive:
      "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border-2 border-neutral-200 dark:border-neutral-700",
    line: "bg-amber-500 dark:bg-amber-400",
    pulse: "border-amber-400 dark:border-amber-300",
    label: "text-amber-700 dark:text-amber-400",
  },
  {
    // Shipped — violet
    dot: "bg-violet-600 dark:bg-violet-500 text-white shadow-violet-200 dark:shadow-violet-900",
    dotInactive:
      "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border-2 border-neutral-200 dark:border-neutral-700",
    line: "bg-violet-500 dark:bg-violet-400",
    pulse: "border-violet-400 dark:border-violet-300",
    label: "text-violet-700 dark:text-violet-400",
  },
  {
    // Delivered — emerald
    dot: "bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-200 dark:shadow-emerald-900",
    dotInactive:
      "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border-2 border-neutral-200 dark:border-neutral-700",
    line: "bg-emerald-500 dark:bg-emerald-400",
    pulse: "border-emerald-400 dark:border-emerald-300",
    label: "text-emerald-700 dark:text-emerald-400",
  },
];

// ─── Animated Timeline Step ───────────────────────────────────────────────────

function TimelineStep({
  icon: Icon,
  label,
  sublabel,
  active,
  lineActive,
  last,
  index,
}) {
  const theme = STEP_THEMES[index] || STEP_THEMES[0];

  return (
    <div className="relative flex gap-6">
      {/* Dot + Line column */}
      <div className="flex flex-col items-center">
        <motion.div
          custom={index}
          variants={dotVariant}
          initial="hidden"
          animate="visible"
          className={`size-9 rounded-full flex justify-center items-center z-10 flex-shrink-0 relative shadow-md ${
            active ? theme.dot : theme.dotInactive
          }`}
        >
          <Icon className="size-4" />

          {/* Pulse ring — only on the leading active step */}
          {active && !last && (
            <motion.span
              className={`absolute inset-0 rounded-full border-2 ${theme.pulse}`}
              animate={{ scale: [1, 1.65], opacity: [0.6, 0] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </motion.div>

        {!last && (
          <div className="flex-1 w-0.5 min-h-[44px] relative overflow-hidden bg-neutral-200/60 dark:bg-neutral-700/60 rounded-full mt-0.5">
            <motion.div
              className={`absolute inset-x-0 top-0 rounded-full ${theme.line}`}
              initial={{ height: "0%" }}
              animate={{ height: lineActive ? "100%" : "0%" }}
              transition={{
                duration: 0.6,
                delay: 0.35 + index * 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>
        )}
      </div>

      {/* Text column */}
      <motion.div
        custom={index}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className={`flex pb-9 flex-col gap-1 mt-1 ${last ? "pb-0" : ""}`}
      >
        <p
          className={`font-bold text-base ${active ? theme.label : "text-neutral-400 dark:text-neutral-600"}`}
        >
          {label}
        </p>
        {sublabel && active && (
          <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
            {sublabel}
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderLifecycle() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isNewOrder = searchParams.get("success") === "true";

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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const token = localStorage.getItem("accessToken");
      if (!isAuthenticated && !token) {
        navigate("/login");
        return;
      }
      try {
        const orderRes = await fetch(
          `http://localhost:8080/api/v1/orders/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        let orderData = null;
        if (orderRes.ok) {
          orderData = await orderRes.json();
        } else {
          const historyRes = await fetch(
            "http://localhost:8080/api/v1/orders",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (historyRes.ok) {
            const history = await historyRes.json();
            orderData = history.find(
              (o) => o.orderNumber === id || o.id === id,
            );
          }
        }

        if (!orderData) throw new Error("Order not found.");

        const prodRes = await fetch("http://localhost:8080/api/v1/products");
        const prodData = await prodRes.json();
        const catalogProducts = prodData.content || prodData || [];

        const enrichedItems = (orderData.orderLineItems || []).map((item) => {
          const matched = catalogProducts.find(
            (p) => p.skuCode === item.skuCode,
          );
          return {
            ...item,
            imageUrl: matched?.imageUrl || "",
            name: matched?.name || "Product Item",
          };
        });

        setOrder({ ...orderData, orderLineItems: enrichedItems });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id, isAuthenticated, navigate]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-[1700px] mx-auto py-10 px-8 flex flex-col w-full animate-pulse min-h-screen bg-white dark:bg-neutral-950">
        <div className="h-5 w-36 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-8" />
        <div className="flex gap-8">
          <div className="flex-1 h-[600px] bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />
          <div className="w-96 h-[500px] bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1700px] mx-auto py-20 px-8 flex flex-col items-center text-center w-full min-h-screen bg-white dark:bg-neutral-950"
      >
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
          Order Not Found
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">{error}</p>
        <Button
          onClick={() => navigate("/orders")}
          variant="outline"
          className="border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Back to Orders
        </Button>
      </motion.div>
    );
  }

  // ── Status flags ─────────────────────────────────────────────────────────
  const currentStatus = order.orderStatus?.toUpperCase() || "PLACED";
  const isCancelled = currentStatus === "CANCELLED";
  const stepPlaced = !isCancelled;
  const stepProcessing =
    stepPlaced &&
    (currentStatus === "PROCESSING" ||
      currentStatus === "SHIPPED" ||
      currentStatus === "DELIVERED");
  const stepShipped =
    stepProcessing &&
    (currentStatus === "SHIPPED" || currentStatus === "DELIVERED");
  const stepDelivered = stepShipped && currentStatus === "DELIVERED";

  const subtotal = order.orderLineItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const isFreeShipping = subtotal > 1000;

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 w-full min-h-screen overflow-visible">
      <main className="max-w-[1700px] flex mx-auto px-4 md:px-12 py-8 flex-col w-full">
        {/* ── Back Button ────────────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          whileHover={{ x: -3 }}
          onClick={() => navigate("/orders")}
          className="font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-sm flex items-center gap-2 transition-colors mb-6 w-fit"
        >
          <ArrowLeft className="size-4" /> Back to orders
        </motion.button>

        {/* ── Success Banner ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {isNewOrder && !isCancelled && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl flex p-6 justify-between items-center gap-6 mb-8 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 320,
                    damping: 16,
                  }}
                  className="size-12 bg-emerald-600 rounded-full text-white flex justify-center items-center shrink-0 shadow-sm"
                >
                  <CheckCircle className="size-7" />
                </motion.div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-emerald-900 dark:text-emerald-300 font-bold text-lg leading-7">
                    Order Placed Successfully!
                  </h2>
                  <p className="text-emerald-700 dark:text-emerald-400 text-sm leading-5 font-medium">
                    Thank you! Your order #
                    {order.orderNumber?.slice(0, 8).toUpperCase()} has been
                    confirmed.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    onClick={() => navigate("/orders")}
                    className="bg-white dark:bg-transparent border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold"
                    size="sm"
                    variant="outline"
                  >
                    View All Orders
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    onClick={() => navigate("/catalog")}
                    className="bg-emerald-900 dark:bg-emerald-700 hover:bg-emerald-800 dark:hover:bg-emerald-600 text-emerald-50 font-semibold shadow-sm"
                    size="sm"
                  >
                    Continue Shopping
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Page Title Row ──────────────────────────────────────────────── */}
        <motion.div
          className="flex mt-2 justify-between items-end mb-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="flex flex-col gap-1">
            <h1 className="font-black text-3xl leading-9 tracking-tight text-neutral-900 dark:text-neutral-100">
              Order #{order.orderNumber?.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              Placed on {formatDate(order.createdAt)}
            </p>
          </motion.div>
          <motion.div
            variants={fadeUp}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              variant="outline"
              className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm flex items-center gap-2 border-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <Download className="size-4" /> Download Invoice
            </Button>
          </motion.div>
        </motion.div>

        {/* ── Two-column layout ───────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <motion.div
            className="flex flex-col flex-1 gap-6"
            initial="hidden"
            animate="visible"
            variants={slideLeft}
          >
            {/* ── Order Status Card ──────────────────────────────────────── */}
            <Card className="p-6 gap-6 border-neutral-200 dark:border-neutral-700/60 shadow-sm bg-white dark:bg-neutral-900">
              <CardHeader className="p-0 gap-2 mb-6">
                <CardTitle className="font-bold text-lg flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <Package className="size-5 text-neutral-500 dark:text-neutral-400" />{" "}
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isCancelled ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-4 bg-red-50 dark:bg-red-950/40 p-4 rounded-xl border border-red-100 dark:border-red-900"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 16,
                        delay: 0.15,
                      }}
                      className="size-10 rounded-full bg-red-600 text-white flex justify-center items-center shadow-sm shrink-0"
                    >
                      <XCircle className="size-5" />
                    </motion.div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-bold text-red-900 dark:text-red-300">
                        Order Cancelled
                      </p>
                      <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                        This order was cancelled and will not be shipped.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col pl-2">
                    <TimelineStep
                      icon={Check}
                      label="Order Confirmed"
                      sublabel="Your order has been received securely."
                      active={stepPlaced}
                      lineActive={stepProcessing}
                      index={0}
                    />
                    <TimelineStep
                      icon={Check}
                      label="Processing"
                      sublabel="Your items are being prepared for shipment."
                      active={stepProcessing}
                      lineActive={stepShipped}
                      index={1}
                    />
                    <TimelineStep
                      icon={Truck}
                      label="Shipped"
                      sublabel="Your package is on its way to the destination."
                      active={stepShipped}
                      lineActive={stepDelivered}
                      index={2}
                    />
                    <TimelineStep
                      icon={MapPin}
                      label="Delivered"
                      sublabel="Package delivered successfully to your address."
                      active={stepDelivered}
                      lineActive={false}
                      last
                      index={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Order Items Card ────────────────────────────────────────── */}
            <Card className="p-6 border-neutral-200 dark:border-neutral-700/60 shadow-sm bg-white dark:bg-neutral-900">
              <CardHeader className="p-0 gap-2 mb-6">
                <CardTitle className="font-bold text-lg flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <ShoppingBag className="size-5 text-neutral-500 dark:text-neutral-400" />{" "}
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col gap-4">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="flex flex-col gap-4"
                >
                  {order.orderLineItems?.map((item, idx) => (
                    <motion.div key={idx} custom={idx} variants={fadeUp}>
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ scale: 1.07, y: -2 }}
                          transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 18,
                          }}
                          className="size-16 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 overflow-hidden flex items-center justify-center p-1.5 shrink-0 cursor-default"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <ImageIcon className="size-6 text-neutral-300 dark:text-neutral-600 opacity-50" />
                          )}
                        </motion.div>
                        <div className="flex flex-col flex-1 gap-1">
                          <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            SKU: {item.skuCode} · Qty {item.quantity}
                          </p>
                        </div>
                        <p className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                      {idx < order.orderLineItems.length - 1 && (
                        <Separator className="mt-4 bg-neutral-100 dark:bg-neutral-800" />
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
          <motion.div
            className="flex flex-col gap-6 w-full lg:w-[420px] shrink-0"
            initial="hidden"
            animate="visible"
            variants={slideRight}
          >
            {/* ── Order Summary ──────────────────────────────────────────── */}
            <Card className="p-6 border-neutral-200 dark:border-neutral-700/60 shadow-sm bg-white dark:bg-neutral-900">
              <CardHeader className="p-0 gap-2 mb-6">
                <CardTitle className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col gap-4 font-medium">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="flex flex-col gap-4"
                >
                  <motion.div
                    variants={fadeUp}
                    className="text-sm flex justify-between items-center text-neutral-600 dark:text-neutral-400"
                  >
                    <span>Subtotal</span>
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {formatPrice(subtotal)}
                    </span>
                  </motion.div>

                  <motion.div
                    variants={fadeUp}
                    className="text-sm flex justify-between items-center text-neutral-600 dark:text-neutral-400"
                  >
                    <span>Shipping</span>
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {isFreeShipping ? "Free" : formatPrice(100)}
                    </span>
                  </motion.div>

                  {order.totalPrice < subtotal + (isFreeShipping ? 0 : 100) && (
                    <motion.div
                      variants={fadeUp}
                      className="text-sm flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold"
                    >
                      <span>Discount Applied</span>
                      <span>
                        -
                        {formatPrice(
                          subtotal +
                            (isFreeShipping ? 0 : 100) -
                            order.totalPrice,
                        )}
                      </span>
                    </motion.div>
                  )}

                  <Separator className="bg-neutral-200 dark:bg-neutral-700" />

                  <motion.div
                    variants={fadeUp}
                    className="flex justify-between items-center"
                  >
                    <span className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                      {order.paymentMethod === "COD" &&
                      order.paymentStatus !== "COMPLETED"
                        ? "Amount to Pay"
                        : "Total Paid"}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.5,
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                      }}
                      className="font-black text-xl text-neutral-900 dark:text-neutral-100"
                    >
                      {formatPrice(order.totalPrice)}
                    </motion.span>
                  </motion.div>

                  <Separator className="bg-neutral-100 dark:bg-neutral-800 mt-2" />

                  {/* Payment method */}
                  <motion.div
                    variants={fadeUp}
                    className="flex flex-col gap-3 mt-2"
                  >
                    <span className="font-bold uppercase text-neutral-400 dark:text-neutral-500 text-[11px] tracking-wider">
                      Payment Method
                    </span>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-lg border border-neutral-100 dark:border-neutral-700/60 transition-colors cursor-default"
                    >
                      {order.paymentMethod === "PAYPAL" ? (
                        <Wallet className="size-5 text-blue-500 dark:text-blue-400" />
                      ) : order.paymentMethod === "COD" ? (
                        <Banknote className="size-5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <CreditCard className="size-5 text-violet-600 dark:text-violet-400" />
                      )}
                      <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex-1">
                        {order.paymentMethod === "COD"
                          ? "Cash on Delivery"
                          : order.paymentMethod?.replace("_", " ")}
                      </span>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.55,
                          type: "spring",
                          stiffness: 320,
                          damping: 18,
                        }}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                          order.paymentStatus === "COMPLETED"
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : order.paymentStatus === "FAILED"
                              ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900"
                              : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900"
                        }`}
                      >
                        {order.paymentStatus}
                      </motion.span>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>

            {/* ── Shipping Address ────────────────────────────────────────── */}
            <Card className="p-6 border-neutral-200 dark:border-neutral-700/60 shadow-sm bg-white dark:bg-neutral-900">
              <CardHeader className="p-0 gap-2 mb-6">
                <CardTitle className="font-bold text-lg flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <MapPin className="size-5 text-neutral-500 dark:text-neutral-400" />{" "}
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col gap-1.5">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="flex flex-col gap-1.5"
                >
                  <motion.p
                    variants={fadeUp}
                    className="font-bold text-sm text-neutral-900 dark:text-neutral-100"
                  >
                    {order.shippingAddress?.street}
                  </motion.p>
                  <motion.p
                    variants={fadeUp}
                    className="text-neutral-500 dark:text-neutral-400 text-sm font-medium leading-relaxed"
                  >
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.state}
                    <br />
                    {order.shippingAddress?.zipCode},{" "}
                    {order.shippingAddress?.country}
                  </motion.p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
