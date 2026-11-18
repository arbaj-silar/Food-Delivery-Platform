
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Link,
    useLocation
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

// Layouts
import CustomerLayout from "./layouts/CustomerLayout";
import RestaurantLayout from "./layouts/RestaurantLayout";
import DeliveryLayout from "./layouts/DeliveryLayout";

// Customer Pages
import RestaurantMenu from "./pages/RestaurantMenu";
import MyOrders from "./pages/MyOrders";
import CustomerDashboard from "./pages/CustomerDashboard";
import Restaurants from "./pages/restaurant/Restaurants";
import Profile from "./pages/Profile";

// Restaurant Owner Pages
import RestaurantDashboardHome from "./pages/restaurant/RestaurantDashboardHome";
import MyRestaurants from "./pages/restaurant/MyRestaurants";
import MenuManagement from "./pages/restaurant/MenuManagement";
import RestaurantOrders from "./pages/restaurant/RestaurantOrders";
import RestaurantAnalytics from "./pages/restaurant/RestaurantAnalytics";
import RestaurantSettings from "./pages/restaurant/RestaurantSettings";

// Delivery Partner Pages
import DeliveryTracking from "./pages/delivery/DeliveryTracking";
import DeliveryStatistics from "./pages/delivery/DeliveryStatistics";
import DeliveryDashboardHome from "./pages/delivery/DeliveryDashboardHome";
import MyDeliveries from "./pages/delivery/MyDeliveries";
import DeliveryHistory from "./pages/delivery/DeliveryHistory";
import DeliverySettings from "./pages/delivery/DeliverySettings";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";

// Authentication
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";

// Shared Components
import Navbar from "./components/Navbar";

import "./App.css";


function LoadingScreen() {
    return (
        <div className="auth-loading">
            <div className="auth-spinner"></div>
            <p>Restoring your session...</p>
        </div>
    );
}


// Protected Route
function ProtectedRoute({ children, allowedRoles = [] }) {

    const { authenticated, roles, initialized } = useAuth();

    if (!initialized) {
        return <LoadingScreen />;
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    if (
        allowedRoles.length > 0 &&
        !allowedRoles.some(role => roles.includes(role))
    ) {
        return <Navigate to="/" replace />;
    }

    return children;
}


// Home Page
function HomePage() {

    const { authenticated, initialized, roles } = useAuth();

    if (!initialized) {
        return <LoadingScreen />;
    }

    if (authenticated) {

        if (roles.includes("ADMIN")) {
            return <Navigate to="/admin-dashboard" replace />;
        }

        if (roles.includes("RESTAURANT_OWNER")) {
            return <Navigate to="/restaurant-dashboard" replace />;
        }

        if (roles.includes("DELIVERY_PARTNER")) {
            return <Navigate to="/delivery-dashboard" replace />;
        }

        return <Navigate to="/customer" replace />;
    }

    return (
        <main className="home-page">

            <section className="home-content">

                <div className="home-logo">
                    <span className="home-logo-icon">🍔</span>
                    FoodieExpress
                </div>

                <div className="home-badge">
                    <span>✦</span> Delicious food, delivered fast
                </div>

                <h1>
                    Your Favourite Food,
                    <span> Just One Click Away.</span>
                </h1>

                <p className="home-description">
                    Explore amazing restaurants, discover delicious meals
                    and enjoy doorstep delivery. Your next favourite meal
                    is waiting for you!
                </p>

                <div className="home-actions">

                    <Link to="/login" className="home-login-btn">
                        Login to Your Account
                        <span> →</span>
                    </Link>

                    <Link to="/register" className="home-register-btn">
                        Create New Account
                    </Link>

                </div>

                <div className="home-features">

                    <div className="home-feature">
                        <span>🍕</span>
                        <p>Delicious Food</p>
                    </div>

                    <div className="home-feature">
                        <span>🚀</span>
                        <p>Fast Delivery</p>
                    </div>

                    <div className="home-feature">
                        <span>⭐</span>
                        <p>Top Restaurants</p>
                    </div>

                </div>

            </section>

            <section className="home-visual">

                <div className="food-circle">
                    <div className="food-emoji">🍔</div>
                </div>

                <div className="floating-card card-delivery">
                    <span>🚴</span>
                    <div>
                        <strong>Fast Delivery</strong>
                        <small>At your doorstep</small>
                    </div>
                </div>

                <div className="floating-card card-rating">
                    <span>⭐</span>
                    <div>
                        <strong>Best Choices</strong>
                        <small>Discover tasty meals</small>
                    </div>
                </div>

            </section>

        </main>
    );
}


// Application Routes
function AppRoutes() {

    const { authenticated, initialized } = useAuth();
    const location = useLocation();

    if (!initialized) {
        return <LoadingScreen />;
    }

    // Delivery dashboard has its own layout.
    const isDeliveryDashboard =
        location.pathname.startsWith("/delivery-dashboard");

    // Restaurant dashboard has its own layout.
    const isRestaurantDashboard =
        location.pathname.startsWith("/restaurant-dashboard");

    // Admin dashboard has its own layout.
    const isAdminDashboard =
        location.pathname.startsWith("/admin-dashboard");

    // Customer pages use CustomerLayout.
    const isCustomerDashboard =
        location.pathname === "/customer" ||
        location.pathname.startsWith("/restaurants") ||
        location.pathname.startsWith("/my-orders") ||
        location.pathname.startsWith("/profile");

    const showNavbar =
        authenticated &&
        !isDeliveryDashboard &&
        !isRestaurantDashboard &&
        !isAdminDashboard &&
        !isCustomerDashboard;

    return (
        <>

            {showNavbar && <Navbar />}

            <Routes>

                {/* Home */}
                <Route
                    path="/"
                    element={<HomePage />}
                />

                {/* Login */}
                <Route
                    path="/login"
                    element={
                        authenticated
                            ? <Navigate to="/" replace />
                            : <LoginPage />
                    }
                />

                {/* Registration */}
                <Route
                    path="/register"
                    element={
                        authenticated
                            ? <Navigate to="/" replace />
                            : <RegisterPage />
                    }
                />


                {/* ================================= */}
                {/* CUSTOMER DASHBOARD */}
                {/* ================================= */}

                <Route
                    element={
                        <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                            <CustomerLayout />
                        </ProtectedRoute>
                    }
                >

                    <Route
                        path="/customer"
                        element={<CustomerDashboard />}
                    />

                    <Route
                        path="/restaurants"
                        element={<Restaurants />}
                    />

                    <Route
                        path="/restaurants/:restaurantId/menu"
                        element={<RestaurantMenu />}
                    />

                    <Route
                        path="/my-orders"
                        element={<MyOrders />}
                    />

                    <Route
                        path="/profile"
                        element={<Profile />}
                    />

                </Route>


                {/* ================================= */}
                {/* RESTAURANT OWNER DASHBOARD */}
                {/* ================================= */}

                <Route
                    path="/restaurant-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["RESTAURANT_OWNER"]}>
                            <RestaurantLayout />
                        </ProtectedRoute>
                    }
                >

                    <Route
                        index
                        element={<RestaurantDashboardHome />}
                    />

                    <Route
                        path="restaurants"
                        element={<MyRestaurants />}
                    />

                    <Route
                        path="menu"
                        element={<MenuManagement />}
                    />

                    <Route
                        path="orders"
                        element={<RestaurantOrders />}
                    />

                    <Route
                        path="analytics"
                        element={<RestaurantAnalytics />}
                    />

                    <Route
                        path="settings"
                        element={<RestaurantSettings />}
                    />

                </Route>


                {/* ================================= */}
                {/* DELIVERY PARTNER DASHBOARD */}
                {/* ================================= */}

                <Route
                    path="/delivery-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["DELIVERY_PARTNER"]}>
                            <DeliveryLayout />
                        </ProtectedRoute>
                    }
                >

                    <Route
                        index
                        element={<DeliveryDashboardHome />}
                    />

                    <Route
                        path="deliveries"
                        element={<MyDeliveries />}
                    />

                    <Route
                        path="history"
                        element={<DeliveryHistory />}
                    />

                    <Route
                        path="statistics"
                        element={<DeliveryStatistics />}
                    />

                    <Route
                        path="tracking"
                        element={<DeliveryTracking />}
                    />

                    <Route
                        path="settings"
                        element={<DeliverySettings />}
                    />

                </Route>


                {/* ================================= */}
                {/* ADMIN DASHBOARD */}
                {/* ================================= */}

                <Route
                    path="/admin-dashboard/*"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />


                {/* ================================= */}
                {/* SHARED PROFILE FOR OTHER ROLES */}
                {/* ================================= */}

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />


                {/* Unknown Routes */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>

        </>
    );
}


// Main Application
export default function App() {

    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
