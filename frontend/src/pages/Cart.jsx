import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
  PackageX,
  AlertCircle,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariant = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: {
    opacity: 0,
    x: -24,
    scale: 0.97,
    transition: { duration: 0.28, ease: "easeIn" },
  },
};

const CATEGORY_COLORS = {
  electronics: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-100 dark:border-blue-900",
    badge: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300",
    bar: "bg-blue-500",
  },
  clothing: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-100 dark:border-violet-900",
    badge:
      "bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300",
    bar: "bg-violet-500",
  },
  fashion: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-100 dark:border-violet-900",
    badge:
      "bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300",
    bar: "bg-violet-500",
  },
  food: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-100 dark:border-emerald-900",
    badge:
      "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  grocery: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-100 dark:border-emerald-900",
    badge:
      "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  sports: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-100 dark:border-amber-900",
    badge:
      "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  beauty: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-100 dark:border-rose-900",
    badge: "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300",
    bar: "bg-rose-500",
  },
  home: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-100 dark:border-cyan-900",
    badge: "bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300",
    bar: "bg-cyan-500",
  },
  books: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-100 dark:border-orange-900",
    badge:
      "bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300",
    bar: "bg-orange-500",
  },
};

const FALLBACK_COLORS = [
  {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-100 dark:border-blue-900",
    badge: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300",
    bar: "bg-blue-500",
  },
  {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-100 dark:border-violet-900",
    badge:
      "bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300",
    bar: "bg-violet-500",
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-100 dark:border-emerald-900",
    badge:
      "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-100 dark:border-amber-900",
    badge:
      "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-100 dark:border-rose-900",
    badge: "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300",
    bar: "bg-rose-500",
  },
  {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-100 dark:border-cyan-900",
    badge: "bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300",
    bar: "bg-cyan-500",
  },
];

function getItemColors(item, index) {
  const key = (item.category || "").toLowerCase().trim();
  for (const [k, v] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

const DELIVERY_FEE = 49;
const FREE_DELIVERY_THRESHOLD = 500;

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  const fetchCartData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Please log in to view your cart.");
      const cartRes = await fetch("http://localhost:8080/api/v1/carts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cartRes.status === 404) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }
      if (!cartRes.ok) throw new Error("Failed to fetch cart details.");
      const cartData = await cartRes.json();
      const rawItems = cartData.items || [];
      if (rawItems.length === 0) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }
      const prodRes = await fetch("http://localhost:8080/api/v1/products");
      const prodData = await prodRes.json();
      const products = prodData.content || prodData || [];
      const enrichedItems = rawItems.map((cartItem) => {
        const productDetails = products.find(
          (p) => p.skuCode === cartItem.skuCode,
        );
        return {
          ...cartItem,
          productId: productDetails?.id,
          name: productDetails?.name || "Unknown Product",
          imageUrl: productDetails?.imageUrl || "",
          category:
            productDetails?.category?.name ||
            productDetails?.category ||
            "Misc",
        };
      });
      setCartItems(enrichedItems);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCartData();
  }, [navigate]);

  const updateQuantity = async (skuCode, change) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (change > 0) {
        const invRes = await fetch(
          `http://localhost:8080/api/v1/inventory/${skuCode}`,
        );
        let stock = 0;
        if (invRes.ok) {
          const invText = await invRes.text();
          try {
            const invData = JSON.parse(invText);
            stock = invData.availableQuantity ?? invData.quantity ?? 0;
          } catch {
            stock = parseInt(invText) || 0;
          }
        }
        const currentItem = cartItems.find((i) => i.skuCode === skuCode);
        if (currentItem && currentItem.quantity >= stock)
          throw new Error(`Cannot add more. Only ${stock} left in stock!`);
      }
      const endpoint =
        change > 0
          ? "http://localhost:8080/api/v1/carts/add"
          : "http://localhost:8080/api/v1/carts/decrease";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skuCode, quantity: 1 }),
      });
      if (!response.ok) throw new Error("Failed to update quantity.");
      await fetchCartData();
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (skuCode) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:8080/api/v1/carts/items/${skuCode}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to remove item.");
      await fetchCartData();
      window.dispatchEvent(new CustomEvent("cartUpdated"));
      showNotification("Item removed from cart.", "success");
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.snapshotPrice * item.quantity,
    0,
  );
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  // ── Shared page shell — wraps ALL states so bg always fills the viewport ──
  const Shell = ({ children }) => (
    <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 w-full min-h-screen">
      {children}
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Shell>
        <div className="max-w-[1440px] mx-auto p-8">
          <div className="flex flex-col lg:flex-row gap-8 animate-pulse">
            <div className="flex-1 flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 bg-neutral-100 dark:bg-neutral-800 rounded-2xl"
                  style={{ opacity: 1 - (i - 1) * 0.2 }}
                />
              ))}
            </div>
            <div className="w-full lg:w-[400px] h-80 bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />
          </div>
        </div>
      </Shell>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Shell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[1440px] mx-auto py-20 px-8 flex flex-col items-center text-center"
        >
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
            Cart Error
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="dark:border-neutral-700 dark:text-neutral-300"
          >
            Try Again
          </Button>
        </motion.div>
      </Shell>
    );
  }

  // ── Empty State ───────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <Shell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[1440px] mx-auto flex flex-col items-center justify-center text-center min-h-[calc(100vh-8rem)] px-8 py-24"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="mb-6"
          >
            <div className="size-20 bg-neutral-50 dark:bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-100 dark:border-neutral-800 shadow-sm">
              <PackageX className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Your cart is empty
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm">
            Looks like you haven't added anything to your cart yet. Let's change
            that!
          </p>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate("/catalog")}
              size="lg"
              className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
            >
              Continue Shopping
            </Button>
          </motion.div>
        </motion.div>
      </Shell>
    );
  }

  // ── Full Cart ─────────────────────────────────────────────────────────────
  return (
    <Shell>
      {/* Toast */}
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
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold text-white ${notification.type === "error" ? "bg-red-600" : "bg-neutral-900 dark:bg-neutral-700"}`}
            >
              {notification.type === "error" ? (
                <AlertCircle className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex mb-8 justify-between items-end border-b border-neutral-100 dark:border-neutral-800 pb-6"
        >
          <div className="flex flex-col gap-1">
            <h1 className="font-black text-3xl tracking-tight text-neutral-900 dark:text-neutral-100">
              Shopping Cart
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              You have {cartItems.length}{" "}
              {cartItems.length === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <motion.div whileHover={{ x: -3 }} transition={{ duration: 0.2 }}>
            <Button
              onClick={() => navigate("/catalog")}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 gap-2 dark:hover:bg-neutral-800"
              variant="ghost"
            >
              <ArrowLeft className="size-4" /> Continue shopping
            </Button>
          </motion.div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Cart Items */}
          <motion.div
            className="flex flex-col flex-1 gap-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <AnimatePresence>
              {cartItems.map((item, idx) => {
                const colors = getItemColors(item, idx);
                return (
                  <motion.div
                    key={item.skuCode}
                    custom={idx}
                    variants={itemVariant}
                    layout
                    exit="exit"
                  >
                    <Card
                      className={`border shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-all overflow-hidden bg-white dark:bg-neutral-900 ${colors.border}`}
                    >
                      <div className={`h-0.5 w-full ${colors.bar}`} />
                      <CardContent className="flex p-4 md:p-6 items-center gap-4 md:gap-6">
                        <motion.div
                          whileHover={{ scale: 1.05, y: -2 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 18,
                          }}
                          className={`size-24 md:size-32 shrink-0 rounded-xl border overflow-hidden flex items-center justify-center ${colors.bg} ${colors.border}`}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="object-contain w-full h-full p-2"
                            />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-neutral-300 dark:text-neutral-600 opacity-50" />
                          )}
                        </motion.div>

                        <div className="flex flex-col flex-1 gap-1">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1.5 pr-4">
                              <Link
                                to={`/product/${item.productId}`}
                                className="font-bold text-base md:text-lg leading-6 text-neutral-900 dark:text-neutral-100 hover:underline underline-offset-2"
                              >
                                {item.name}
                              </Link>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                                  SKU: {item.skuCode}
                                </p>
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.badge}`}
                                >
                                  {item.category}
                                </span>
                              </div>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                onClick={() => handleRemove(item.skuCode)}
                                disabled={isProcessing}
                                className="size-8 text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors shrink-0"
                                size="icon"
                                variant="ghost"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </motion.div>
                          </div>

                          <div className="flex mt-4 justify-between items-end">
                            <div
                              className={`rounded-xl border flex items-center ${colors.border} bg-white dark:bg-neutral-800`}
                            >
                              <Button
                                onClick={() => updateQuantity(item.skuCode, -1)}
                                disabled={isProcessing || item.quantity <= 1}
                                className="size-8 md:size-9 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:text-neutral-300"
                                size="icon"
                                variant="ghost"
                              >
                                <Minus className="size-3 md:size-4" />
                              </Button>
                              <motion.span
                                key={item.quantity}
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 18,
                                }}
                                className="font-bold text-center text-sm md:text-base w-9 text-neutral-900 dark:text-neutral-100 tabular-nums"
                              >
                                {item.quantity}
                              </motion.span>
                              <Button
                                onClick={() => updateQuantity(item.skuCode, 1)}
                                disabled={isProcessing}
                                className="size-8 md:size-9 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:text-neutral-300"
                                size="icon"
                                variant="ghost"
                              >
                                <Plus className="size-3 md:size-4" />
                              </Button>
                            </div>
                            <motion.span
                              key={item.quantity}
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.25,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="font-black text-lg md:text-xl text-neutral-900 dark:text-neutral-100 tabular-nums"
                            >
                              {formatPrice(item.snapshotPrice * item.quantity)}
                            </motion.span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="shrink-0 w-full lg:w-[400px]"
          >
            <Card className="p-6 gap-6 border-neutral-200 dark:border-neutral-700/60 shadow-sm sticky top-24 bg-white dark:bg-neutral-900">
              <CardHeader className="p-0 gap-1 mb-6">
                <CardTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Order Summary
                </CardTitle>
                <CardDescription className="text-neutral-500 dark:text-neutral-400 font-medium">
                  Review your order before checkout
                </CardDescription>
              </CardHeader>

              <CardContent className="flex p-0 flex-col gap-6">
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                    placeholder="Promo code"
                  />
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 font-semibold"
                  >
                    Apply
                  </Button>
                </div>

                <div className="flex flex-col gap-3 font-medium">
                  <div className="text-sm flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                    <span>Subtotal</span>
                    <span className="text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="text-sm flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                    <span>Delivery Fee</span>
                    <span
                      className={`tabular-nums font-bold ${deliveryFee === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-900 dark:text-neutral-100"}`}
                    >
                      {deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}
                    </span>
                  </div>
                </div>

                <Separator className="bg-neutral-200 dark:bg-neutral-700" />

                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                    Total
                  </span>
                  <motion.span
                    key={total}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="font-black text-2xl text-neutral-900 dark:text-neutral-100 tabular-nums"
                  >
                    {formatPrice(total)}
                  </motion.span>
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 -mt-2">
                  Choosing Cash on Delivery adds a small platform fee at
                  checkout.
                </p>
              </CardContent>

              <CardFooter className="flex p-0 flex-col gap-4 mt-6">
                <motion.div
                  className="w-full"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    onClick={() => navigate("/checkout")}
                    className="bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 gap-2 w-full font-bold text-base h-12 rounded-xl shadow-sm"
                  >
                    <Lock className="size-4" /> Proceed to Checkout
                  </Button>
                </motion.div>
                <div className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold flex justify-center items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Secure checkout · 30-day returns
                </div>
              </CardFooter>
            </Card>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.38 }}
              className="rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/60 flex mt-6 p-4 items-center gap-4"
            >
              <div className="size-10 rounded-full bg-white dark:bg-neutral-800 flex justify-center items-center shadow-sm shrink-0 border border-neutral-100 dark:border-neutral-700">
                <Truck className="size-5 text-neutral-700 dark:text-neutral-300" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Free standard delivery
                </span>
                <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                  Available on all orders over ₹{FREE_DELIVERY_THRESHOLD}
                </span>
              </div>
              {deliveryFee === 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 16 }}
                  className="ml-auto"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                    Applied!
                  </span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </main>
    </Shell>
  );
}
