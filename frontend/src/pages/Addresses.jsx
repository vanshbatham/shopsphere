import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Plus,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

// ─── Animation Variants ───────────────────────────────────────────────────────

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
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const formVariant = {
  hidden: { opacity: 0, y: -16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

const fieldVariant = {
  hidden: { opacity: 0, x: -10 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.32, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls = `h-11 rounded-xl
  bg-neutral-50 dark:bg-neutral-800/60
  border-neutral-200 dark:border-neutral-700
  text-neutral-900 dark:text-neutral-100
  placeholder:text-neutral-400 dark:placeholder:text-neutral-500
  focus-visible:border-neutral-400 dark:focus-visible:border-neutral-500
  focus-visible:ring-1 focus-visible:ring-neutral-200 dark:focus-visible:ring-neutral-700
  transition-all`;

// ─── Labeled Input ────────────────────────────────────────────────────────────

function LabeledInput({ label, name, value, onChange, placeholder, index }) {
  return (
    <motion.div
      custom={index}
      variants={fieldVariant}
      className="flex flex-col gap-2"
    >
      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <Input
        name={name}
        value={value}
        onChange={onChange}
        required
        placeholder={placeholder}
        className={inputCls}
      />
    </motion.div>
  );
}

// ─── Address accent colors — each card gets a unique color stripe ─────────────
const ACCENT_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Addresses() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication required.");
      const response = await fetch(
        "http://localhost:8080/api/v1/users/addresses",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        if (response.status === 404) {
          setAddresses([]);
          return;
        }
        throw new Error("Failed to fetch addresses.");
      }
      const data = await response.json();
      setAddresses(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!isAuthenticated && !token) {
      navigate("/login");
      return;
    }
    fetchAddresses();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "http://localhost:8080/api/v1/users/addresses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );
      if (!response.ok) throw new Error("Failed to save address.");
      showNotification("Address saved successfully!", "success");
      setFormData({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      });
      setShowForm(false);
      await fetchAddresses();
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto py-10 px-4 md:px-8 w-full min-h-screen bg-white dark:bg-neutral-950">
        <div className="h-5 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-8 animate-pulse" />
        <div className="h-8 w-52 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-2 animate-pulse" />
        <div className="h-4 w-72 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-10 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 animate-pulse"
              style={{ opacity: 1 - (i - 1) * 0.2 }}
            />
          ))}
        </div>
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
            >
              {notification.type === "error" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1440px] flex mx-auto py-10 px-4 md:px-8 flex-col w-full">
        {/* ── Back Button ────────────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          whileHover={{ x: -3 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-8 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </motion.button>

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <motion.div
          className="flex justify-between items-end mb-8 border-b border-neutral-100 dark:border-neutral-800 pb-6"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              Saved Addresses
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">
              Manage your shipping addresses for a faster checkout.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!showForm && (
              <motion.div
                key="add-btn"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 gap-2 font-semibold shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Add New Address
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* ── Add Address Form ────────────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="address-form"
              variants={formVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mb-8"
            >
              <Card className="border-neutral-200 dark:border-neutral-700/60 shadow-sm overflow-hidden bg-white dark:bg-neutral-900">
                <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 rounded-t-xl pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                      <MapPin className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                      Add a New Address
                    </CardTitle>
                    <motion.div
                      whileHover={{ rotate: 90 }}
                      whileTap={{ scale: 0.88 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 dark:hover:bg-neutral-700"
                        onClick={() => setShowForm(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                  <CardDescription className="dark:text-neutral-400">
                    Enter your delivery details below.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit}>
                    <motion.div
                      className="flex flex-col gap-5"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.06 } },
                      }}
                    >
                      <LabeledInput
                        label="Street Address"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        placeholder="123 Main St, Apt 4B"
                        index={0}
                      />

                      <motion.div
                        custom={1}
                        variants={fieldVariant}
                        className="grid grid-cols-1 md:grid-cols-2 gap-5"
                      >
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            City
                          </label>
                          <Input
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            placeholder="Indore"
                            className={inputCls}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            State / Province
                          </label>
                          <Input
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                            placeholder="Madhya Pradesh"
                            className={inputCls}
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        custom={2}
                        variants={fieldVariant}
                        className="grid grid-cols-1 md:grid-cols-2 gap-5"
                      >
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            ZIP / Postal Code
                          </label>
                          <Input
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            required
                            placeholder="452001"
                            className={inputCls}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Country
                          </label>
                          <Input
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                            placeholder="India"
                            className={inputCls}
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        custom={3}
                        variants={fieldVariant}
                        className="flex justify-end gap-3 mt-2"
                      >
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowForm(false)}
                            className="border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 font-semibold"
                          >
                            Cancel
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-semibold min-w-[120px] shadow-sm"
                          >
                            {isSubmitting ? (
                              <span className="flex items-center gap-2">
                                <motion.span
                                  className="inline-block size-3.5 rounded-full border-2 border-white/30 dark:border-neutral-900/30 border-t-white dark:border-t-neutral-900"
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                />
                                Saving…
                              </span>
                            ) : (
                              "Save Address"
                            )}
                          </Button>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty State ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!showForm && addresses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.38 }}
              className="flex flex-col items-center justify-center py-24 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mb-4"
              >
                <div className="size-16 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-700">
                  <MapPin className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                </div>
              </motion.div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                No addresses saved
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 text-center max-w-sm leading-relaxed">
                You haven't added any shipping addresses yet. Add one now to
                speed up your next checkout.
              </p>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 gap-2 font-semibold shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Add New Address
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Address Grid ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {addresses.length > 0 && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {addresses.map((addr, i) => {
                const accentColor = ACCENT_COLORS[i % ACCENT_COLORS.length];
                return (
                  <motion.div
                    key={addr.id}
                    custom={i}
                    variants={cardVariant}
                    whileHover={{
                      y: -4,
                      transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                    }}
                  >
                    <Card className="border-neutral-200 dark:border-neutral-700/60 shadow-sm hover:shadow-lg dark:hover:shadow-black/30 transition-shadow group relative overflow-hidden h-full bg-white dark:bg-neutral-900">
                      {/* Top accent bar — unique color per card */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 ${accentColor} rounded-t-xl`}
                      />

                      {/* Left hover stripe — same color */}
                      <motion.div
                        className={`absolute top-0 left-0 w-1 h-full ${accentColor} rounded-l-xl`}
                        initial={{ scaleY: 0, originY: 0 }}
                        whileHover={{ scaleY: 1 }}
                        transition={{
                          duration: 0.22,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />

                      <CardContent className="p-6 flex flex-col gap-4 h-full">
                        <div className="flex items-start gap-4">
                          {/* Icon circle — tinted per color */}
                          <motion.div
                            whileHover={{ rotate: -8, scale: 1.08 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 18,
                            }}
                            className={`size-10 rounded-full flex items-center justify-center shrink-0
                              ${
                                i % 6 === 0
                                  ? "bg-blue-100 dark:bg-blue-950/50"
                                  : i % 6 === 1
                                    ? "bg-violet-100 dark:bg-violet-950/50"
                                    : i % 6 === 2
                                      ? "bg-emerald-100 dark:bg-emerald-950/50"
                                      : i % 6 === 3
                                        ? "bg-amber-100 dark:bg-amber-950/50"
                                        : i % 6 === 4
                                          ? "bg-rose-100 dark:bg-rose-950/50"
                                          : "bg-cyan-100 dark:bg-cyan-950/50"
                              }`}
                          >
                            <Home
                              className={`h-5 w-5
                              ${
                                i % 6 === 0
                                  ? "text-blue-600 dark:text-blue-400"
                                  : i % 6 === 1
                                    ? "text-violet-600 dark:text-violet-400"
                                    : i % 6 === 2
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : i % 6 === 3
                                        ? "text-amber-600 dark:text-amber-400"
                                        : i % 6 === 4
                                          ? "text-rose-600 dark:text-rose-400"
                                          : "text-cyan-600 dark:text-cyan-400"
                              }`}
                            />
                          </motion.div>

                          <div className="flex flex-col gap-1 flex-1">
                            <span className="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-tight">
                              {addr.street}
                            </span>
                            <span className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed mt-1">
                              {addr.city}, {addr.state} {addr.zipCode}
                              <br />
                              {addr.country}
                            </span>
                          </div>
                        </div>

                        {/* Address number badge */}
                        <div className="flex justify-end">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full
                            ${
                              i % 6 === 0
                                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                                : i % 6 === 1
                                  ? "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400"
                                  : i % 6 === 2
                                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                                    : i % 6 === 3
                                      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                                      : i % 6 === 4
                                        ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                                        : "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400"
                            }`}
                          >
                            Address {i + 1}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
