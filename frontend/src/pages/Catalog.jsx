import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  AlertCircle,
  PackageX,
  ImageIcon,
  Heart,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ChevronDown,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductRatingBadge from "@/components/ProductRatingBadge";

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, delay: i * 0.055, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const SORT_OPTIONS = [
  { label: "Default", value: "default" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name: A → Z", value: "name_asc" },
  { label: "Name: Z → A", value: "name_desc" },
];

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  index,
  addingSku,
  onAddToCart,
  isAuthenticated,
  navigate,
  toggleWishlist,
  isSaved,
  formatPrice,
  view,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  if (view === "list") {
    return (
      <motion.div
        ref={ref}
        custom={index % 8}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={cardVariant}
        whileHover={{ x: 4, transition: { duration: 0.2 } }}
        layout
      >
        <Card className="p-0 border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 overflow-hidden flex flex-row hover:shadow-lg dark:hover:shadow-black/30 transition-shadow group relative">
          {/* Image */}
          <div className="relative w-36 sm:w-44 flex-shrink-0 bg-neutral-50 dark:bg-neutral-800 border-r border-neutral-100 dark:border-neutral-700/60 flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-contain w-full h-full p-3 transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center text-neutral-400"
              style={{ display: product.imageUrl ? "none" : "flex" }}
            >
              <ImageIcon className="h-6 w-6 mb-1 opacity-40" />
              <span className="text-[10px] font-medium">No Image</span>
            </div>
            <motion.div
              whileTap={{ scale: 0.8 }}
              className="absolute right-2 top-2"
            >
              <Button
                variant="secondary"
                size="icon"
                className="size-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    navigate("/login");
                    return;
                  }
                  toggleWishlist(product.skuCode);
                }}
              >
                <Heart
                  className={`size-3.5 transition-colors ${isSaved(product.skuCode) ? "text-red-500 fill-red-500" : "text-neutral-600 dark:text-neutral-300"}`}
                />
              </Button>
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 p-4 justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-400 dark:text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
                {typeof product.category === "string"
                  ? product.category
                  : product.category?.name || "Uncategorized"}
              </span>
              <Link to={`/product/${product.id}`}>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm leading-snug hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              <ProductRatingBadge skuCode={product.skuCode} />
            </div>
            <div className="flex items-center justify-between mt-3 gap-3">
              <span className="font-extrabold text-neutral-900 dark:text-neutral-100 text-lg">
                {formatPrice(product.price)}
              </span>
              <motion.div whileTap={{ scale: 0.96 }}>
                <Button
                  className="bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 gap-2 font-medium shadow-sm text-xs h-9"
                  onClick={(e) => onAddToCart(e, product.skuCode)}
                  disabled={addingSku === product.skuCode}
                >
                  <ShoppingCart className="size-3.5" />
                  {addingSku === product.skuCode ? "Adding..." : "Add to Cart"}
                </Button>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      custom={index % 8}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={cardVariant}
      whileHover={{
        y: -6,
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
      }}
      layout
    >
      <Card className="p-0 border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 overflow-hidden flex flex-col hover:shadow-xl dark:hover:shadow-black/40 transition-shadow group relative h-full">
        <div className="relative aspect-square bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700/60 flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-contain w-full h-full p-4 transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center text-neutral-400"
            style={{ display: product.imageUrl ? "none" : "flex" }}
          >
            <ImageIcon className="h-8 w-8 mb-2 opacity-40" />
            <span className="text-xs font-medium">No Image Available</span>
          </div>
          <motion.div
            whileTap={{ scale: 0.8 }}
            className="absolute right-3 top-3"
          >
            <Button
              variant="secondary"
              size="icon"
              className="size-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAuthenticated) {
                  navigate("/login");
                  return;
                }
                toggleWishlist(product.skuCode);
              }}
            >
              <Heart
                className={`size-4 transition-colors ${isSaved(product.skuCode) ? "text-red-500 fill-red-500" : "text-neutral-600 dark:text-neutral-300"}`}
              />
            </Button>
          </motion.div>
        </div>

        <CardContent className="flex p-4 flex-col gap-1.5 flex-1">
          <span className="text-neutral-400 dark:text-neutral-500 font-semibold uppercase tracking-wider text-[10px] line-clamp-1">
            {typeof product.category === "string"
              ? product.category
              : product.category?.name || "Uncategorized"}
          </span>
          <Link to={`/product/${product.id}`} className="flex-1 flex flex-col">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm leading-tight hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
            <div className="mt-1">
              <ProductRatingBadge skuCode={product.skuCode} />
            </div>
            <div className="flex items-center gap-2 mt-auto pt-2">
              <span className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base">
                {formatPrice(product.price)}
              </span>
            </div>
          </Link>
        </CardContent>

        <CardFooter className="px-4 pt-0 pb-4">
          <motion.div className="w-full" whileTap={{ scale: 0.97 }}>
            <Button
              className="bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 gap-2 w-full font-medium shadow-sm text-xs h-10"
              onClick={(e) => onAddToCart(e, product.skuCode)}
              disabled={addingSku === product.skuCode}
            >
              <ShoppingCart className="size-3.5" />
              {addingSku === product.skuCode ? "Adding..." : "Add to Cart"}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Catalog() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toggleWishlist, isSaved } = useWishlist();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingSku, setAddingSku] = useState(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState("grid");
  const [activeCategory, setActiveCategory] = useState("All");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const sortRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  const handleAddToCart = async (e, skuCode) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (!isAuthenticated && !token) {
      navigate("/login");
      return;
    }
    setAddingSku(skuCode);
    try {
      const invRes = await fetch(
        `http://localhost:8080/api/v1/inventory/${skuCode}`,
      );
      let stock = 0;
      if (invRes.ok) {
        const invText = await invRes.text();
        try {
          const d = JSON.parse(invText);
          stock = d.availableQuantity ?? d.quantity ?? 0;
        } catch {
          stock = parseInt(invText) || 0;
        }
      }
      if (stock <= 0)
        throw new Error("Sorry, this item is currently out of stock!");
      const response = await fetch("http://localhost:8080/api/v1/carts/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skuCode, quantity: 1 }),
      });
      if (!response.ok) throw new Error("Failed to add to cart");
      window.dispatchEvent(new CustomEvent("cartUpdated"));
      showNotification("Added to your cart!", "success");
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setAddingSku(null);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/products");
        if (!response.ok)
          throw new Error("Failed to fetch products from the server.");
        const data = await response.json();
        setProducts(data.content || data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    "All",
    ...Array.from(
      new Set(
        products
          .map((p) =>
            typeof p.category === "string" ? p.category : p.category?.name,
          )
          .filter(Boolean),
      ),
    ),
  ];

  const filtered = products
    .filter((p) => {
      const catName =
        typeof p.category === "string" ? p.category : p.category?.name;
      return (
        (activeCategory === "All" || catName === activeCategory) &&
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      return 0;
    });

  const clearSearch = () => setSearch("");

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-[1440px] flex mx-auto py-10 px-4 md:px-8 flex-col w-full">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-8"
        >
          All Products
        </motion.h1>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 h-[380px] flex flex-col gap-4 animate-pulse"
            >
              <div className="aspect-square w-full rounded-md bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded mt-auto" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1440px] flex mx-auto py-20 px-8 flex-col items-center text-center w-full min-h-screen"
      >
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
          Oops! Something went wrong
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Try Again
        </Button>
      </motion.div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1440px] flex mx-auto py-20 px-8 flex-col items-center justify-center text-center w-full min-h-screen"
      >
        <PackageX className="h-16 w-16 text-neutral-300 dark:text-neutral-700 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          No Products Found
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400">
          It looks like the catalog is currently empty.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 w-full min-h-screen relative">
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
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1440px] flex mx-auto py-10 px-4 md:px-8 flex-col w-full gap-6">
        {/* Page Header */}
        <motion.div
          className="flex flex-col gap-1"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1
            variants={fadeUp}
            className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100"
          >
            All Products
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-neutral-500 dark:text-neutral-400 text-sm"
          >
            {filtered.length === products.length
              ? `Showing all ${products.length} items`
              : `Showing ${filtered.length} of ${products.length} items`}
          </motion.p>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col gap-3"
        >
          {/* Search + Sort + View toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl
                           border border-neutral-200 dark:border-neutral-700
                           text-sm text-neutral-900 dark:text-neutral-100
                           placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                           outline-none focus:border-neutral-400 dark:focus:border-neutral-500
                           focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800
                           transition-all bg-white dark:bg-neutral-900"
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  >
                    <X className="size-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Sort Dropdown */}
              <div className="relative" ref={sortRef}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 h-10 pr-3"
                  onClick={() => setSortOpen((p) => !p)}
                >
                  <ArrowUpDown className="size-3.5" />
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label || "Sort"}
                  <ChevronDown
                    className={`size-3 transition-transform ${sortOpen ? "rotate-180" : ""}`}
                  />
                </Button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl dark:shadow-black/40 z-50 overflow-hidden py-1"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSort(opt.value);
                            setSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                            sort === opt.value
                              ? "text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800"
                              : "text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {opt.label}
                          {sort === opt.value && (
                            <span className="float-right text-neutral-900 dark:text-neutral-100">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-xl p-1 bg-white dark:bg-neutral-900">
                {[
                  { icon: LayoutGrid, val: "grid" },
                  { icon: LayoutList, val: "list" },
                ].map(({ icon: Icon, val }) => (
                  <button
                    key={val}
                    onClick={() => setView(val)}
                    className={`size-8 rounded-lg flex items-center justify-center transition-all ${
                      view === val
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    }`}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Pills */}
          {categories.length > 1 && (
            <motion.div
              className="flex gap-2 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    activeCategory === cat
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm"
                      : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Active Filter Tags */}
        <AnimatePresence>
          {(search || activeCategory !== "All" || sort !== "default") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 flex-wrap overflow-hidden"
            >
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                Active filters:
              </span>
              {search && (
                <Badge
                  className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer gap-1 font-medium"
                  onClick={clearSearch}
                >
                  "{search}" <X className="size-3" />
                </Badge>
              )}
              {activeCategory !== "All" && (
                <Badge
                  className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer gap-1 font-medium"
                  onClick={() => setActiveCategory("All")}
                >
                  {activeCategory} <X className="size-3" />
                </Badge>
              )}
              {sort !== "default" && (
                <Badge
                  className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer gap-1 font-medium"
                  onClick={() => setSort("default")}
                >
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}{" "}
                  <X className="size-3" />
                </Badge>
              )}
              <button
                onClick={() => {
                  clearSearch();
                  setActiveCategory("All");
                  setSort("default");
                }}
                className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold ml-1 transition-colors"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results / Product Grid */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <PackageX className="h-14 w-14 text-neutral-200 dark:text-neutral-700 mb-4" />
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-lg mb-1">
                No products match your filters
              </h3>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-5">
                Try adjusting the search term or clearing the active filters.
              </p>
              <Button
                variant="outline"
                className="border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 text-xs"
                onClick={() => {
                  clearSearch();
                  setActiveCategory("All");
                  setSort("default");
                }}
              >
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={`${view}-${activeCategory}-${sort}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={
                view === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8"
                  : "flex flex-col gap-4"
              }
            >
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  addingSku={addingSku}
                  onAddToCart={handleAddToCart}
                  isAuthenticated={isAuthenticated}
                  navigate={navigate}
                  toggleWishlist={toggleWishlist}
                  isSaved={isSaved}
                  formatPrice={formatPrice}
                  view={view}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
