
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
    LayoutDashboard,
    Store,
    ShoppingBag,
    UserRound,
    Utensils,
    ArrowRight,
    Headphones,
    LogOut
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "../styles/customer/CustomerLayout.css";

export default function CustomerLayout() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const displayName =
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.username ||
        "Customer";

    const navItems = [
        {
            label: "Overview",
            path: "/customer",
            icon: LayoutDashboard,
            end: true
        },
        {
            label: "Restaurants",
            path: "/restaurants",
            icon: Store
        },
        {
            label: "My Orders",
            path: "/my-orders",
            icon: ShoppingBag
        },
        {
            label: "My Profile",
            path: "/profile",
            icon: UserRound
        }
    ];

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="customer-layout">

            {/* Sidebar */}
            <aside className="customer-sidebar">

                {/* Brand */}
                <div
                    className="customer-sidebar-brand"
                    onClick={() => navigate("/customer")}
                >
                    <div className="customer-brand-icon">
                        <Utensils size={23} />
                    </div>

                    <div>
                        <h2>FoodExpress</h2>
                        <span>Food made easy</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="customer-sidebar-section">

                    <span className="customer-sidebar-heading">
                        MENU
                    </span>

                    <nav className="customer-sidebar-nav">

                        {navItems.map((item) => {

                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `customer-sidebar-link ${
                                            isActive ? "active" : ""
                                        }`
                                    }
                                >
                                    <Icon size={19} />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}

                    </nav>

                </div>

                {/* Sidebar Bottom */}
                <div className="customer-sidebar-bottom">

                    {/* Help Card */}
                    <div className="customer-help-card">

                        <div className="customer-help-icon">
                            <Headphones size={20} />
                        </div>

                        <h4>Need help?</h4>

                        <p>
                            We're here to help with your food orders.
                        </p>

                    </div>

                    {/* Customer Profile */}
                    <div className="customer-sidebar-user">

                        <div className="customer-user-avatar">
                            {displayName.charAt(0).toUpperCase()}
                        </div>

                        <div className="customer-user-info">
                            <strong>{displayName}</strong>
                            <span>Customer Account</span>
                        </div>

                        <button
                            type="button"
                            title="View profile"
                            aria-label="View profile"
                            onClick={() => navigate("/profile")}
                        >
                            <ArrowRight size={18} />
                        </button>

                    </div>

                    {/* Logout */}
                    <button
                        type="button"
                        className="customer-logout-button"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>

                </div>

            </aside>

            {/* Main Content */}
            <main className="customer-main">

                {/* Topbar */}
                <header className="customer-topbar">

                    <div>
                        <span className="customer-topbar-label">
                            CUSTOMER PORTAL
                        </span>

                        <h3>
                            Welcome back, {displayName}
                        </h3>
                    </div>

                    <div className="customer-topbar-actions">

                        <button
                            type="button"
                            className="customer-topbar-profile"
                            onClick={() => navigate("/profile")}
                            title="My Profile"
                        >
                            <UserRound size={19} />
                            <span>My Profile</span>
                        </button>

                        <button
                            type="button"
                            className="customer-mobile-logout"
                            onClick={handleLogout}
                            title="Logout"
                            aria-label="Logout"
                        >
                            <LogOut size={19} />
                        </button>

                    </div>

                </header>

                {/* Page Content */}
                <div className="customer-page-content">
                    <Outlet />
                </div>

            </main>

        </div>
    );
}
