import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  ArrowLeft,
  AlertCircle,
  ImageIcon,
  Truck,
  ShieldCheck,
  Tag,
  Store,
  Heart,
  CheckCircle2,
  RotateCcw,
  ZoomIn,
  BadgeCheck,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductReviews from "@/components/ProductReviews";

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const slideRight = {
  hidden: { opacity: 0, x: 32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Trust Badge Row ──────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: Truck, label: "Free delivery over ₹499" },
  { icon: ShieldCheck, label: "1 Year Brand Warranty" },
  { icon: RotateCcw, label: "7-Day Easy Returns" },
  { icon: BadgeCheck, label: "100% Authentic" },
];

// ─── Image slider config ──────────────────────────────────────────────────────

const SWIPE_DISTANCE_THRESHOLD = 60; // px
const SWIPE_VELOCITY_THRESHOLD = 400; // px/s

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toggleWishlist, isSaved } = useWishlist();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [wishlistBounce, setWishlistBounce] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Full gallery — falls back to the single cover image for products created
  // before multi-image upload existed, or an empty array if there's no image
  // at all (renders the "No Image Available" placeholder).
  const images =
    product?.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product?.imageUrl
        ? [product.imageUrl]
        : [];

  const activeImageUrl = images[activeImageIndex] || "";

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

  const goToImage = (index) => {
    if (images.length === 0) return;
    const wrapped = ((index % images.length) + images.length) % images.length;
    setActiveImageIndex(wrapped);
    setImgError(false);
  };

  const goPrev = () => goToImage(activeImageIndex - 1);
  const goNext = () => goToImage(activeImageIndex + 1);

  const handleDragEnd = (_, info) => {
    if (images.length <= 1) return;
    const { offset, velocity } = info;
    if (
      offset.x < -SWIPE_DISTANCE_THRESHOLD ||
      velocity.x < -SWIPE_VELOCITY_THRESHOLD
    ) {
      goNext();
    } else if (
      offset.x > SWIPE_DISTANCE_THRESHOLD ||
      velocity.x > SWIPE_VELOCITY_THRESHOLD
    ) {
      goPrev();
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem("accessToken");
    if (!isAuthenticated && !token) {
      navigate("/login");
      return;
    }
    setIsAdding(true);
    try {
      const invRes = await fetch(
        `http://localhost:8080/api/v1/inventory/${product.skuCode}`,
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
        body: JSON.stringify({ skuCode: product.skuCode, quantity }),
      });
      if (!response.ok) throw new Error("Failed to add to cart");
      window.dispatchEvent(new CustomEvent("cartUpdated"));
      showNotification("Added to your cart!", "success");
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    toggleWishlist(product.skuCode);
    setWishlistBounce(true);
    setTimeout(() => setWishlistBounce(false), 400);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/v1/products/${id}`,
        );
        if (!response.ok) {
          if (response.status === 404) throw new Error("Product not found.");
          throw new Error("Failed to fetch product details.");
        }
        setProduct(await response.json());
        setActiveImageIndex(0);
        setImgError(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Keyboard arrow navigation while zoomed in
  useEffect(() => {
    if (!zoomed) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomed, activeImageIndex, images.length]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-[1440px] flex mx-auto py-10 px-4 md:px-8 flex-col w-full animate-pulse min-h-screen">
        <div className="h-4 w-32 bg-neutral-100 dark:bg-neutral-800 rounded mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <div className="aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700" />
          <div className="flex flex-col gap-5 pt-4">
            <div className="h-3.5 w-20 bg-neutral-100 dark:bg-neutral-800 rounded" />
            <div className="h-9 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
            <div className="h-9 w-2/5 bg-neutral-100 dark:bg-neutral-800 rounded" />
            <div className="h-28 w-full bg-neutral-100 dark:bg-neutral-800 rounded mt-2" />
            <div className="h-24 w-full bg-neutral-100 dark:bg-neutral-800 rounded" />
            <div className="flex gap-4 mt-auto pt-6">
              <div className="h-12 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
              <div className="h-12 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1700px] flex mx-auto py-20 px-8 flex-col items-center text-center w-full min-h-screen"
      >
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
          Oops!
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">{error}</p>
        <Button
          onClick={() => navigate("/catalog")}
          variant="outline"
          className="border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Back to Catalog
        </Button>
      </motion.div>
    );
  }

  const saved = isSaved(product.skuCode);

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 w-full min-h-screen relative">
      {/* ── Toast ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
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
                <AlertCircle className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Image Zoom Overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {zoomed && activeImageUrl && !imgError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center cursor-zoom-out p-6"
            onClick={() => setZoomed(false)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImageIndex}
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.88, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                src={activeImageUrl}
                alt={product.name}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="size-6" />
                </button>
                <span
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeImageIndex + 1} / {images.length}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1700px] flex mx-auto py-10 px-4 md:px-8 flex-col w-full">
        {/* ── Back Button ────────────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          whileHover={{ x: -3 }}
          onClick={() => navigate("/catalog")}
          className="flex items-center text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-10 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Catalog
        </motion.button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* ── LEFT: Image Panel ──────────────────────────────────────────── */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={slideLeft}
            className="flex flex-col gap-4"
          >
            {/* Main image / slider */}
            <div
              className={`relative aspect-square rounded-2xl border border-neutral-200 dark:border-neutral-700/60 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-8 overflow-hidden group select-none ${activeImageUrl && !imgError ? "cursor-zoom-in" : ""}`}
            >
              {activeImageUrl && !imgError ? (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIndex}
                    drag={images.length > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.6}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    src={activeImageUrl}
                    alt={product.name}
                    className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105 cursor-grab active:cursor-grabbing"
                    onError={() => setImgError(true)}
                    onClick={() => setZoomed(true)}
                    draggable={false}
                  />
                </AnimatePresence>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 bg-neutral-100/50 dark:bg-neutral-800/50">
                  <ImageIcon className="h-16 w-16 mb-4 opacity-40" />
                  <span className="font-medium text-sm">
                    No Image Available
                  </span>
                </div>
              )}

              {/* Prev/Next arrows — only when there's more than one image */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="size-4" />
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          goToImage(i);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          i === activeImageIndex
                            ? "w-5 bg-neutral-900 dark:bg-white"
                            : "w-1.5 bg-neutral-900/30 dark:bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Zoom hint */}
              {activeImageUrl && !imgError && (
                <div className="absolute top-3 right-14 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/60 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-full pointer-events-none">
                  <ZoomIn className="size-3" /> Click to zoom
                </div>
              )}

              {/* Wishlist button */}
              <motion.div
                animate={
                  wishlistBounce
                    ? { scale: [1, 1.3, 0.9, 1.1, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.4 }}
                className="absolute right-4 top-4"
              >
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full shadow-sm bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-100 dark:border-neutral-700"
                  onClick={handleWishlist}
                >
                  <Heart
                    className={`size-5 transition-colors ${saved ? "text-red-500 fill-red-500" : "text-neutral-600 dark:text-neutral-300"}`}
                  />
                </Button>
              </motion.div>
            </div>

            {/* Thumbnail strip — only when there's more than one image */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => goToImage(i)}
                    className={`relative shrink-0 size-16 rounded-xl overflow-hidden border-2 transition-all ${
                      i === activeImageIndex
                        ? "border-neutral-900 dark:border-white"
                        : "border-neutral-200 dark:border-neutral-700 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${product.name} ${i + 1}`}
                      className="w-full h-full object-cover bg-neutral-50 dark:bg-neutral-900"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust row below image */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="grid grid-cols-2 gap-2"
            >
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800"
                >
                  <Icon className="size-3.5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Info Panel ──────────────────────────────────────────── */}
          <motion.div
            className="flex flex-col"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Category + SKU row */}
            <motion.div
              variants={fadeUp}
              className="flex items-center gap-2 mb-3 flex-wrap"
            >
              <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-semibold text-[10px] tracking-wider uppercase">
                {typeof product.category === "string"
                  ? product.category
                  : product.category?.name || "Uncategorized"}
              </Badge>
              <span className="text-neutral-300 dark:text-neutral-600 text-xs">
                ·
              </span>
              <span className="text-neutral-400 dark:text-neutral-500 text-xs font-mono">
                SKU: {product.skuCode}
              </span>
            </motion.div>

            {/* Product name */}
            <motion.h1
              variants={fadeUp}
              className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 mb-4 leading-tight"
            >
              {product.name}
            </motion.h1>

            {/* Seller */}
            {product.shopName && (
              <motion.div
                variants={fadeUp}
                className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mb-5"
              >
                <Store className="h-4 w-4 mr-2 text-neutral-400 dark:text-neutral-500" />
                Fulfilled by{" "}
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 ml-1 underline decoration-neutral-200 dark:decoration-neutral-700 underline-offset-4">
                  {product.shopName}
                </span>
              </motion.div>
            )}

            {/* Price */}
            <motion.div variants={fadeUp} className="mb-6">
              <span className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                {formatPrice(product.price)}
              </span>
              <span className="ml-3 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border border-green-100 dark:border-green-900 px-2.5 py-1 rounded-full">
                In Stock
              </span>
            </motion.div>

            {/* Description */}
            {product.description && (
              <motion.p
                variants={fadeUp}
                className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6 border-t border-neutral-100 dark:border-neutral-800 pt-5"
              >
                {product.description}
              </motion.p>
            )}

            {/* Quantity selector */}
            <motion.div
              variants={fadeUp}
              className="flex items-center gap-3 mb-6"
            >
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Quantity
              </span>
              <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-xl p-1 bg-neutral-50 dark:bg-neutral-900">
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="size-8 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="size-3.5" />
                </motion.button>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={quantity}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="w-10 text-center text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums"
                  >
                    {quantity}
                  </motion.span>
                </AnimatePresence>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  disabled={quantity >= 20}
                  className="size-8 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="size-3.5" />
                </motion.button>
              </div>
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-6"
            >
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-sm font-bold gap-2 border-neutral-200 dark:border-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 h-12"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isAdding ? "Adding..." : "Add to Cart"}
                </Button>
              </motion.div>
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  size="lg"
                  className="w-full text-sm font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 h-12 shadow-sm"
                  onClick={() =>
                    navigate(
                      `/checkout?directSku=${product.skuCode}&qty=${quantity}`,
                    )
                  }
                >
                  Buy Now
                </Button>
              </motion.div>
            </motion.div>

            {/* Wishlist text link */}
            <motion.button
              variants={fadeUp}
              onClick={handleWishlist}
              className="flex items-center gap-2 mt-4 text-xs font-semibold text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors w-fit self-center sm:self-start"
            >
              <Heart
                className={`size-3.5 transition-colors ${saved ? "text-red-500 fill-red-500" : ""}`}
              />
              {saved ? "Saved to Wishlist" : "Save to Wishlist"}
            </motion.button>
          </motion.div>
        </div>

        {/* ── Customer Reviews ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 max-w-3xl"
        >
          <ProductReviews skuCode={product.skuCode} />
        </motion.div>
      </main>
    </div>
  );
}
