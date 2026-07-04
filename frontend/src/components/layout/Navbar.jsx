import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Package2,
  Search,
  ChevronDown,
  Store,
  Bell,
  Headset,
  TrendingUp,
  Download,
  Heart,
  MapPin,
  Ticket,
  LogOut,
  Package,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useState, useEffect } from "react";
import ModeToggle from "@/components/ui/ModeToggle";

/* ─── Keyframe injector (runs once) ─── */
const STYLES = `
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes orbitSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes orbitSpinReverse {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes pulseBadge {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.25); }
  }
  @keyframes dropIn {
    0%   { opacity: 0; transform: translateY(-6px) scale(0.97); }
    100% { opacity: 1; transform: translateY(0)  scale(1);    }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
    50%       { box-shadow: 0 0 18px 4px rgba(99,102,241,0.18); }
  }
  @keyframes searchGlow {
    0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.0); }
    100% { box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
  }
  @keyframes badgePop {
    0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
    60%  { transform: scale(1.35) rotate(5deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1;  }
  }
  @keyframes heartBeat {
    0%, 100% { transform: scale(1); }
    30%       { transform: scale(1.3); }
    60%       { transform: scale(0.9); }
  }
  @keyframes fadeSlideUp {
    0%   { opacity: 0; transform: translateY(4px); }
    100% { opacity: 1; transform: translateY(0);   }
  }

  /* Shimmer text — light mode */
  .logo-text {
    background: linear-gradient(
      120deg,
      #0f172a 0%, #0f172a 35%,
      #6366f1 48%, #a78bfa 54%,
      #0f172a 65%, #0f172a 100%
    );
    background-size: 250% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3.5s linear infinite;
  }

  /* Shimmer text — dark mode */
  .dark .logo-text {
    background: linear-gradient(
      120deg,
      #e2e8f0 0%, #e2e8f0 35%,
      #818cf8 48%, #c4b5fd 54%,
      #e2e8f0 65%, #e2e8f0 100%
    );
    background-size: 250% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3.5s linear infinite;
  }

  .logo-sphere { position: relative; width: 36px; height: 36px; }
  .logo-sphere-core {
    position: absolute; inset: 0; border-radius: 10px;
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease;
    box-shadow: 0 2px 8px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.12);
  }
  .logo-sphere-core svg { color: #e0e7ff; filter: drop-shadow(0 0 4px rgba(165,180,252,0.6)); transition: filter 0.3s ease; }
  .logo-orbit-1 {
    position: absolute; inset: -4px; border-radius: 14px;
    border: 1.5px solid transparent;
    background: linear-gradient(#fff,#fff) padding-box, linear-gradient(135deg, #6366f1, #a78bfa, #6366f1) border-box;
    opacity: 0; transform: scale(0.85);
    transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }
  .logo-orbit-2 {
    position: absolute; inset: -8px; border-radius: 18px;
    border: 1px solid transparent;
    background: linear-gradient(#fff,#fff) padding-box, linear-gradient(225deg, #4f46e5, #c084fc, #4f46e5) border-box;
    opacity: 0; transform: scale(0.75);
    transition: opacity 0.45s ease 0.05s, transform 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.05s;
  }
  .logo-sphere-wrapper:hover .logo-orbit-1 { opacity: 1; transform: scale(1); animation: orbitSpin 4s linear infinite; }
  .logo-sphere-wrapper:hover .logo-orbit-2 { opacity: 0.6; transform: scale(1); animation: orbitSpinReverse 6s linear infinite; }
  .logo-sphere-wrapper:hover .logo-sphere-core {
    transform: scale(1.08);
    box-shadow: 0 4px 20px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
    animation: glowPulse 2s ease-in-out infinite;
  }
  .logo-sphere-wrapper:hover .logo-sphere-core svg { filter: drop-shadow(0 0 7px rgba(165,180,252,0.9)); }
  .logo-sphere-wrapper { padding: 8px; margin: -8px; }

  .nav-dropdown { animation: dropIn 0.2s cubic-bezier(0.22,1,0.36,1) forwards; transform-origin: top right; }
  .badge-pop { animation: badgePop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }

  .nav-link-hover { position: relative; }
  .nav-link-hover::after {
    content: ''; position: absolute; bottom: 10px; left: 0;
    width: 0; height: 1.5px;
    background: linear-gradient(90deg, #6366f1, #a78bfa);
    border-radius: 2px;
    transition: width 0.25s cubic-bezier(0.22,1,0.36,1);
  }
  .nav-link-hover:hover::after { width: 100%; }
  .heart-hover:hover svg { animation: heartBeat 0.5s ease; color: #ef4444 !important; }
  .chevron-anim { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); }
  .navbar-border {
    position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.0) 20%, rgba(99,102,241,0.4) 50%, rgba(99,102,241,0.0) 80%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmer 4s linear infinite;
  }
  .dropdown-item { transition: background 0.15s ease, color 0.15s ease, padding-left 0.2s ease; }
  .dropdown-item:hover { padding-left: 22px !important; }
  .dropdown-item-stagger:nth-child(1) { animation: fadeSlideUp 0.18s ease 0.03s both; }
  .dropdown-item-stagger:nth-child(2) { animation: fadeSlideUp 0.18s ease 0.06s both; }
  .dropdown-item-stagger:nth-child(3) { animation: fadeSlideUp 0.18s ease 0.09s both; }
  .dropdown-item-stagger:nth-child(4) { animation: fadeSlideUp 0.18s ease 0.12s both; }
  .dropdown-item-stagger:nth-child(5) { animation: fadeSlideUp 0.18s ease 0.15s both; }
  .dropdown-item-stagger:nth-child(6) { animation: fadeSlideUp 0.18s ease 0.18s both; }
  .dropdown-item-stagger:nth-child(7) { animation: fadeSlideUp 0.18s ease 0.21s both; }
  .dropdown-item-stagger:nth-child(8) { animation: fadeSlideUp 0.18s ease 0.24s both; }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById("navbar-animations")
) {
  const style = document.createElement("style");
  style.id = "navbar-animations";
  style.textContent = STYLES;
  document.head.appendChild(style);
}

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { wishlistSkus } = useWishlist();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [prevWishlist, setPrevWishlist] = useState(0);
  const [badgeKey, setBadgeKey] = useState(0);

  const wishlistCount = wishlistSkus?.length || 0;

  useEffect(() => {
    if (wishlistCount !== prevWishlist) {
      setBadgeKey((k) => k + 1);
      setPrevWishlist(wishlistCount);
    }
  }, [wishlistCount]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const fetchCartCount = async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:8080/api/v1/carts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCartCount(
          data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        );
      } else {
        setCartCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch cart count", err);
    }
  };

  useEffect(() => {
    fetchCartCount();
    window.addEventListener("cartUpdated", fetchCartCount);
    return () => window.removeEventListener("cartUpdated", fetchCartCount);
  }, [isAuthenticated]);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full
                 bg-white/95 dark:bg-neutral-950/95
                 text-neutral-950 dark:text-neutral-100
                 shadow-sm dark:shadow-neutral-900/50"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "relative",
      }}
    >
      <div className="navbar-border" />

      <div className="max-w-[1440px] mx-auto flex h-16 items-center justify-between px-4 md:px-8 gap-4 md:gap-8">
        {/* ── Logo ── */}
        <Link
          to="/"
          className="flex items-center gap-3 min-w-fit logo-sphere-wrapper"
          style={{ textDecoration: "none" }}
        >
          <div className="logo-sphere" style={{ flexShrink: 0 }}>
            <div className="logo-sphere-core">
              <Package2 style={{ width: 18, height: 18 }} />
            </div>
            <div className="logo-orbit-1" />
            <div className="logo-orbit-2" />
          </div>
          <span
            className="logo-text font-semibold text-lg tracking-tight select-none"
            style={{ letterSpacing: "-0.02em" }}
          >
            ShopSphere
          </span>
        </Link>

        {/* ── Search Bar ── */}
        <div className="hidden md:flex flex-1 max-w-2xl relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Search for products, brands and more..."
            className="w-full pl-9 h-10 rounded-full
                       bg-neutral-50 dark:bg-neutral-900
                       border border-neutral-200 dark:border-neutral-700
                       text-sm text-neutral-900 dark:text-neutral-100
                       placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                       outline-none transition-all duration-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            onFocus={(e) => {
              e.target.style.borderColor = "#a5b4fc";
              e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
              e.target.style.backgroundColor =
                document.documentElement.classList.contains("dark")
                  ? "#111113"
                  : "#fff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "";
              e.target.style.boxShadow = "none";
              e.target.style.backgroundColor = "";
            }}
          />
        </div>

        {/* ── Right Interaction Links ── */}
        <div className="flex items-center gap-2 md:gap-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {/* ── Dark Mode Toggle ── */}
          <ModeToggle />

          {/* Account Dropdown */}
          {isAuthenticated ? (
            <div className="relative group">
              <div className="nav-link-hover flex items-center gap-1.5 hover:text-neutral-950 dark:hover:text-white transition-colors duration-200 cursor-pointer py-4">
                <User className="h-4 w-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 group-hover:scale-110" />
                <span className="hidden md:block">Account</span>
                <ChevronDown className="chevron-anim h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 group-hover:rotate-180" />
              </div>

              <div className="absolute right-0 top-full w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pt-1">
                <div className="nav-dropdown bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/60 rounded-xl shadow-lg dark:shadow-black/40 overflow-hidden flex flex-col py-1">
                  <div className="px-4 py-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                    Your Account
                  </div>
                  <Link
                    to="/profile"
                    className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white font-medium"
                  >
                    <User className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                    My Profile
                  </Link>

                  {(user?.role?.toUpperCase() === "SELLER" ||
                    user?.role?.toUpperCase() === "ADMIN") && (
                    <Link
                      to="/dashboard"
                      className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium border-t border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-800/30"
                    >
                      <Store className="mr-3 h-4 w-4 text-neutral-900 dark:text-neutral-100" />{" "}
                      Seller Dashboard
                    </Link>
                  )}

                  {user?.role?.toUpperCase() === "ADMIN" && (
                    <Link
                      to="/admin/coupons"
                      className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 font-medium border-b border-neutral-100 dark:border-neutral-800"
                    >
                      <Ticket className="mr-3 h-4 w-4 text-indigo-600 dark:text-indigo-400" />{" "}
                      Manage Coupons
                    </Link>
                  )}

                  {user?.role?.toUpperCase() === "ADMIN" && (
                    <Link
                      to="/admin/orders"
                      className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 font-medium border-b border-neutral-100 dark:border-neutral-800"
                    >
                      <Package className="mr-3 h-4 w-4 text-indigo-600 dark:text-indigo-400" />{" "}
                      Manage Orders
                    </Link>
                  )}

                  {user?.role?.toUpperCase() === "BUYER" && (
                    <Link
                      to="/become-seller"
                      className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 font-medium border-t border-b border-neutral-100 dark:border-neutral-800"
                    >
                      <Store className="mr-3 h-4 w-4 text-emerald-600 dark:text-emerald-400" />{" "}
                      Become a Seller
                    </Link>
                  )}

                  <Link
                    to="/orders"
                    className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white font-medium"
                  >
                    <Package className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                    Orders
                  </Link>

                  <div className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white cursor-pointer font-medium">
                    <Ticket className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                    Coupons
                  </div>

                  <Link
                    to="/addresses"
                    className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white font-medium"
                  >
                    <MapPin className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                    Saved Addresses
                  </Link>

                  <div
                    onClick={handleLogout}
                    className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-red-500 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/30 cursor-pointer font-medium"
                  >
                    <LogOut className="mr-3 h-4 w-4" /> Logout
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <div className="nav-link-hover flex items-center gap-1.5 hover:text-neutral-950 dark:hover:text-white transition-colors duration-200 cursor-pointer py-4">
                <User className="h-4 w-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 group-hover:scale-110" />
                <Link
                  to="/login"
                  className="hidden md:block hover:text-neutral-950 dark:hover:text-white font-medium"
                >
                  Login
                </Link>
                <ChevronDown className="chevron-anim h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 group-hover:rotate-180" />
              </div>

              <div className="absolute right-0 top-full w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pt-1">
                <div className="nav-dropdown bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/60 rounded-xl shadow-lg dark:shadow-black/40 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      New customer?
                    </span>
                    <Link
                      to="/register"
                      className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:underline"
                    >
                      Sign Up
                    </Link>
                  </div>
                  <Link
                    to="/login"
                    className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium"
                  >
                    <User className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                    My Profile
                  </Link>
                  <Link
                    to="/login"
                    className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium"
                  >
                    <Package className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                    Orders
                  </Link>
                  <Link
                    to="/login"
                    className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium"
                  >
                    <Heart className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                    Wishlist
                  </Link>
                  <Link
                    to="/login"
                    className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium border-t border-neutral-100 dark:border-neutral-800"
                  >
                    <Store className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                    Become a Seller
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* More Dropdown */}
          <div className="relative group hidden md:block">
            <div className="nav-link-hover flex items-center gap-1 hover:text-neutral-950 dark:hover:text-white transition-colors duration-200 cursor-pointer py-4">
              <span>More</span>
              <ChevronDown className="chevron-anim h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 group-hover:rotate-180" />
            </div>
            <div className="absolute right-0 top-full w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pt-1">
              <div className="nav-dropdown bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/60 rounded-xl shadow-lg dark:shadow-black/40 overflow-hidden flex flex-col py-1">
                <Link
                  to={
                    isAuthenticated
                      ? user?.role?.toUpperCase() === "BUYER"
                        ? "/become-seller"
                        : "/dashboard"
                      : "/login"
                  }
                  className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white cursor-pointer font-medium"
                >
                  <Store className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                  Become a Seller
                </Link>
                <div className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white cursor-pointer font-medium">
                  <Bell className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                  Notifications
                </div>
                <div className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white cursor-pointer font-medium">
                  <Headset className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                  Customer Care
                </div>
                <div className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white cursor-pointer font-medium">
                  <TrendingUp className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                  Advertise
                </div>
                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                <div className="dropdown-item dropdown-item-stagger flex items-center px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white cursor-pointer font-medium">
                  <Download className="mr-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />{" "}
                  Download App
                </div>
              </div>
            </div>
          </div>

          {/* Wishlist Icon */}
          {isAuthenticated && (
            <Link
              to="/wishlist"
              className="heart-hover flex items-center gap-1 hover:text-neutral-950 dark:hover:text-white transition-colors duration-200 relative py-4 group"
            >
              <div className="relative flex items-center justify-center">
                <Heart className="h-5 w-5 text-neutral-700 dark:text-neutral-300 transition-colors duration-200 group-hover:text-red-500" />
                {wishlistCount > 0 && (
                  <span
                    key={badgeKey}
                    className="badge-pop absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold tabular-nums text-white shadow-sm"
                  >
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="hidden md:block ml-1.5 text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors duration-200 font-medium">
                Wishlist
              </span>
            </Link>
          )}

          {/* Cart Icon */}
          <Link
            to="/cart"
            className="cart-hover flex items-center gap-1 hover:text-neutral-950 dark:hover:text-white transition-colors duration-200 relative py-4 group"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-neutral-700 dark:text-neutral-300 transition-all duration-300 group-hover:text-neutral-950 dark:group-hover:text-white group-hover:-rotate-12 group-hover:scale-110" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 dark:bg-white text-[9px] font-bold tabular-nums text-white dark:text-neutral-900 shadow-sm">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden md:block ml-1.5 text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors duration-200 font-medium">
              Cart
            </span>
          </Link>
        </div>
      </div>

      {/* ── Mobile Search Bar ── */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          <input
            type="text"
            placeholder="Search products…"
            className="w-full pl-10 pr-4 h-9 rounded-full
                       bg-neutral-50 dark:bg-neutral-900
                       border border-neutral-200 dark:border-neutral-700
                       text-sm text-neutral-900 dark:text-neutral-100
                       placeholder:text-neutral-500 dark:placeholder:text-neutral-500
                       outline-none focus:border-indigo-300 dark:focus:border-indigo-600
                       focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-950/50
                       transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>
    </header>
  );
}
