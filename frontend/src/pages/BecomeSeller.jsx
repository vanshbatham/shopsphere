import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  TrendingUp,
  Users,
  BadgeCheck,
  Sparkles,
  Package,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── E-commerce Merchant Perks ──────────────────────────────────────────────
const PERKS = [
  {
    icon: Store,
    label: "Create your storefront",
    desc: "Set up your brand and start listing products in minutes.",
  },
  {
    icon: TrendingUp,
    label: "Reach nationwide buyers",
    desc: "Put your products in front of millions of active daily shoppers.",
  },
  {
    icon: BadgeCheck,
    label: "Secure & fast payouts",
    desc: "Get paid on time with our reliable merchant settlement system.",
  },
  {
    icon: Users,
    label: "Dedicated seller support",
    desc: "Access 24/7 support and exclusive tools to grow your business.",
  },
];

export default function BecomeSeller() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shopName: "",
    shopDescription: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "http://localhost:8080/api/v1/users/become-seller",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            "Failed to register shop. The name might be taken.",
        );
      }
      setSuccess(true);
      let secs = 3;
      const tick = setInterval(() => {
        secs -= 1;
        setCountdown(secs);
        if (secs <= 0) {
          clearInterval(tick);
          logout();
          navigate("/login");
        }
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-8 items-start">
        {/* ── Left: Info Panel ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col gap-6"
        >
          <motion.div variants={fadeUp}>
            <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">
              ShopSphere Merchant Program
            </p>
            <h1 className="font-black text-3xl md:text-4xl text-neutral-900 dark:text-neutral-100 leading-tight tracking-tight">
              Start selling to
              <br />
              <span className="text-neutral-500 dark:text-neutral-400">
                millions of shoppers
              </span>
            </h1>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 text-sm font-medium leading-relaxed max-w-sm">
              Join India's fastest-growing e-commerce network. List your
              products, reach nationwide buyers, and scale your business
              instantly.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3"
          >
            {PERKS.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                custom={i}
                variants={fadeUp}
                className="flex items-start gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm"
              >
                <div className="size-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-white dark:text-neutral-900" />
                </div>
                <div>
                  <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {label}
                  </p>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-2xl bg-neutral-900 dark:bg-neutral-800/60 dark:border dark:border-neutral-700/60 p-5 flex items-center gap-4 shadow-lg"
          >
            <div className="size-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <ShoppingBag className="size-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-0.5">
                Join the community
              </p>
              <p className="text-white font-black text-sm">
                500+ Verified Sellers
              </p>
              <p className="text-white/60 font-medium text-xs mt-0.5">
                selling over 10,000+ products every day.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Right: Form Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 overflow-hidden shadow-xl"
        >
          {/* Card Header — dark panel */}
          <div className="bg-neutral-900 dark:bg-neutral-950 px-8 py-7 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 size-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="size-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shadow-inner">
                <Store className="size-6 text-white" />
              </div>
              <div>
                <h2 className="font-black text-white text-xl tracking-tight">
                  Register Your Shop
                </h2>
                <p className="text-white/60 font-medium text-xs mt-0.5">
                  Setup takes less than a minute.
                </p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col items-center text-center py-10 gap-5"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 250,
                      damping: 18,
                      delay: 0.1,
                    }}
                    className="size-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-4 border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center"
                  >
                    <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" />
                  </motion.div>
                  <div>
                    <h3 className="font-black text-2xl text-neutral-900 dark:text-neutral-100 tracking-tight">
                      Shop Registered! 🎉
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium mt-2 leading-relaxed max-w-[280px]">
                      Your account is now a Seller profile. We'll log you out
                      securely to apply the changes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-full text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                    <RefreshCw className="size-4 animate-spin text-neutral-900 dark:text-white" />
                    Redirecting to login in {countdown}s…
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold border border-red-200 dark:border-red-800/50 mb-4"
                      >
                        <AlertCircle className="size-5 shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-2">
                      Shop Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      maxLength={50}
                      value={formData.shopName}
                      onChange={(e) =>
                        setFormData({ ...formData, shopName: e.target.value })
                      }
                      placeholder="e.g. The Modern Furniture Store"
                      className="h-12 rounded-full px-5 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500 font-medium focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-shadow"
                    />
                    <p className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 mt-2 px-2">
                      This is your public brand identity — choose carefully.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-2">
                      Shop Description
                    </label>
                    <textarea
                      maxLength={500}
                      value={formData.shopDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shopDescription: e.target.value,
                        })
                      }
                      placeholder="Tell buyers what you sell, your speciality, or what makes your products unique…"
                      className="flex w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-5 py-4 text-sm font-medium dark:text-neutral-100 dark:placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 min-h-[140px] resize-y transition-shadow"
                    />
                    <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mt-2 px-2 text-right">
                      {formData.shopDescription.length}/500
                    </p>
                  </div>

                  {/* Trust note */}
                  <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-4">
                    <Sparkles className="size-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 leading-relaxed">
                      For security, you'll be prompted to log in once more to
                      activate your new Seller Dashboard.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold gap-2 h-12 mt-2 shadow-lg dark:shadow-white/10"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />{" "}
                        Registering…
                      </>
                    ) : (
                      <>
                        Launch My Store <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
