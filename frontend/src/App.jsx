import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootLayout from "./components/layout/RootLayout";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider } from "./context/AuthContext";
import ProductDetails from "./pages/ProductDetails";
import Profile from "./pages/Profile";
import CategoryView from "./pages/CategoryView";
import SearchResults from "./pages/SearchResults";
import Dashboard from "./pages/Dashboard";
import BecomeSeller from "./pages/BecomeSeller";
import Cart from "./pages/Cart";
import Addresses from "./pages/Addresses";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderLifecycle from "./pages/OrderLifecycle";
import Wishlist from "./pages/Wishlist";
import AdminCouponManagement from "./pages/AdminCouponManagement";
import AdminOrders from "./pages/AdminOrders";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Standalone Routes (No Navbar/Footer) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes wrapped in RootLayout (With Navbar/Footer) */}
          <Route element={<RootLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/category/:categoryId" element={<CategoryView />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/become-seller" element={<BecomeSeller />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/addresses" element={<Addresses />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order-lifecycle/:id" element={<OrderLifecycle />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route
            path="/admin/coupons"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminCouponManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminOrders />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
