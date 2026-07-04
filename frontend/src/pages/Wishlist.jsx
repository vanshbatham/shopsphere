import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ImageIcon,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function Wishlist() {
  const { wishlistSkus, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingSku, setAddingSku] = useState(null);
  const [removingSku, setRemovingSku] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

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

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/products");
        if (!response.ok) throw new Error("Failed to load catalog products.");
        const data = await response.json();
        const catalogProducts = data.content || data || [];
        const savedItems = catalogProducts.filter((p) =>
          wishlistSkus.includes(p.skuCode),
        );
        setProducts(savedItems);
      } catch (err) {
        showNotification(err.message, "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchWishlistProducts();
  }, [wishlistSkus]);

  const handleAddToCart = async (e, skuCode) => {
    e.preventDefault();
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
      showNotification("Moved item into your cart!", "success");
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setAddingSku(null);
    }
  };

  const handleRemove = (skuCode) => {
    setRemovingSku(skuCode);
    setTimeout(() => {
      toggleWishlist(skuCode);
      setRemovingSku(null);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-8 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-[380px] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 w-full min-h-screen">
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
                <AlertCircle className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 w-full">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex items-end justify-between mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800"
        >
          <motion.div variants={fadeUp} className="flex flex-col gap-1">
            <div className="flex items-center gap-3 mb-0.5">
              <div className="size-9 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center shadow-sm">
                <Heart className="size-4 text-white dark:text-neutral-900" />
              </div>
              <h1 className="font-black text-2xl md:text-3xl tracking-tight text-neutral-900 dark:text-neutral-100">
                My Wishlist
              </h1>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium ml-12">
              {products.length === 0
                ? "No saved items yet"
                : `${products.length} saved ${products.length === 1 ? "item" : "items"}`}
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Button
              variant="ghost"
              onClick={() => navigate("/catalog")}
              className="gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-semibold text-sm"
            >
              <ArrowLeft className="size-4" /> Continue browsing
            </Button>
          </motion.div>
        </motion.div>

        {/* Empty state */}
        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 16,
                delay: 0.15,
              }}
              className="size-20 rounded-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mb-5"
            >
              <Heart className="size-9 text-neutral-300 dark:text-neutral-600" />
            </motion.div>
            <h3 className="font-black text-xl text-neutral-900 dark:text-neutral-100 mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm text-center max-w-xs leading-relaxed mb-7">
              Tap the ♥ heart icons while browsing to save items you love here.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => navigate("/catalog")}
                className="bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 gap-2 font-semibold shadow-sm"
              >
                <Sparkles className="size-4" /> Explore Catalog
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8"
          >
            <AnimatePresence mode="popLayout">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  custom={i}
                  variants={fadeUp}
                  layout
                  exit={{
                    opacity: 0,
                    scale: 0.92,
                    y: 10,
                    transition: { duration: 0.28 },
                  }}
                  animate={
                    removingSku === product.skuCode
                      ? { opacity: 0, scale: 0.92, y: 10 }
                      : { opacity: 1, scale: 1, y: 0 }
                  }
                  whileHover={{
                    y: -6,
                    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                  }}
                >
                  <Card className="p-0 border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 overflow-hidden flex flex-col hover:shadow-xl dark:hover:shadow-black/40 transition-shadow group relative h-full">
                    {/* Image area */}
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
                        <ImageIcon className="size-8 opacity-40 mb-2" />
                        <span className="text-xs font-medium">No Image</span>
                      </div>

                      {/* Remove button */}
                      <motion.div
                        className="absolute right-3 top-3"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.85 }}
                      >
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm bg-white dark:bg-neutral-700 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-500 dark:hover:text-red-400 border border-neutral-200 dark:border-neutral-600"
                          onClick={() => handleRemove(product.skuCode)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </motion.div>

                      {/* Saved pill */}
                      <div className="absolute left-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                          <Heart className="size-2.5 fill-red-500 text-red-500" />{" "}
                          Saved
                        </span>
                      </div>
                    </div>

                    <CardContent className="flex p-4 flex-col gap-1.5 flex-1">
                      <span className="text-neutral-400 dark:text-neutral-500 font-semibold uppercase tracking-wider text-[10px] line-clamp-1">
                        {typeof product.category === "string"
                          ? product.category
                          : product.category?.name || "Item"}
                      </span>
                      <Link
                        to={`/product/${product.id}`}
                        className="flex-1 flex flex-col"
                      >
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm leading-tight hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                        <span className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base mt-auto pt-2">
                          {formatPrice(product.price)}
                        </span>
                      </Link>
                    </CardContent>

                    <CardFooter className="px-4 pt-0 pb-4 flex flex-col gap-2">
                      <motion.div className="w-full" whileTap={{ scale: 0.97 }}>
                        <Button
                          className="bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 gap-2 w-full font-semibold text-xs h-10 shadow-sm"
                          onClick={(e) => handleAddToCart(e, product.skuCode)}
                          disabled={addingSku === product.skuCode}
                        >
                          {addingSku === product.skuCode ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin" />{" "}
                              Moving…
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="size-3.5" /> Add to Cart
                            </>
                          )}
                        </Button>
                      </motion.div>
                      <Link
                        to={`/product/${product.id}`}
                        className="w-full text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        View product <ArrowRight className="size-3" />
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
