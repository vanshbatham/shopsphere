import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [wishlistSkus, setWishlistSkus] = useState([]);

  const fetchWishlist = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8080/api/v1/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistSkus(data || []);
      }
    } catch (err) {
      console.error("Failed to load wishlist entries", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlistSkus([]);
    }
  }, [isAuthenticated]);

  const toggleWishlist = async (skuCode) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;

    // Optimistic UI state update
    const isAlreadySaved = wishlistSkus.includes(skuCode);
    if (isAlreadySaved) {
      setWishlistSkus((prev) => prev.filter((code) => code !== skuCode));
    } else {
      setWishlistSkus((prev) => [...prev, skuCode]);
    }

    try {
      const res = await fetch("http://localhost:8080/api/v1/wishlist/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skuCode }),
      });
      if (!res.ok) {
        // Rollback state if the microservice returns an error
        await fetchWishlist();
        return false;
      }
      return true;
    } catch (err) {
      await fetchWishlist();
      return false;
    }
  };

  const isSaved = (skuCode) => wishlistSkus.includes(skuCode);

  return (
    <WishlistContext.Provider
      value={{
        wishlistSkus,
        toggleWishlist,
        isSaved,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
