import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
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
import {
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters." }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters." }),
  username: z
    .string()
    .min(4, { message: "Username must be at least 4 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phoneNumber: z
    .string()
    .min(10, { message: "Please enter a valid phone number." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

const inputClass = `h-11 rounded-full px-5 border-neutral-200 dark:border-neutral-700
                    bg-neutral-50 dark:bg-neutral-900
                    text-neutral-900 dark:text-neutral-100
                    placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                    focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 font-medium`;

export default function Register() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phoneNumber: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    setIsLoading(true);
    setApiError("");
    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/users/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || "Registration failed. Please try again.",
        );
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1600);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-neutral-950">
      {/* ── LEFT PANEL — Register Form ─────────────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center px-6 py-12 bg-white dark:bg-neutral-950 overflow-y-auto">
        {/* Mobile brand (Visible only on small screens) */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="size-10 bg-neutral-900 dark:bg-white rounded-full flex items-center justify-center">
            <ShoppingBag className="size-5 text-white dark:text-neutral-900" />
          </div>
          <span className="font-black text-neutral-900 dark:text-neutral-100 text-xl tracking-tight">
            ShopSphere
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-black text-3xl tracking-tight text-neutral-900 dark:text-neutral-100">
              Create an account
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-bold mt-2">
              Join ShopSphere — it only takes a minute.
            </p>
          </div>

          {/* Success flash */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 mb-6 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-bold"
            >
              <CheckCircle2 className="size-5 shrink-0" />
              Account created! Redirecting to sign in…
            </motion.div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {/* API Error */}
              {apiError && (
                <div className="flex items-center gap-3 p-3.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl font-bold">
                  <AlertCircle className="size-4 shrink-0" />
                  {apiError}
                </div>
              )}

              {/* First + Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          className={inputClass}
                          {...field}
                          disabled={isLoading}
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
                      <FormLabel className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          className={inputClass}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe123"
                        className={inputClass}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        className={inputClass}
                        {...field}
                        disabled={isLoading}
                      />
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
                    <FormLabel className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+91 98765 43210"
                        className={inputClass}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Min. 8 characters"
                        className={inputClass}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading || success}
                className="w-full h-12 mt-2 rounded-full font-bold text-sm
                           bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                           hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-md transition-all gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Creating account…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>
          </Form>

          {/* Footer link */}
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-7">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-neutral-900 dark:text-neutral-100 font-bold hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Big Logo with Adaptive Gradient ──────────────────── */}
      <div className="relative hidden lg:flex w-1/2 bg-neutral-50 dark:bg-neutral-950 flex-col items-center justify-center overflow-hidden transition-colors duration-500">
        {/* Dynamic Premium Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-200/50 via-neutral-50 to-emerald-200/50 dark:from-blue-900/30 dark:via-neutral-950 dark:to-emerald-900/30 transition-colors duration-500" />

        {/* Soft Glow Orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-[100px] pointer-events-none transition-colors duration-500" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-400/30 dark:bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none transition-colors duration-500" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6 relative z-10"
        >
          {/* Logo Box - Inverts based on theme */}
          <div className="size-24 bg-neutral-900 dark:bg-white rounded-[2rem] flex items-center justify-center shadow-2xl dark:shadow-[0_0_60px_rgba(255,255,255,0.1)] transition-colors duration-500">
            <ShoppingBag className="size-12 text-white dark:text-neutral-950 transition-colors duration-500" />
          </div>
          <h1 className="text-neutral-900 dark:text-white font-black text-5xl tracking-tight transition-colors duration-500">
            ShopSphere
          </h1>
        </motion.div>
      </div>
    </div>
  );
}
