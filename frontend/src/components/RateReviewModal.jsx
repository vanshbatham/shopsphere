import { useState } from "react";
import { Star, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// NOTE: The reference design included a "Title (optional)" field and a photo-upload
// button. Neither exists on the backend — ReviewRequest only has productId, rating,
// and comment, and the Review entity has no image column. Both are omitted here.
// Add them to the backend first if you want them in this form.

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
            className={`size-9 ${n <= display ? "fill-amber-400 text-amber-400" : "fill-neutral-100 text-neutral-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

// skuCode (NOT product.id) must be passed in here — review-service forwards this
// value to order-service's verified-purchase check, which compares against
// OrderLineItem.skuCode, not the product's database UUID. Since this modal is
// opened directly from an order's line item, item.skuCode is exactly right.
export default function RateReviewModal({
  skuCode,
  productName,
  onClose,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const showBanner = (message, type = "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 4000);
  };

  const handleSubmit = async () => {
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
          productId: skuCode, // backend field name is productId, but expects skuCode
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (res.status === 201) {
        showBanner("Your review has been published!", "success");
        setTimeout(() => onSubmitted?.(), 900);
        return;
      }

      // The 403 handler returns a generic hardcoded message server-side, so we show
      // our own copy based on status code rather than the response body text.
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
    <div
      className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div className="flex flex-col">
            <span className="font-bold text-base text-neutral-900">
              Rate this product
            </span>
            {productName && (
              <span className="text-neutral-400 text-xs mt-0.5 line-clamp-1">
                {productName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {banner.show && (
            <div
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold ${banner.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}
            >
              {banner.type === "error" ? (
                <AlertCircle className="size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 shrink-0" />
              )}
              {banner.message}
            </div>
          )}

          <div className="flex flex-col items-center gap-2 py-2">
            <StarPicker value={rating} onChange={setRating} />
            <span className="text-xs font-semibold text-neutral-400">
              {rating === 0 ? "Tap a star to rate" : RATING_LABELS[rating]}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">
              Review (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="What did you like or dislike about this product?"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white resize-none transition-colors"
            />
            <span className="text-xs text-neutral-400 self-end">
              {comment.length}/1000
            </span>
          </div>
        </div>

        <div className="p-5 border-t border-neutral-100 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-neutral-200 font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit review"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
