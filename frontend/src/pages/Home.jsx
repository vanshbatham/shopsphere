import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpDown,
  Camera,
  ChevronRight,
  Footprints,
  Glasses,
  Headphones,
  Heart,
  ImageIcon,
  Lamp,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Watch,
  Monitor,
  Smartphone,
  Shirt,
  Package,
  AlertCircle,
  CheckCircle2,
  Truck,
  ShieldCheck,
  RotateCcw,
  Zap,
  Star,
  Users,
  Tag,
  TrendingUp,
  Mail,
  Sparkles,
  Clock,
  BadgePercent,
  ScanSearch,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductRatingBadge from "@/components/ProductRatingBadge";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function AnimatedCounter({ target, suffix = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (isInView) motionVal.set(target);
  }, [isInView, target, motionVal]);
  useEffect(
    () => spring.on("change", (v) => setDisplay(Math.round(v))),
    [spring],
  );
  return (
    <span ref={ref}>
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

const TICKER_ITEMS = [
  "Free Shipping on orders ₹999+",
  "10,000+ Products",
  "Secure Checkout",
  "Easy 7-Day Returns",
  "500+ Verified Sellers",
  "24/7 Customer Support",
  "100% Authentic Products",
  "Cash on Delivery Available",
];

function MarqueeTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden bg-neutral-900 dark:bg-neutral-950 py-3 select-none">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 text-xs font-semibold text-white/80 tracking-wide uppercase"
          >
            <span className="size-1 rounded-full bg-white/40 flex-shrink-0" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function useCountdown(targetHours = 8) {
  const endTime = useRef(Date.now() + targetHours * 60 * 60 * 1000);
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, endTime.current - Date.now());
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function TimerUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 min-w-[52px] text-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xl font-bold tracking-tight text-white tabular-nums block"
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-widest text-white/50 mt-1">
        {label}
      </span>
    </div>
  );
}

const CATEGORY_VISUALS = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80", // Mobile
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&q=80", // Laptop
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80", // Headphones
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80", // Watch
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80", // Sports
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&q=80", // Fashion
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&q=80", // Camera
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80", // Home
];

const CATEGORY_GRADIENTS = [
  "from-blue-600/80 to-cyan-500/70",
  "from-violet-600/80 to-fuchsia-500/70",
  "from-emerald-600/80 to-teal-500/70",
  "from-amber-500/85 to-orange-500/75",
  "from-rose-600/80 to-pink-500/70",
  "from-neutral-900/85 to-neutral-700/70",
];

const SORT_OPTIONS = [
  { label: "Default", value: "default" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name: A → Z", value: "name_asc" },
  { label: "Name: Z → A", value: "name_desc" },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { toggleWishlist, isSaved } = useWishlist();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingSku, setAddingSku] = useState(null);
  const [email, setEmail] = useState("");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Toolbar State
  const [sort, setSort] = useState("default");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const countdown = useCountdown(8);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target))
        setFilterOpen(false);
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

  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return Package;
    const n = categoryName.toLowerCase();
    if (n.includes("laptops") || n.includes("computer")) return Monitor;
    if (n.includes("phone") || n.includes("mobile")) return Smartphone;
    if (n.includes("audio") || n.includes("headphone")) return Headphones;
    if (n.includes("watch") || n.includes("wearable")) return Watch;
    if (n.includes("shoe") || n.includes("sport")) return Footprints;
    if (n.includes("fashion") || n.includes("cloth")) return Shirt;
    if (n.includes("glass") || n.includes("eye")) return Glasses;
    if (n.includes("camera") || n.includes("photo")) return Camera;
    if (n.includes("home") || n.includes("furniture")) return Lamp;
    if (n.includes("electronics") || n.includes("device")) return Store;
    return Package;
  };

  const getCategoryImage = (categoryName, index) => {
    const n = (categoryName || "").toLowerCase();

    if (n.includes("phone") || n.includes("mobile")) return CATEGORY_VISUALS[0];

    if (n.includes("laptop") || n.includes("computer"))
      return CATEGORY_VISUALS[1];

    if (n.includes("audio") || n.includes("headphone"))
      return CATEGORY_VISUALS[2];

    if (n.includes("watch") || n.includes("wearable"))
      return CATEGORY_VISUALS[3];

    if (n.includes("sport")) return CATEGORY_VISUALS[4]; // <-- ADD THIS

    if (n.includes("fashion") || n.includes("cloth"))
      return CATEGORY_VISUALS[5];

    if (n.includes("camera") || n.includes("photo")) return CATEGORY_VISUALS[6];

    if (n.includes("home") || n.includes("furniture"))
      return CATEGORY_VISUALS[7];

    return CATEGORY_VISUALS[index % CATEGORY_VISUALS.length];
  };

  const getCategoryGradient = (index) =>
    CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];

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
    const fetchHomeData = async () => {
      try {
        const prodResponse = await fetch(
          "http://localhost:8080/api/v1/products",
        );
        if (!prodResponse.ok)
          throw new Error("Failed to fetch products from the server.");
        const prodData = await prodResponse.json();
        const rawProducts = prodData.content || prodData || [];
        setProducts(rawProducts); // Load all products so they can be sorted properly

        const catResponse = await fetch(
          "http://localhost:8080/api/v1/products/categories",
        );
        if (catResponse.ok) setCategories(await catResponse.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Compute displayed products by sorting the full list and grabbing the top 7
  const displayedProducts = [...products]
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      return 0;
    })
    .slice(0, 7);

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 w-full min-h-screen overflow-visible relative">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100]"
          >
            <div
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium text-white ${notification.type === "error" ? "bg-red-600" : "bg-neutral-900 dark:bg-neutral-700"}`}
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

      <main className="max-w-[1440px] flex mx-auto flex-col w-full">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="relative overflow-hidden shadow-sm mx-4 md:mx-8 mt-4 md:mt-8 rounded-2xl"
        >
          <img
            src="https://images.unsplash.com/photo-1727407209320-1fa6ae60ee05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzaG9wcGluZyUyMGVjb21tZXJjZSUyMHNhbGUlMjBiYW5uZXJ8ZW58MXwwfHx8MTc4MDIyMDc2OXww&ixlib=rb-4.1.0&q=80&w=1200"
            alt="Sale banner"
            className="object-cover w-full h-[480px] md:h-[560px] brightness-75 dark:brightness-50"
          />
          <div className="bg-gradient-to-r from-black/85 via-black/55 to-black/10 absolute inset-0" />
          <motion.div
            className="flex absolute inset-0 p-8 md:p-14 flex-col justify-center gap-5"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
              <Badge className="bg-white text-neutral-900 hover:bg-neutral-100 w-fit font-semibold px-3 py-1 pt-1.5">
                Season Sale
              </Badge>
              <Badge className="bg-yellow-400 text-neutral-900 hover:bg-yellow-300 w-fit font-semibold px-3 py-1 pt-1.5 gap-1.5">
                <BadgePercent className="size-3.5" /> Best-value picks
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="max-w-2xl font-extrabold text-white text-5xl md:text-8xl leading-[1.05] tracking-tight"
            >
              Up to 50% off
              <br />
              on top brands
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="max-w-xl text-white/85 text-sm md:text-base leading-relaxed"
            >
              Discover thousands of products from trusted sellers around the
              world, with curated categories, better deals, and faster shopping
              on every visit.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={() => navigate("/catalog")}
                  className="bg-white text-neutral-900 hover:bg-neutral-100 gap-2 w-fit font-semibold mt-1 shadow-md"
                >
                  Shop Now <ArrowRight className="size-4" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById("category-showcase");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white gap-2 mt-1 font-medium"
                >
                  Explore Categories <ScanSearch className="size-4" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.section>

        <div className="mt-4">
          <MarqueeTicker />
        </div>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="mx-4 md:mx-8 mt-6"
        >
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-900 dark:via-neutral-800/80 dark:to-neutral-900 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-20 bg-white/5 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Zap className="size-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest">
                  Flash Deals
                </p>
                <h3 className="text-white font-bold tracking-tight text-xl md:text-2xl leading-tight">
                  Lightning offers — today only
                </h3>
                <p className="text-white/50 text-xs mt-0.5">
                  Handpicked deals refreshed every few hours
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-white/40" />
                <span className="text-white/40 text-xs font-medium">
                  Ends in
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TimerUnit value={countdown.h} label="Hrs" />
                <span className="text-white/30 font-bold tracking-tight text-xl mb-4">
                  :
                </span>
                <TimerUnit value={countdown.m} label="Min" />
                <span className="text-white/30 font-bold tracking-tight text-xl mb-4">
                  :
                </span>
                <TimerUnit value={countdown.s} label="Sec" />
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex-shrink-0"
            >
              <Button
                onClick={() => navigate("/catalog")}
                className="bg-yellow-400 hover:bg-yellow-300 text-neutral-900 font-bold gap-2 shadow-lg"
              >
                View Deals
              </Button>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          ref={statsRef}
          initial="hidden"
          animate={statsInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="mx-4 md:mx-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            {
              icon: Package,
              label: "Products Listed",
              value: 10000,
              suffix: "+",
            },
            { icon: Users, label: "Active Sellers", value: 500, suffix: "+" },
            { icon: Tag, label: "Categories", value: 50, suffix: "+" },
            { icon: Star, label: "Avg. Rating", value: 4.8, suffix: "★" },
          ].map(({ icon: Icon, label, value, suffix }, i) => (
            <motion.div
              key={label}
              custom={i}
              variants={fadeUp}
              className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-5 py-5 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2 text-green-700 dark:text-green-500 mb-1">
                <Icon className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {label}
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
                {statsInView ? (
                  <AnimatedCounter target={value} suffix={suffix} />
                ) : (
                  `0${suffix}`
                )}
              </p>
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          id="category-showcase"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="px-4 md:px-8 mt-12"
        >
          <motion.div
            variants={fadeUp}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5"
          >
            <div>
              <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
                Discover more
              </p>
              <h2 className="font-bold tracking-tight text-2xl md:text-3xl text-neutral-900 dark:text-neutral-100">
                Explore Popular Categories
              </h2>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xl">
              Explore our most popular sections and discover top-rated products
              curated just for you. Find exactly what you need with ease.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {categories.slice(0, 6).map((cat, i) => {
              const IconComponent = getCategoryIcon(cat.name);
              const image = getCategoryImage(cat.name, i);
              const gradient = getCategoryGradient(i);

              return (
                <motion.div
                  key={cat.id}
                  custom={i}
                  variants={fadeUp}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() =>
                    navigate(
                      `/category/${cat.id}?name=${encodeURIComponent(cat.name)}`,
                    )
                  }
                  className="relative overflow-hidden rounded-2xl cursor-pointer group min-h-[280px] border border-neutral-200 dark:border-neutral-700/60"
                >
                  <img
                    src={image}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-tr ${gradient}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div className="size-12 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <IconComponent className="size-5 text-white" />
                      </div>
                      <div className="rounded-full bg-white/10 backdrop-blur-sm border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold text-white/90">
                        Featured
                      </div>
                    </div>
                    <div className="max-w-[85%]">
                      <h3 className="text-white font-bold tracking-tight text-2xl leading-tight">
                        {cat.name}
                      </h3>
                      <p className="text-white/70 text-sm mt-2 leading-relaxed">
                        Discover top picks, trending launches, and everyday
                        bestsellers in {cat.name.toLowerCase()}.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                        Explore category{" "}
                        <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {categories.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-8 text-sm text-neutral-500 dark:text-neutral-400 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                No categories found in the database.
              </div>
            )}
          </div>
        </motion.section>

        <section className="flex flex-col gap-4 px-4 md:px-8 mt-12">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-2xl tracking-tight text-neutral-900 dark:text-neutral-100">
              Browse Categories
            </h2>
            <Link
              to="/catalog"
              className="font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="size-4" />
            </Link>
          </div>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            {categories.slice(0, 6).map((cat, i) => {
              const IconComponent = getCategoryIcon(cat.name);
              return (
                <motion.div
                  key={cat.id}
                  custom={i}
                  variants={fadeUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.96 }}
                  className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/60 hover:border-neutral-400 dark:hover:border-neutral-500 hover:shadow-md dark:hover:shadow-black/30 cursor-pointer transition-all flex p-5 flex-col items-center gap-3 group"
                  onClick={() =>
                    navigate(
                      `/category/${cat.id}?name=${encodeURIComponent(cat.name)}`,
                    )
                  }
                >
                  <div className="size-12 rounded-full bg-neutral-50 dark:bg-neutral-800 flex justify-center items-center group-hover:bg-neutral-100 dark:group-hover:bg-neutral-700 transition-colors">
                    <IconComponent className="size-5 text-neutral-800 dark:text-neutral-200" />
                  </div>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white text-xs transition-colors text-center line-clamp-1">
                    {cat.name}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="px-4 md:px-8 mt-12"
        >
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-700/60 bg-neutral-50 dark:bg-neutral-900 p-6 md:p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: LayoutGrid,
                  title: "Curated Collections",
                  desc: "Handpicked selections of the latest trends, tailored to your personal style and needs.",
                },
                {
                  icon: ScanSearch,
                  title: "Seamless Discovery",
                  desc: "Easily navigate through our extensive catalog of premium products to find your perfect match.",
                },
                {
                  icon: Sparkles,
                  title: "Premium Quality",
                  desc: "We ensure every product on our platform meets strict standards for quality and authenticity.",
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  custom={i}
                  variants={fadeUp}
                  className="rounded-xl bg-white dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 p-5"
                >
                  <div className="size-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center mb-4">
                    <Icon className="size-4 text-white dark:text-neutral-900" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                    {title}
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1.5 leading-relaxed">
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        <section className="flex flex-col gap-4 px-4 md:px-8 mt-12">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-2xl tracking-tight text-neutral-900 dark:text-neutral-100">
              Featured Products
            </h2>
            <div className="flex items-center gap-2">
              {/* Jump to Category Filter */}
              <div className="relative" ref={filterRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterOpen((prev) => !prev)}
                  className="gap-2 text-xs border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 font-medium pr-3"
                >
                  <SlidersHorizontal className="size-3.5" /> Filter
                  <ChevronDown
                    className={`size-3 transition-transform ${filterOpen ? "rotate-180" : ""}`}
                  />
                </Button>
                <AnimatePresence>
                  {filterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 sm:left-0 top-full mt-1.5 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl dark:shadow-black/40 z-50 overflow-hidden py-1 max-h-60 overflow-y-auto"
                    >
                      <div className="px-4 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800 mb-1">
                        Jump to Category
                      </div>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() =>
                            navigate(
                              `/category/${cat.id}?name=${encodeURIComponent(cat.name)}`,
                            )
                          }
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Local Sort */}
              <div className="relative" ref={sortRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOpen((prev) => !prev)}
                  className="gap-2 text-xs border-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 font-medium pr-3"
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
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
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
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 h-[380px] flex flex-col gap-4 animate-pulse"
                >
                  <div className="aspect-square w-full rounded-md bg-neutral-100 dark:bg-neutral-800" />
                  <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
                  <div className="h-4 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded mt-auto" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800/50 text-sm font-medium">
              {error}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
            >
              {displayedProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  custom={i}
                  variants={fadeUp}
                  whileHover={{
                    y: -6,
                    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                  }}
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
                        <span className="text-xs font-medium">
                          No Image Available
                        </span>
                      </div>
                      <motion.div
                        className="absolute right-3 top-3"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
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
                      <Link
                        to={`/product/${product.id}`}
                        className="flex-1 flex flex-col"
                      >
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-tight hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                        <div className="mt-1">
                          <ProductRatingBadge skuCode={product.skuCode} />
                        </div>
                        <div className="flex items-center gap-2 mt-auto pt-2">
                          <span className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </Link>
                    </CardContent>
                    <CardFooter className="px-4 pt-0 pb-4">
                      <motion.div className="w-full" whileTap={{ scale: 0.97 }}>
                        <Button
                          className="bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 gap-2 w-full font-medium shadow-sm text-xs h-10"
                          onClick={(e) => handleAddToCart(e, product.skuCode)}
                          disabled={addingSku === product.skuCode}
                        >
                          <ShoppingCart className="size-3.5" />
                          {addingSku === product.skuCode
                            ? "Adding..."
                            : "Add to Cart"}
                        </Button>
                      </motion.div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}

              {(!isAuthenticated || user?.role?.toUpperCase() === "BUYER") && (
                <motion.div custom={displayedProducts.length} variants={fadeUp}>
                  <Card className="border-neutral-200 dark:border-neutral-700/60 border-dashed border-2 p-6 flex flex-col justify-center items-center gap-4 bg-neutral-50/50 dark:bg-neutral-900/50 min-h-[350px] h-full">
                    <div className="size-12 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex justify-center items-center shadow-sm">
                      <Store className="size-5 text-neutral-900 dark:text-neutral-200" />
                    </div>
                    <div className="text-center flex flex-col gap-1 max-w-[200px]">
                      <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                        Start selling today
                      </h3>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-normal">
                        Turn your products into steady income on ShopSphere.
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full"
                    >
                      <Button
                        onClick={() =>
                          navigate(
                            isAuthenticated ? "/become-seller" : "/login",
                          )
                        }
                        variant="outline"
                        className="gap-2 w-full mt-2 font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-xs border-neutral-200 dark:border-neutral-600 dark:text-neutral-200 h-10"
                      >
                        Become a Seller <ArrowRight className="size-3.5" />
                      </Button>
                    </motion.div>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="px-4 md:px-8 mt-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_.75fr] gap-6">
            <div className="relative overflow-hidden rounded-2xl min-h-[320px] border border-neutral-200 dark:border-neutral-700/60">
              <img
                src="https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1200&q=80"
                alt="Featured shopping lifestyle"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
              <div className="relative z-10 p-8 md:p-10 h-full flex flex-col justify-end max-w-xl">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                  Editor’s pick
                </p>
                <h2 className="font-bold tracking-tight text-2xl md:text-4xl text-white leading-tight">
                  Fresh arrivals for every kind of shopper
                </h2>
                <p className="text-white/75 text-sm leading-relaxed mt-3">
                  From everyday essentials to premium upgrades, discover items
                  that perfectly match your lifestyle. Shop the latest trends
                  and exclusive deals.
                </p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-5"
                >
                  <Button
                    onClick={() => navigate("/catalog")}
                    className="bg-white text-neutral-900 hover:bg-neutral-100 gap-2 font-semibold w-fit"
                  >
                    Discover More <ArrowRight className="size-4" />
                  </Button>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  icon: Truck,
                  title: "Fast delivery",
                  desc: "Reliable logistics for everyday orders.",
                },
                {
                  icon: ShieldCheck,
                  title: "Safer payments",
                  desc: "Protected checkout from cart to confirmation.",
                },
                {
                  icon: RotateCcw,
                  title: "Easy returns",
                  desc: "Simple policies that reduce buying hesitation.",
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  custom={i}
                  variants={fadeUp}
                  className="rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/60 p-5"
                >
                  <div className="size-11 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center mb-4">
                    <Icon className="size-5 text-white dark:text-neutral-900" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                    {title}
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1.5 leading-relaxed">
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="px-4 md:px-8 mt-16"
        >
          <motion.div variants={fadeUp} className="text-center mb-8">
            <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
              Why us
            </p>
            <h2 className="font-bold tracking-tight text-2xl md:text-3xl text-neutral-900 dark:text-neutral-100">
              Built for trust, built for you
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Truck,
                title: "Free Shipping",
                desc: "On all orders above ₹999. No hidden charges.",
              },
              {
                icon: ShieldCheck,
                title: "Secure Checkout",
                desc: "256-bit SSL encryption on every transaction.",
              },
              {
                icon: RotateCcw,
                title: "7-Day Returns",
                desc: "Not satisfied? Return with zero questions asked.",
              },
              {
                icon: TrendingUp,
                title: "Best Prices",
                desc: "Price-matched deals from 500+ verified sellers.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                custom={i}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6 flex flex-col gap-3 group hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-white dark:hover:bg-neutral-800/80 transition-all cursor-default"
              >
                <div className="size-11 rounded-xl bg-neutral-900 dark:bg-neutral-700 flex items-center justify-center">
                  <Icon className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                    {title}
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed mt-1">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="px-4 md:px-8 mt-10"
        >
          <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 justify-between overflow-hidden relative">
            <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-neutral-100 dark:from-neutral-800/60 to-transparent pointer-events-none" />
            <div className="flex flex-col gap-3 max-w-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-neutral-500 dark:text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                  Trending Now
                </span>
              </div>
              <h2 className="font-bold tracking-tight text-2xl md:text-3xl text-neutral-900 dark:text-neutral-100 leading-tight">
                The most-loved products
                <br />
                this week
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
                Curated from real buyer activity — the items your community
                can't stop buying.
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={() => navigate("/catalog")}
                  className="bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 gap-2 w-fit font-semibold shadow-sm"
                >
                  Explore Catalog <ArrowRight className="size-4" />
                </Button>
              </motion.div>
            </div>
            <div className="grid grid-cols-3 gap-3 flex-shrink-0">
              {["📱", "💻", "🎧", "⌚", "👟", "📸"].map((emoji, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.07,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="size-14 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-2xl shadow-sm"
                >
                  {emoji}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="px-4 md:px-8 mt-12"
        >
          <motion.div
            variants={fadeUp}
            className="flex items-end justify-between gap-4 mb-5"
          >
            <div>
              <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
                More to explore
              </p>
              <h2 className="font-bold tracking-tight text-2xl md:text-3xl text-neutral-900 dark:text-neutral-100">
                Trending Styles & Tech
              </h2>
            </div>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
                alt="Online shopping fashion"
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg">
                  Premium Collections
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2 leading-relaxed">
                  Explore our exclusive range of high-end products, carefully
                  sourced and curated for the modern lifestyle.
                </p>
              </div>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-700/60 bg-neutral-50 dark:bg-neutral-900 p-6 md:p-8 flex flex-col justify-center"
            >
              <div className="size-12 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center mb-5">
                <Sparkles className="size-5 text-white dark:text-neutral-900" />
              </div>
              <h3 className="font-bold tracking-tight text-2xl text-neutral-900 dark:text-neutral-100 leading-tight">
                A Seamless Shopping Experience
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-3 leading-relaxed max-w-xl">
                Enjoy a world-class shopping journey with personalized
                recommendations, secure checkouts, real-time stock updates, and
                lightning-fast delivery.
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="mt-5"
              >
                <Button
                  variant="outline"
                  onClick={() => navigate("/catalog")}
                  className="w-fit border-neutral-200 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 gap-2 font-medium"
                >
                  Browse Everything <ArrowRight className="size-4" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="px-4 md:px-8 mt-10 mb-12"
        >
          <div className="rounded-2xl bg-neutral-900 dark:bg-neutral-800/60 dark:border dark:border-neutral-700/60 p-8 md:p-12 text-center flex flex-col items-center gap-5 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 size-52 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-52 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="size-12 rounded-full bg-white/10 flex items-center justify-center">
              <Mail className="size-5 text-white" />
            </div>
            <div className="max-w-md">
              <h2 className="font-bold tracking-tight text-white text-2xl md:text-3xl">
                Get deals before anyone else
              </h2>
              <p className="text-white/50 text-sm mt-2 leading-relaxed">
                Subscribe to ShopSphere updates. No spam, just the deals that
                matter.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 px-4 py-2.5 text-sm outline-none focus:border-white/50 transition-colors"
              />
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button className="bg-white text-neutral-900 hover:bg-neutral-100 font-bold px-6 whitespace-nowrap w-full sm:w-auto">
                  Subscribe
                </Button>
              </motion.div>
            </div>
            <p className="text-white/25 text-xs">
              By subscribing you agree to our Privacy Policy. Unsubscribe
              anytime.
            </p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
