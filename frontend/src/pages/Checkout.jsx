import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  Truck,
  Wallet,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Banknote,
  X,
  Tag,
  Package,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
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

// --- RAZORPAY SCRIPT LOADER ---
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const createPaymentIntentWithRetry = async (orderId, token, maxRetries = 5) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(
      `http://localhost:8080/api/v1/payments/create-intent/${orderId}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.ok) {
      const data = await res.json();
      return data.razorpayOrderId;
    }
    if (res.status === 404) {
      const errData = await res.json().catch(() => ({}));
      if (errData.retryable === "true" && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      throw new Error(
        errData.error || "Payment service is not ready. Please try again.",
      );
    }
    if (res.status === 502) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        errData.error ||
          "Payment gateway is unavailable. Please try again later.",
      );
    }
    throw new Error("Failed to initialize payment gateway.");
  }
  throw new Error(
    "Payment service is still initializing. Please wait a moment and try again.",
  );
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ── Fee rules (must mirror order-service's calculation exactly, or the
// amount shown here, the amount charged via Razorpay, and the amount stored
// as the order's totalAmount will all disagree) ──
const PLATFORM_FEE_COD = 9;
const DELIVERY_FEE = 49;
const FREE_DELIVERY_THRESHOLD = 500;

export default function Checkout() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const directSku = searchParams.get("directSku");
  const directQty = parseInt(searchParams.get("qty")) || 1;

  const [addresses, setAddresses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discountData, setDiscountData] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
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
      4000,
    );
  };

  useEffect(() => {
    const fetchCheckoutData = async () => {
      const token = localStorage.getItem("accessToken");
      if (!isAuthenticated && !token) {
        navigate("/login");
        return;
      }
      try {
        const addrRes = await fetch(
          "http://localhost:8080/api/v1/users/addresses",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (addrRes.ok) {
          const addrData = await addrRes.json();
          setAddresses(addrData || []);
          if (addrData && addrData.length > 0)
            setSelectedAddressId(addrData[0].id);
        }
        if (directSku) {
          const prodRes = await fetch("http://localhost:8080/api/v1/products");
          const prodData = await prodRes.json();
          const products = prodData.content || prodData || [];
          const targetProduct = products.find((p) => p.skuCode === directSku);
          if (!targetProduct) throw new Error("Product not found.");
          setCartItems([
            {
              skuCode: targetProduct.skuCode,
              productId: targetProduct.id,
              name: targetProduct.name,
              imageUrl: targetProduct.imageUrl,
              quantity: directQty,
              snapshotPrice: targetProduct.price,
            },
          ]);
        } else {
          const cartRes = await fetch("http://localhost:8080/api/v1/carts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!cartRes.ok) throw new Error("Failed to load cart.");
          const cartData = await cartRes.json();
          const rawItems = cartData.items || [];
          if (rawItems.length === 0) {
            navigate("/cart");
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
              name: productDetails?.name || "Unknown Product",
              imageUrl: productDetails?.imageUrl || "",
            };
          });
          setCartItems(enrichedItems);
        }
      } catch (err) {
        showNotification(err.message, "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCheckoutData();
  }, [navigate, isAuthenticated, directSku, directQty]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `http://localhost:8080/api/v1/coupons/validate/${couponCode.trim().toUpperCase()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Invalid or expired coupon code.");
      }
      const data = await res.json();
      setDiscountData(data);
      setAppliedCoupon(data.code);
      showNotification("Coupon applied successfully!", "success");
    } catch (err) {
      showNotification(err.message, "error");
      setDiscountData(null);
      setAppliedCoupon("");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.snapshotPrice * item.quantity,
    0,
  );
  let discountAmount = 0;
  if (discountData) {
    if (discountData.discountType === "PERCENTAGE")
      discountAmount = subtotal * (discountData.discountValue / 100);
    else if (discountData.discountType === "FLAT_AMOUNT")
      discountAmount = discountData.discountValue;
    if (discountAmount > subtotal) discountAmount = subtotal;
  }
  const discountedSubtotal = subtotal - discountAmount;

  // ── The only two fees: ₹49 delivery under ₹500 (free at/above it), and a
  // flat ₹9 platform fee, but only for Cash on Delivery orders. ──
  const deliveryFee =
    discountedSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const platformFee = paymentMethod === "COD" ? PLATFORM_FEE_COD : 0;
  const total = discountedSubtotal + deliveryFee + platformFee;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showNotification("Please select or add a shipping address.", "error");
      return;
    }
    setIsPlacingOrder(true);
    try {
      const token = localStorage.getItem("accessToken");
      const isDirectFlow = !!directSku;
      const endpoint = isDirectFlow
        ? "http://localhost:8080/api/v1/orders/direct"
        : "http://localhost:8080/api/v1/orders";
      const payload = isDirectFlow
        ? {
            addressId: selectedAddressId,
            paymentMethod,
            couponCode: appliedCoupon || null,
            skuCode: directSku,
            quantity: directQty,
          }
        : {
            addressId: selectedAddressId,
            paymentMethod,
            couponCode: appliedCoupon || null,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to place order.");
      }
      const orderData = await response.json();
      if (!orderData.orderId)
        throw new Error(
          orderData.error || orderData.message || "Failed to place order.",
        );
      const realDbId = orderData.orderId;

      if (!isDirectFlow) window.dispatchEvent(new CustomEvent("cartUpdated"));

      if (paymentMethod === "COD") {
        showNotification("Order placed successfully!", "success");
        setTimeout(
          () => navigate(`/order-lifecycle/${realDbId}?success=true`),
          1500,
        );
      } else {
        const sdkLoaded = await loadRazorpayScript();
        if (!sdkLoaded)
          throw new Error("Razorpay SDK failed to load. Are you online?");
        const rzpOrderId = await createPaymentIntentWithRetry(realDbId, token);
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: Math.round(total * 100),
          currency: "INR",
          name: "ShopSphere",
          description: "Purchase transaction",
          order_id: rzpOrderId,
          handler: function (response) {
            showNotification("Payment Successful!", "success");
            navigate(`/order-lifecycle/${realDbId}?success=true`);
          },
          prefill: {
            name: user?.firstName || "Customer",
            email: user?.email || "",
          },
          theme: { color: "#0f172a" },
          modal: {
            ondismiss: async function () {
              showNotification("Payment cancelled.", "error");
              try {
                await fetch(
                  `http://localhost:8080/api/v1/orders/${realDbId}/cancel`,
                  {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                  },
                );
              } catch (e) {
                console.error(
                  "[Checkout] Failed to cancel abandoned order:",
                  e,
                );
              }
            },
          },
        };
        const paymentObject = new window.Razorpay(options);
        paymentObject.on("payment.failed", function () {
          showNotification("Payment Failed. Please try again.", "error");
        });
        paymentObject.open();
        setIsPlacingOrder(false);
      }
    } catch (err) {
      showNotification(err.message, "error");
      setIsPlacingOrder(false);
    }
  };

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-[1400px] mx-auto py-10 px-4 md:px-8 animate-pulse">
          <div className="h-8 w-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-8" />
          <div className="flex gap-8 flex-col lg:flex-row">
            <div className="flex-1 space-y-5">
              <div className="h-64 bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />
              <div className="h-40 bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />
            </div>
            <div className="w-full lg:w-[420px] h-[480px] bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 w-full min-h-screen relative">
      {/* ── Toast ── */}
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
                <AlertCircle className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1440px] mx-auto py-8 px-4 md:px-8">
        {/* ── Page Header ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800"
        >
          <motion.div variants={fadeUp}>
            <h1 className="font-black text-2xl md:text-3xl tracking-tight text-neutral-900 dark:text-neutral-100">
              Checkout
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5 font-medium">
              Complete your purchase securely
            </p>
          </motion.div>
          <motion.button
            variants={fadeUp}
            onClick={() => navigate("/cart")}
            className="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to cart
          </motion.button>
        </motion.div>

        {/* ── Trust bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="hidden md:flex items-center justify-center gap-8 mb-8 px-6 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          {[
            { icon: Lock, label: "256-bit SSL encryption" },
            { icon: ShieldCheck, label: "100% secure checkout" },
            { icon: Truck, label: "Fast & reliable delivery" },
            { icon: Package, label: "Easy 7-day returns" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400"
            >
              <Icon className="size-3.5 text-neutral-400 dark:text-neutral-500" />
              {label}
            </div>
          ))}
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left Column ── */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col flex-1 gap-6"
          >
            {/* Shipping */}
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="size-9 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
                  <Truck className="size-4 text-white dark:text-neutral-900" />
                </div>
                <div>
                  <h2 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
                    Shipping Address
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Select where you want your order delivered.
                  </p>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr, i) => (
                    <motion.div
                      key={addr.id}
                      custom={i}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/80"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 bg-white dark:bg-neutral-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                          <MapPin className="size-3" /> Address
                        </span>
                        <AnimatePresence>
                          {selectedAddressId === addr.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 18,
                              }}
                              className="size-5 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center shadow-sm"
                            >
                              <Check className="size-3 text-white dark:text-neutral-900" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {addr.street}
                      </p>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1 leading-relaxed">
                        {addr.city}, {addr.state}
                        <br />
                        {addr.zipCode}, {addr.country}
                      </p>
                    </motion.div>
                  ))}

                  <button
                    onClick={() => navigate("/addresses")}
                    className="rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 flex flex-col justify-center items-center gap-3 p-4 min-h-[120px] transition-colors group"
                  >
                    <div className="size-10 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-sm group-hover:border-neutral-400 dark:group-hover:border-neutral-500 transition-colors">
                      <Plus className="size-4 text-neutral-900 dark:text-neutral-100" />
                    </div>
                    <span className="font-bold text-sm text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      Add new address
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="size-9 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
                  <CreditCard className="size-4 text-white dark:text-neutral-900" />
                </div>
                <div>
                  <h2 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
                    Payment Method
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Choose how you'd like to pay.
                  </p>
                </div>
              </div>

              <div className="p-6 flex flex-wrap md:flex-nowrap gap-4">
                {[
                  {
                    value: "CREDIT_CARD",
                    icon: CreditCard,
                    label: "Online Payment",
                    sub: "Powered by Razorpay",
                  },
                  {
                    value: "COD",
                    icon: Banknote,
                    label: "Cash on Delivery",
                    sub: `+${formatPrice(PLATFORM_FEE_COD)} platform fee`,
                  },
                ].map(({ value, icon: Icon, label, sub }) => (
                  <motion.div
                    key={value}
                    onClick={() => setPaymentMethod(value)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`cursor-pointer rounded-xl border-2 flex items-center flex-1 gap-3.5 p-4 transition-all ${
                      paymentMethod === value
                        ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/80"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 bg-white dark:bg-neutral-900"
                    }`}
                  >
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                        paymentMethod === value
                          ? "bg-neutral-900 dark:bg-white"
                          : "bg-neutral-100 dark:bg-neutral-800"
                      }`}
                    >
                      <Icon
                        className={`size-4 ${paymentMethod === value ? "text-white dark:text-neutral-900" : "text-neutral-500 dark:text-neutral-400"}`}
                      />
                    </div>
                    <div>
                      <p
                        className={`font-bold text-sm ${paymentMethod === value ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400"}`}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {sub}
                      </p>
                    </div>
                    <AnimatePresence>
                      {paymentMethod === value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 18,
                          }}
                          className="ml-auto size-5 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center"
                        >
                          <Check className="size-3 text-white dark:text-neutral-900" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* ── Right Column: Order Summary ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="shrink-0 w-full lg:w-[420px]"
          >
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm sticky top-24">
              {/* Summary dark header */}
              <div className="bg-neutral-900 dark:bg-neutral-950 px-6 py-5 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 size-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="font-black text-white text-lg">
                    Order Summary
                  </h2>
                  <p className="text-white/50 text-xs mt-0.5">
                    {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}{" "}
                    in your order
                  </p>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Items list */}
                <div className="flex flex-col gap-4 max-h-[260px] overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.skuCode} className="flex items-center gap-3">
                      <div className="size-14 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="object-contain w-full h-full p-1.5"
                          />
                        ) : (
                          <ImageIcon className="size-5 text-neutral-300 dark:text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                          Qty {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 shrink-0">
                        {formatPrice(item.snapshotPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator className="bg-neutral-100 dark:bg-neutral-800" />

                {/* Coupon */}
                <AnimatePresence mode="wait">
                  {appliedCoupon ? (
                    <motion.div
                      key="applied"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-4 py-3"
                    >
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="size-4" />
                        Code '{appliedCoupon}' applied
                      </span>
                      <button
                        onClick={() => {
                          setAppliedCoupon("");
                          setCouponCode("");
                          setDiscountData(null);
                        }}
                        className="size-7 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center transition-colors"
                      >
                        <X className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="input" className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 dark:text-neutral-500" />
                        <Input
                          className="pl-9 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500 text-sm"
                          placeholder="Promo code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          disabled={isApplyingCoupon}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleApplyCoupon()
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 font-semibold text-sm"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                      >
                        {isApplyingCoupon ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Separator className="bg-neutral-100 dark:bg-neutral-800" />

                {/* Price breakdown */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400 font-medium">
                    <span>Subtotal</span>
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <AnimatePresence>
                    {discountAmount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        <span>Discount ({appliedCoupon})</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400 font-medium">
                    <span>Delivery Fee</span>
                    <span
                      className={
                        deliveryFee === 0
                          ? "text-emerald-600 dark:text-emerald-400 font-bold"
                          : "text-neutral-900 dark:text-neutral-100"
                      }
                    >
                      {deliveryFee === 0 ? "Free ✓" : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <AnimatePresence>
                    {platformFee > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between text-neutral-600 dark:text-neutral-400 font-medium"
                      >
                        <span>Platform Fee (COD)</span>
                        <span className="text-neutral-900 dark:text-neutral-100">
                          {formatPrice(platformFee)}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 px-4 py-3.5 flex justify-between items-center">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    Total
                  </span>
                  <span className="font-black text-2xl text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {formatPrice(total)}
                  </span>
                </div>

                {deliveryFee === 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Truck className="size-3.5" /> Free delivery applied on
                    orders above ₹{FREE_DELIVERY_THRESHOLD}
                  </div>
                )}

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || addresses.length === 0}
                    className="bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 gap-2 w-full font-bold h-12 shadow-sm"
                  >
                    {isPlacingOrder ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />{" "}
                        Processing…
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" /> Place Order &amp; Pay
                      </>
                    )}
                  </Button>
                </motion.div>

                {addresses.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
                    Add a shipping address above to place your order.
                  </p>
                )}

                <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                  <Lock className="size-3" />
                  Secured by 256-bit SSL encryption
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
