import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// --- QUEUE SYSTEM FOR CONCURRENT REQUESTS ---
// If 3 API calls fail at the same time, we only want to refresh the token ONCE.
// The others will wait in this queue until the new token arrives!
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  // FIX: React renders the component tree once BEFORE running any effects.
  // On that very first render, isAuthenticated is still its initial value
  // (false) — even if a valid token sits in localStorage — because the
  // useEffect below hasn't run yet. ProtectedRoute was reading that
  // first-render `false` and redirecting straight to /login before the
  // effect ever got a chance to flip it to true. isLoading lets consumers
  // (ProtectedRoute) wait for that initial check to actually complete
  // before making any redirect decision.
  const [isLoading, setIsLoading] = useState(true);

  const decodeAndSetUser = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const decodedPayload = JSON.parse(window.atob(base64));

      setUser({
        id: decodedPayload.userId || decodedPayload.id,
        role:
          decodedPayload.role ||
          (decodedPayload.roles && decodedPayload.roles[0]),
        email: decodedPayload.sub || decodedPayload.email,
      });
    } catch (error) {
      console.error("Failed to parse JWT", error);
      setUser(null);
    }
  };

  // --- THE FIX: Login now accepts BOTH tokens ---
  const login = (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setIsAuthenticated(true);
    decodeAndSetUser(accessToken);
  };

  // --- THE FIX: Logout wipes BOTH tokens ---
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
    setUser(null);
    // Optional: Redirect to login page instantly if they are booted
    if (
      window.location.pathname !== "/login" &&
      window.location.pathname !== "/"
    ) {
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsAuthenticated(true);
      decodeAndSetUser(token);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);

    // ==========================================
    // THE GLOBAL FETCH INTERCEPTOR
    // ==========================================
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      let [resource, config] = args;
      let response = await originalFetch(resource, config);

      // If the token is dead AND we aren't already trying to login or refresh
      if (
        response.status === 401 &&
        !resource.includes("/login") &&
        !resource.includes("/refresh")
      ) {
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
          if (isRefreshing) {
            // If another request is already refreshing the token, wait for it!
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                // Retry the original request with the shiny new token
                if (config && config.headers) {
                  config.headers.Authorization = `Bearer ${token}`;
                }
                return originalFetch(resource, config);
              })
              .catch((err) => Promise.reject(err));
          }

          isRefreshing = true;

          try {
            // Ask the backend for a fresh Access Token
            const refreshRes = await originalFetch(
              "http://localhost:8080/api/v1/users/refresh",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
              },
            );

            if (refreshRes.ok) {
              const data = await refreshRes.json();
              const newAccessToken = data.accessToken;
              const newRefreshToken = data.refreshToken;

              // Save the new tokens
              localStorage.setItem("accessToken", newAccessToken);
              localStorage.setItem("refreshToken", newRefreshToken);

              decodeAndSetUser(newAccessToken); // Update React State silently
              processQueue(null, newAccessToken); // Release any waiting requests

              // Retry the CURRENT failed request
              if (config && config.headers) {
                config.headers.Authorization = `Bearer ${newAccessToken}`;
              } else {
                config = {
                  ...config,
                  headers: { Authorization: `Bearer ${newAccessToken}` },
                };
              }

              return await originalFetch(resource, config);
            } else {
              // The Refresh Token is dead too. Game over, log them out.
              processQueue(new Error("Refresh token expired"));
              logout();
            }
          } catch (err) {
            processQueue(err);
            logout();
          } finally {
            isRefreshing = false;
          }
        } else {
          // No refresh token exists at all.
          logout();
        }
      }

      return response;
    };

    // Cleanup the interceptor if the app unmounts
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
