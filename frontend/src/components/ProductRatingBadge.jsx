import { useState, useEffect } from "react";
import { Star } from "lucide-react";

export default function ProductRatingBadge({ skuCode, size = "size-3.5" }) {
  const [summary, setSummary] = useState(null); // { average, count } | null
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!skuCode) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSummary = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/v1/reviews/product/${skuCode}`,
        );
        if (!res.ok) throw new Error("Failed to load rating");
        const data = await res.json();
        if (cancelled) return;

        const reviews = data || [];
        if (reviews.length === 0) {
          setSummary(null);
        } else {
          const average =
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          setSummary({ average, count: reviews.length });
        }
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [skuCode]);

  // Render nothing while loading or if there are no reviews — avoids layout
  // flicker and keeps cards with no reviews visually uncluttered.
  if (isLoading || !summary) return null;

  const roundedRating = Math.round(summary.average);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`${size} ${n <= roundedRating ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"}`}
          />
        ))}
      </div>
      <span className="text-xs text-neutral-500 font-medium">
        ({summary.count})
      </span>
    </div>
  );
}
