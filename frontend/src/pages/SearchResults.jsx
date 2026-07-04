import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  AlertCircle,
  ImageIcon,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  SearchX,
  Heart,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import ProductRatingBadge from "@/components/ProductRatingBadge";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { wishlistSkus, toggleWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishBusy, setWishBusy] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const fetchSearchResults = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(
          `http://localhost:8080/api/v1/products/search?keyword=${encodeURIComponent(query)}&page=${currentPage}&size=${pageSize}`,
        );
        if (!response.ok) throw new Error("Failed to fetch search results.");
        const data = await response.json();
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, currentPage]);

  const handleAddToCart = async (e, skuCode) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (!isAuthenticated || !token) {
      navigate("/login");
      return;
    }
    try {
      const invRes = await fetch(
        `http://localhost:8080/api/v1/inventory/${skuCode}`,
      );
      let stock = 0;
      if (invRes.ok) {
        const invText = await invRes.text();
        try {
          stock = JSON.parse(invText).availableQuantity || 0;
        } catch {
          stock = parseInt(invText) || 0;
        }
      }
      if (stock <= 0) throw new Error("Sorry, this item is out of stock!");
      const response = await fetch("http://localhost:8080/api/v1/carts/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skuCode, quantity: 1 }),
      });
      if (!response.ok) throw new Error("Failed to update cart.");
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleWishlist = async (e, skuCode) => {
    e.preventDefault();
    setWishBusy(skuCode);
    try {
      toggleWishlist(skuCode);
    } finally {
      setTimeout(() => setWishBusy(null), 250);
    }
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <div className="max-w-[1440px] mx-auto py-10 px-4 md:px-8">
          <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm h-[360px] flex flex-col animate-pulse"
              >
                <div className="h-48 w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 mb-4" />
                <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                <div className="h-4 w-4/5 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-700 rounded mt-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <div className="max-w-[1440px] mx-auto py-20 px-4 flex flex-col items-center text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Oops!</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <main className="max-w-[1440px] mx-auto py-10 px-4 md:px-8 min-h-[calc(100vh-8rem)]">
        <motion.button
          whileHover={{ x: -3 }}
          onClick={() => navigate("/")}
          className="flex items-center text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </motion.button>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8"
        >
          <motion.div variants={fadeUp}>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
              Search Results
            </p>
            <h1 className="text-3xl font-black tracking-tight mb-2 text-neutral-900 dark:text-neutral-100">
              {query ? `“${query}”` : "Search"}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Found {totalElements} product{totalElements === 1 ? "" : "s"}
            </p>
          </motion.div>

          {query && (
            <motion.div
              variants={fadeUp}
              className="flex items-center gap-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500"
            >
              <RefreshCw className="size-3.5" /> Live catalog search
            </motion.div>
          )}
        </motion.div>

        {!query ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <SearchX className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Start typing to search
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">
              Enter a product name, category, or brand to see matching items.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <SearchX className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              No matches found
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">
              We couldn't find anything matching “{query}”. Try checking your
              spelling or using more general terms.
            </p>
          </div>
        ) : (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {products.map((product, index) => {
                const inWishlist = wishlistSkus.includes(product.skuCode);
                return (
                  <motion.div
                    key={product.id}
                    custom={index}
                    variants={fadeUp}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="flex flex-col overflow-hidden border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-shadow group h-full">
                      <Link
                        to={`/product/${product.id}`}
                        className="flex-1 flex flex-col"
                      >
                        <div className="relative aspect-square w-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border-b border-neutral-100 dark:border-neutral-800">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="object-contain w-full h-full p-4 transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500"
                            style={{
                              display: product.imageUrl ? "none" : "flex",
                            }}
                          >
                            <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                          </div>

                          <button
                            onClick={(e) => handleWishlist(e, product.skuCode)}
                            disabled={wishBusy === product.skuCode}
                            aria-label={
                              inWishlist
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                            className={`absolute right-3 top-3 size-9 rounded-full backdrop-blur-sm border transition-all flex items-center justify-center ${inWishlist ? "bg-red-500/10 border-red-200 dark:border-red-900/60 text-red-500" : "bg-white/90 dark:bg-neutral-900/90 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400"}`}
                          >
                            {wishBusy === product.skuCode ? (
                              <RefreshCw className="size-4 animate-spin" />
                            ) : inWishlist ? (
                              <Check className="size-4 fill-red-500" />
                            ) : (
                              <Heart className="size-4" />
                            )}
                          </button>
                        </div>

                        <CardContent className="flex-1 p-4">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider uppercase mb-1">
                            {product.category?.name || "Uncategorized"}
                          </div>
                          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight mb-2 line-clamp-2 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                            {product.name}
                          </h3>
                          <div className="mb-2">
                            <ProductRatingBadge skuCode={product.skuCode} />
                          </div>
                          <div className="text-xl font-black text-neutral-900 dark:text-neutral-100 mt-auto tabular-nums">
                            {formatPrice(product.price)}
                          </div>
                        </CardContent>
                      </Link>

                      <CardFooter className="p-4 pt-0 mt-auto flex gap-2">
                        <Button
                          onClick={(e) => handleAddToCart(e, product.skuCode)}
                          className="w-full gap-2 font-medium bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900"
                        >
                          <ShoppingCart className="h-4 w-4" /> Add to Cart
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentPage === 0}
                  className="dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                >
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
