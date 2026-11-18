
import { useNavigate, useLocation } from "react-router-dom";

import {
    LayoutDashboard,
    Truck,
    Home,
    ShoppingBag,
    Store,
    Utensils,
    ShieldCheck
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

export default function Navbar() {
    const { user, hasRole } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Admin dashboard has its own sidebar and header.
    if (location.pathname.startsWith("/admin-dashboard")) {
        return null;
    }

    const isAdmin = hasRole("ADMIN");
    const isRestaurantOwner = hasRole("RESTAURANT_OWNER");
    const isDeliveryPartner = hasRole("DELIVERY_PARTNER");

    const dashboardPath = isAdmin
        ? "/admin-dashboard"
        : isRestaurantOwner
            ? "/restaurant-dashboard"
            : isDeliveryPartner
                ? "/delivery-dashboard"
                : "/customer";

    const displayName =
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.username ||
        "User";

    return (
        <nav className="customer-navbar">

            <div
                className="navbar-brand"
                onClick={() => navigate(dashboardPath)}
            >
                <Utensils size={25} />
                <span>FoodExpress</span>
            </div>

            <div className="navbar-links">

                {isAdmin ? (
                    <button
                        className="admin-nav-link"
                        onClick={() => navigate("/admin-dashboard")}
                    >
                        <ShieldCheck size={18} />
                        <span>Admin Dashboard</span>
                    </button>
                ) : isRestaurantOwner ? (
                    <button
                        className="admin-nav-link"
                        onClick={() => navigate("/restaurant-dashboard")}
                    >
                        <LayoutDashboard size={18} />
                        <span>Restaurant Dashboard</span>
                    </button>
                ) : isDeliveryPartner ? (
                    <button
                        className="admin-nav-link"
                        onClick={() => navigate("/delivery-dashboard")}
                    >
                        <Truck size={18} />
                        <span>Delivery Dashboard</span>
                    </button>
                ) : (
                    <>
                        <button
                            className="admin-nav-link"
                            onClick={() => navigate("/customer")}
                        >
                            <Home size={18} />
                            <span>Home</span>
                        </button>

                        <button
                            className="admin-nav-link"
                            onClick={() => navigate("/restaurants")}
                        >
                            <Store size={18} />
                            <span>Restaurants</span>
                        </button>

                        <button
                            className="admin-nav-link"
                            onClick={() => navigate("/my-orders")}
                        >
                            <ShoppingBag size={18} />
                            <span>My Orders</span>
                        </button>
                    </>
                )}

            </div>

            <div className="navbar-user">

                <span className="navbar-user-name">
                    {displayName}
                </span>

                <button
                    type="button"
                    className="navbar-profile-trigger"
                    title="View My Profile"
                    aria-label="View My Profile"
                    onClick={() => navigate("/profile")}
                >
                    <span className="navbar-avatar">
                        {displayName.charAt(0).toUpperCase()}
                    </span>
                </button>

            </div>

        </nav>
    );
}
