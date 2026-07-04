import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  ShieldCheck,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  X,
  PenLine,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
    day: "numeric",
  });
};

// Read-only star display
function StarRow({ rating, size = "size-4" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-neutral-200 dark:fill-neutral-700 text-neutral-200 dark:text-neutral-700"
          }`}
        />
      ))}
    </div>
  );
}

// Interactive star picker for the review form
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={`size-8 ${
              n <= display
                ? "fill-amber-400 text-amber-400"
                : "fill-neutral-100 dark:fill-neutral-800 text-neutral-300 dark:text-neutral-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ skuCode }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const showBanner = (message, type = "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 4500);
  };

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/v1/reviews/product/${skuCode}`,
      );
      if (!res.ok) throw new Error("Failed to load reviews.");
      const data = await res.json();
      setReviews(data || []);
    } catch (err) {
      console.error("[ProductReviews] Failed to fetch reviews:", err);
    } finally {
      setIsLoading(false);
    }
  }, [skuCode]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
    return { star, count, pct };
  });

  const handleOpenForm = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setShowForm(true);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      showBanner("Please select a star rating.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8080/api/v1/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: skuCode,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (res.status === 201) {
        showBanner("Your review has been published!", "success");
        setShowForm(false);
        setRating(0);
        setComment("");
        fetchReviews();
        return;
      }
      if (res.status === 403) {
        showBanner("You can only review products you've purchased.", "error");
      } else if (res.status === 409) {
        showBanner("You've already reviewed this product.", "error");
      } else if (res.status === 503) {
        showBanner(
          "Verification is temporarily unavailable. Please try again shortly.",
          "error",
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        showBanner(errData.message || "Failed to submit review.", "error");
      }
    } catch (err) {
      showBanner("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* ── Toast banner ─────────────────────────────────────────────────── */}
      {banner.show && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold text-white ${
              banner.type === "error"
                ? "bg-red-600"
                : "bg-neutral-900 dark:bg-neutral-700"
            }`}
          >
            {banner.type === "error" ? (
              <AlertCircle className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {banner.message}
          </div>
        </div>
      )}

      <Card className="p-6 gap-6 border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 shadow-sm dark:shadow-black/20">
        <CardHeader className="p-0 gap-1">
          <CardTitle className="text-xl font-bold leading-7 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <MessageSquare className="size-5 text-neutral-500 dark:text-neutral-400" />
            Customer Reviews
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex flex-col gap-6">
          {isLoading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              <div className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
              <div className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
            </div>
          ) : (
            <>
              {/* ── Summary ──────────────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                <div className="flex flex-col items-center sm:items-start gap-1 shrink-0">
                  <span className="font-extrabold text-4xl text-neutral-900 dark:text-neutral-100">
                    {reviews.length ? averageRating.toFixed(1) : "—"}
                  </span>
                  <StarRow rating={Math.round(averageRating)} size="size-4" />
                  <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                    {reviews.length}{" "}
                    {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                </div>

                {reviews.length > 0 && (
                  <div className="flex flex-col gap-1.5 flex-1 w-full">
                    {distribution.map(({ star, count, pct }) => (
                      <div
                        key={star}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="w-3 font-semibold text-neutral-600 dark:text-neutral-400">
                          {star}
                        </span>
                        <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />
                        <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-neutral-500 dark:text-neutral-500">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="bg-neutral-100 dark:bg-neutral-800" />

              {/* ── Review list ──────────────────────────────────────────── */}
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <MessageSquare className="size-8 text-neutral-300 dark:text-neutral-700" />
                  <span className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
                    No reviews yet
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 text-xs max-w-xs">
                    Be the first verified buyer to share your experience with
                    this product.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex gap-3">
                      <div className="size-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                        <User className="size-4 text-neutral-400 dark:text-neutral-500" />
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                            Verified Buyer
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900">
                            <ShieldCheck className="size-3" /> Verified Purchase
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRow rating={review.rating} size="size-3.5" />
                          <span className="text-neutral-400 dark:text-neutral-500 text-xs">
                            {formatRelativeTime(review.createdAt)}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator className="bg-neutral-100 dark:bg-neutral-800" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
