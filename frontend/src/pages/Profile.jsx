import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AtSign,
  Pencil,
  AlertCircle,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
});

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const inputCls = `h-11 rounded-xl
  bg-neutral-50 dark:bg-neutral-800/60
  border-neutral-200 dark:border-neutral-700
  text-neutral-900 dark:text-neutral-100
  placeholder:text-neutral-400 dark:placeholder:text-neutral-500
  focus-visible:border-neutral-400 dark:focus-visible:border-neutral-500
  focus-visible:ring-1 focus-visible:ring-neutral-200 dark:focus-visible:ring-neutral-700
  transition-all`;

// ─── Avatar initials helper ───────────────────────────────────────────────────
function getInitials(first, last) {
  return `${(first || "?")[0]}${(last || "")[0]}`.toUpperCase();
}

// ─── Role badge colors ────────────────────────────────────────────────────────
const ROLE_COLORS = {
  ADMIN:
    "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  USER: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  MODERATOR:
    "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
};
function getRoleBadge(role) {
  return (
    ROLE_COLORS[role?.toUpperCase()] ||
    "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
  );
}

// Backend error responses are JSON ({"status":..., "message":...}) for
// most validation failures, but occasionally plain text depending on which
// exception handler catches it. Try JSON first and pull out .message; only
// fall back to showing the raw body if it genuinely isn't JSON, so the user
// never sees a raw JSON blob rendered as their error text.
async function extractErrorMessage(res, fallback) {
  const raw = await res.text();
  try {
    const parsed = JSON.parse(raw);
    return parsed.message || parsed.error || fallback;
  } catch {
    return raw || fallback;
  }
}

// ─── Email Verification Modal ──────────────────────────────────────────────────
// Small self-contained OTP-entry flow: request code -> 6-digit input -> confirm.
// Mirrors the password-reset OTP pattern already used elsewhere in the app,
// but scoped to the already-authenticated user (X-User-Id header), not a
// logged-out email-lookup flow.
function VerifyEmailModal({ onClose, onVerified }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isRequesting, setIsRequesting] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  const requestCode = async () => {
    setIsRequesting(true);
    setError("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        "http://localhost:8080/api/v1/users/verify-email/request",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const message = await extractErrorMessage(
          res,
          "Failed to send verification code.",
        );
        throw new Error(message);
      }
      setResendCooldown(30);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRequesting(false);
    }
  };

  useEffect(() => {
    requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // digits only, one char
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split("");
    while (next.length < 6) next.push("");
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleConfirm = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setIsConfirming(true);
    setError("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        "http://localhost:8080/api/v1/users/verify-email/confirm",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otp: code }),
        },
      );
      if (!res.ok) {
        const message = await extractErrorMessage(
          res,
          "Invalid or expired code.",
        );
        throw new Error(message);
      }
      onVerified();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700/60 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
              Verify your email
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isRequesting
                ? "Sending code…"
                : "Enter the 6-digit code we sent you."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex justify-center gap-2 mb-5">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={isRequesting || isConfirming}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="size-11 text-center text-lg font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-neutral-400 dark:focus:border-neutral-500 focus:ring-1 focus:ring-neutral-200 dark:focus:ring-neutral-700 transition-all disabled:opacity-50"
              />
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 mb-4 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl font-medium"
              >
                <AlertCircle className="size-3.5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleConfirm}
            disabled={isRequesting || isConfirming}
            className="w-full h-11 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-bold"
          >
            {isConfirming ? "Verifying…" : "Verify Email"}
          </Button>

          <button
            onClick={requestCode}
            disabled={isRequesting || resendCooldown > 0}
            className="w-full text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-4"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend code"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Profile() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phoneNumber: "" },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          "http://localhost:8080/api/v1/users/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logout();
            navigate("/login");
            throw new Error("Session expired. Please log in again.");
          }
          throw new Error("Failed to fetch profile data.");
        }
        const data = await response.json();
        setProfileData(data);
        form.reset({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated, navigate, logout, form]);

  async function onSubmit(values) {
    setIsSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "http://localhost:8080/api/v1/users/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-User-Id": profileData.id,
          },
          body: JSON.stringify(values),
        },
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          navigate("/login");
          throw new Error("Session expired. Please log in again.");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile.");
      }
      setSuccessMsg("Profile updated successfully!");
      setProfileData((prev) => ({ ...prev, ...values }));
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const handleVerified = () => {
    setShowVerifyModal(false);
    setProfileData((prev) => ({ ...prev, emailVerified: true }));
    setSuccessMsg("Email verified successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto py-10 px-4 md:px-8 min-h-screen bg-white dark:bg-neutral-950">
        <div className="h-8 w-48 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-10 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-80 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          <div className="h-[480px] bg-neutral-100 dark:bg-neutral-800 rounded-2xl md:col-span-2 animate-pulse" />
        </div>
      </div>
    );
  }

  const initials = getInitials(profileData?.firstName, profileData?.lastName);
  const fullName =
    `${profileData?.firstName ?? ""} ${profileData?.lastName ?? ""}`.trim();
  const joinDate = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 w-full min-h-screen">
      {/* ── Email Verification Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showVerifyModal && (
          <VerifyEmailModal
            onClose={() => setShowVerifyModal(false)}
            onVerified={handleVerified}
          />
        )}
      </AnimatePresence>

      <main className="max-w-[1440px] mx-auto py-10 px-4 md:px-8 w-full">
        {/* ── Page Header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-end justify-between mb-10 border-b border-neutral-100 dark:border-neutral-800 pb-6"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Account
            </span>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              My Profile
            </h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ── LEFT — Identity Card ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-fit"
          >
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
              {/* Avatar + gradient header */}
              <div className="relative bg-neutral-950 dark:bg-neutral-800 pt-10 pb-14 flex flex-col items-center">
                {/* Grid overlay */}
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />
                {/* Glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
                </div>

                {/* Avatar circle */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 280,
                    damping: 18,
                  }}
                  className="relative z-10 size-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg ring-4 ring-white/10 mb-3"
                >
                  <span className="text-white font-black text-2xl tracking-tight">
                    {initials}
                  </span>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                  className="relative z-10 font-black text-white text-lg tracking-tight leading-tight"
                >
                  {fullName}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.42 }}
                  className="relative z-10 text-neutral-400 text-sm font-medium mt-0.5 flex items-center gap-1.5"
                >
                  <AtSign className="size-3.5" />
                  {profileData?.username}
                </motion.p>
              </div>

              {/* Role badge sits across the divider */}
              <div className="flex justify-center -mt-4 relative z-10 mb-2">
                <span
                  className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getRoleBadge(profileData?.role)}`}
                >
                  {profileData?.role}
                </span>
              </div>

              {/* Stat rows */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="flex flex-col gap-0 px-5 pb-5"
              >
                <Separator className="bg-neutral-100 dark:bg-neutral-800 mb-4" />

                {[
                  {
                    icon: ShieldCheck,
                    label: "Status",
                    value: profileData?.isActive ? "Active" : "Inactive",
                    valueClass: profileData?.isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400",
                    iconClass: profileData?.isActive
                      ? "text-emerald-500"
                      : "text-red-400",
                  },
                  {
                    icon: CheckCircle2,
                    label: "Email",
                    value: profileData?.emailVerified
                      ? "Verified"
                      : "Unverified",
                    valueClass: profileData?.emailVerified
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400",
                    iconClass: profileData?.emailVerified
                      ? "text-emerald-500"
                      : "text-amber-500",
                    action: !profileData?.emailVerified && (
                      <button
                        onClick={() => setShowVerifyModal(true)}
                        className="text-[11px] font-bold text-neutral-900 dark:text-neutral-100 underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors ml-2"
                      >
                        Verify
                      </button>
                    ),
                  },
                  {
                    icon: Calendar,
                    label: "Member since",
                    value: joinDate,
                    valueClass: "text-neutral-700 dark:text-neutral-300",
                    iconClass: "text-blue-400",
                  },
                ].map(
                  (
                    { icon: Icon, label, value, valueClass, iconClass, action },
                    i,
                  ) => (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={fadeUp}
                      className="flex items-center gap-3 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                    >
                      <div
                        className={`size-8 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`size-4 ${iconClass}`} />
                      </div>
                      <span className="text-neutral-500 dark:text-neutral-400 text-sm font-medium flex-1">
                        {label}
                      </span>
                      <span
                        className={`text-sm font-bold flex items-center ${valueClass}`}
                      >
                        {value}
                        {action}
                      </span>
                    </motion.div>
                  ),
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* ── RIGHT — Edit Form ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="md:col-span-2"
          >
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="px-7 pt-7 pb-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Pencil className="size-4 text-neutral-400" /> Personal
                    Information
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    Update your details below and save.
                  </p>
                </div>
              </div>

              <div className="px-7 py-7">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-6"
                  >
                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3 p-3.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl font-medium"
                        >
                          <AlertCircle className="size-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Success */}
                    <AnimatePresence>
                      {successMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3 p-3.5 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl font-medium"
                        >
                          <CheckCircle2 className="size-4 shrink-0" />
                          {successMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* First + Last */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                              <User className="size-3.5 text-neutral-400" />{" "}
                              First Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                className={inputCls}
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                              <User className="size-3.5 text-neutral-400" />{" "}
                              Last Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                className={inputCls}
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                            <Mail className="size-3.5 text-neutral-400" /> Email
                            Address
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                              <Input
                                className={`${inputCls} pl-10`}
                                {...field}
                                disabled={isSaving}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                            <Phone className="size-3.5 text-neutral-400" />{" "}
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                              <Input
                                className={`${inputCls} pl-10`}
                                {...field}
                                disabled={isSaving}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="bg-neutral-100 dark:bg-neutral-800" />

                    {/* Submit */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                        Changes are saved to your account immediately.
                      </p>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Button
                          type="submit"
                          disabled={isSaving}
                          className="h-11 px-6 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-bold shadow-sm gap-2"
                        >
                          {isSaving ? (
                            <span className="flex items-center gap-2">
                              <motion.span
                                className="inline-block size-4 rounded-full border-2 border-white/30 dark:border-neutral-900/30 border-t-white dark:border-t-neutral-900"
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
                            <span className="flex items-center gap-2">
                              Save Changes <ArrowRight className="size-4" />
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
