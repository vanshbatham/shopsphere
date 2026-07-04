import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Ticket,
  Plus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Hash,
  Percent,
  Tag,
  RefreshCw,
  Sparkles,
  Clock,
  Users,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

function CouponPreview({
  code,
  discountType,
  discountValue,
  expirationDate,
  usageLimit,
}) {
  const hasCode = code.trim().length > 0;
  const displayCode = hasCode ? code.toUpperCase() : "YOURCOUPON";
  const displayValue = discountValue
    ? discountType === "PERCENTAGE"
      ? `${discountValue}% OFF`
      : `₹${discountValue} OFF`
    : "— OFF";
  const displayDate = expirationDate
    ? new Date(expirationDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No expiry set";
  const displayLimit = usageLimit ? `${usageLimit} uses` : "Unlimited";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-900 dark:bg-neutral-950 shadow-lg select-none"
    >
      {/* Dashed cut line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
        <div className="size-5 rounded-full bg-neutral-50 dark:bg-neutral-950 -ml-2.5 shrink-0 border-r border-dashed border-neutral-700" />
        <div className="flex-1 border-t-2 border-dashed border-neutral-700" />
        <div className="size-5 rounded-full bg-neutral-50 dark:bg-neutral-950 -mr-2.5 shrink-0 border-l border-dashed border-neutral-700" />
      </div>

      {/* Top half */}
      <div className="px-8 pt-7 pb-10 flex flex-col items-center text-center gap-2 relative z-0">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-1">
          <Ticket className="size-3" /> ShopSphere Offer
        </div>
        <motion.p
          key={displayValue}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-black text-4xl text-white tracking-tight"
        >
          {displayValue}
        </motion.p>
        <p className="text-white/50 text-xs font-medium">on your next order</p>
      </div>

      {/* Bottom half */}
      <div className="bg-neutral-800 dark:bg-neutral-900 px-8 py-5 flex flex-col items-center gap-3">
        <motion.div
          key={displayCode}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mono font-black text-white text-xl tracking-[0.25em] bg-white/10 border border-white/20 rounded-xl px-6 py-2.5"
        >
          {displayCode}
        </motion.div>
        <div className="flex items-center gap-6 text-white/50 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3" /> {displayDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3" /> {displayLimit}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminCouponManagement() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    expirationDate: "",
    usageLimit: "",
  });

  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      4000,
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountValue: parseFloat(formData.discountValue),
        usageLimit: parseInt(formData.usageLimit, 10),
      };
      const response = await fetch("http://localhost:8080/api/v1/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Role": user?.role || "ADMIN",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create coupon.");
      }
      const data = await response.json();
      showNotification(`Coupon ${data.code} created successfully!`, "success");
      setFormData({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        expirationDate: "",
        usageLimit: "",
      });
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-800 transition-colors";
  const labelBase =
    "block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-10 px-4">
      {/* Toast */}
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

      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-8"
        >
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-3 mb-1"
          >
            <div className="size-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center shadow-sm">
              <Ticket className="size-5 text-white dark:text-neutral-900" />
            </div>
            <div>
              <h1 className="font-black text-2xl md:text-3xl tracking-tight text-neutral-900 dark:text-neutral-100">
                Coupon Management
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                Create and manage promotional discount codes
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Two-column layout: form left, preview right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
          {/* ── Form Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
              {/* Dark card header */}
              <div className="bg-neutral-900 dark:bg-neutral-950 px-7 py-6 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 size-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
                <div className="size-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Sparkles className="size-5 text-white" />
                </div>
                <div className="relative z-10">
                  <h2 className="font-black text-white text-lg">
                    New Promotion
                  </h2>
                  <p className="text-white/50 text-xs mt-0.5">
                    Fill in the details to generate a coupon code.
                  </p>
                </div>
              </div>

              <div className="p-7">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Code & Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelBase}>Coupon Code</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                        <Input
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          placeholder="e.g., SUMMER50"
                          className={`pl-9 uppercase font-mono tracking-wider ${inputBase}`}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelBase}>Discount Type</label>
                      <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleInputChange}
                        className="flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-400 transition-colors"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FLAT_AMOUNT">Flat Amount (₹)</option>
                      </select>
                    </div>
                  </div>

                  {/* Discount Value */}
                  <div>
                    <label className={labelBase}>Discount Value</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400 dark:text-neutral-500 font-semibold text-sm">
                        {formData.discountType === "PERCENTAGE" ? (
                          <Percent className="size-4" />
                        ) : (
                          "₹"
                        )}
                      </div>
                      <Input
                        name="discountValue"
                        type="number"
                        min="1"
                        step={
                          formData.discountType === "PERCENTAGE" ? "1" : "0.01"
                        }
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        placeholder={
                          formData.discountType === "PERCENTAGE" ? "20" : "500"
                        }
                        className={`pl-9 ${inputBase}`}
                        required
                      />
                    </div>
                    {formData.discountType === "PERCENTAGE" &&
                      formData.discountValue > 0 && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
                          Customers save {formData.discountValue}% on their
                          order total.
                        </p>
                      )}
                  </div>

                  {/* Expiry & Usage */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelBase}>Expiration Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                        <Input
                          name="expirationDate"
                          type="date"
                          value={formData.expirationDate}
                          onChange={handleInputChange}
                          className={`pl-9 ${inputBase}`}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelBase}>Usage Limit</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                        <Input
                          name="usageLimit"
                          type="number"
                          min="1"
                          value={formData.usageLimit}
                          onChange={handleInputChange}
                          placeholder="e.g., 100"
                          className={`pl-9 ${inputBase}`}
                          required
                        />
                      </div>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
                        Max number of times this code can be redeemed.
                      </p>
                    </div>
                  </div>

                  {/* Summary strip */}
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 px-4 py-3.5 flex flex-wrap gap-4">
                    {[
                      {
                        icon: Tag,
                        label: "Code",
                        value: formData.code
                          ? formData.code.toUpperCase()
                          : "—",
                      },
                      {
                        icon: Percent,
                        label: "Value",
                        value: formData.discountValue
                          ? formData.discountType === "PERCENTAGE"
                            ? `${formData.discountValue}%`
                            : `₹${formData.discountValue}`
                          : "—",
                      },
                      {
                        icon: Calendar,
                        label: "Expires",
                        value: formData.expirationDate
                          ? new Date(
                              formData.expirationDate,
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })
                          : "—",
                      },
                      {
                        icon: Hash,
                        label: "Limit",
                        value: formData.usageLimit || "—",
                      },
                    ].map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Icon className="size-3.5 text-neutral-400 dark:text-neutral-500" />
                        <span className="text-neutral-400 dark:text-neutral-500">
                          {label}:
                        </span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold gap-2 shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" /> Minting
                          Coupon…
                        </>
                      ) : (
                        <>
                          <Plus className="size-4" /> Create Coupon
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Live Preview ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-col gap-5 sticky top-8"
          >
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                <BadgeCheck className="size-4 text-neutral-400 dark:text-neutral-500" />
                <span className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
                  Live Preview
                </span>
                <span className="ml-auto text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Updates as you type
                </span>
              </div>
              <div className="p-6">
                <CouponPreview
                  code={formData.code}
                  discountType={formData.discountType}
                  discountValue={formData.discountValue}
                  expirationDate={formData.expirationDate}
                  usageLimit={formData.usageLimit}
                />
              </div>
            </div>

            {/* Quick tips */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                Tips
              </p>
              <ul className="space-y-2.5">
                {[
                  "Use memorable codes like DIWALI20 or FLAT200.",
                  "Set a usage limit to prevent abuse.",
                  "Percentage discounts work best for high-value carts.",
                  "Flat discounts feel more concrete to customers.",
                ].map((tip) => (
                  <li
                    key={tip}
                    className="flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    <CheckCircle2 className="size-3.5 text-neutral-300 dark:text-neutral-600 shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
