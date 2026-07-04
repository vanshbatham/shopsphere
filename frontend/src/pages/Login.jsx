import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ShoppingBag, ArrowRight, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function Login() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values) {
    setIsLoading(true);
    setApiError("");
    try {
      const response = await fetch("http://localhost:8080/api/v1/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Invalid email or password.");
      login(data.accessToken, data.refreshToken);
      navigate("/catalog");
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-neutral-950">
      {/* ── LEFT PANEL — Big Logo with Adaptive Gradient ───────────────────── */}
      <div className="relative hidden lg:flex w-1/2 bg-neutral-50 dark:bg-neutral-950 flex-col items-center justify-center overflow-hidden transition-colors duration-500">
        {/* Dynamic Premium Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/50 via-neutral-50 to-blue-200/50 dark:from-indigo-900/30 dark:via-neutral-950 dark:to-blue-900/30 transition-colors duration-500" />

        {/* Soft Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-400/30 dark:bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none transition-colors duration-500" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-[100px] pointer-events-none transition-colors duration-500" />

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

      {/* ── RIGHT PANEL — Login Form ───────────────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center px-6 py-16 bg-white dark:bg-neutral-950">
        {/* Mobile brand (Visible only on small screens) */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="size-10 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center">
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
              Welcome back
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-bold mt-2">
              Sign in to your ShopSphere account
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {/* API Error */}
              {apiError && (
                <div className="flex items-center gap-3 p-3.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl font-bold">
                  <AlertCircle className="size-4 shrink-0" />
                  {apiError}
                </div>
              )}

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
                        className="h-12 rounded-full px-5 border-neutral-200 dark:border-neutral-700
                                   bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                                   focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 font-medium"
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                        Password
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 rounded-full px-5 border-neutral-200 dark:border-neutral-700
                                   bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                                   focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 font-medium"
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
                disabled={isLoading}
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
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-8">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-neutral-900 dark:text-neutral-100 font-bold hover:underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
