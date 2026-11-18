
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Store,
    Truck,
    Bell,
    CreditCard,
    Menu,
    X,
    ShieldCheck,
    FileCheck,
    LogOut,
    Mail
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "../styles/admin/AdminLayout.css";

const navigationItems = [
    {
        label: "Dashboard",
        path: "/admin-dashboard",
        icon: LayoutDashboard,
        end: true
    },
    {
        label: "Users",
        path: "/admin-dashboard/users",
        icon: Users
    },
    {
        label: "Restaurants",
        path: "/admin-dashboard/restaurants",
        icon: Store
    },
    {
        label: "Delivery",
        path: "/admin-dashboard/delivery",
        icon: Truck
    },
    {
        label: "Notifications",
        path: "/admin-dashboard/notifications",
        icon: Bell
    },
    {
        label: "Payments",
        path: "/admin-dashboard/payments",
        icon: CreditCard
    },
    {
        label: "Role Applications",
        path: "/admin-dashboard/role-applications",
        icon: FileCheck
    }
];

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const openProfile = () => {
        navigate("/profile");
    };

    const displayName =
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.username ||
        "Administrator";

    const avatarLetter = displayName.charAt(0).toUpperCase();
    const email = user?.email || "Administrator account";

    const handleLogout = async () => {
        if (loggingOut) return;

        setLoggingOut(true);

        try {
            await logout();
            navigate("/login", { replace: true });
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <div className="admin-layout">

            {sidebarOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={closeSidebar}
                />
            )}

            <aside
                className={`admin-sidebar ${
                    sidebarOpen ? "admin-sidebar-open" : ""
                }`}
            >
                <div className="admin-sidebar-header">

                    <div className="admin-brand">
                        <div className="admin-brand-icon">
                            <ShieldCheck size={24} />
                        </div>

                        <div>
                            <h2>FoodExpress</h2>
                            <span>Admin Panel</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="admin-mobile-close"
                        onClick={closeSidebar}
                        aria-label="Close navigation"
                    >
                        <X size={22} />
                    </button>

                </div>

                <div className="admin-sidebar-label">
                    MAIN MENU
                </div>

                <nav className="admin-sidebar-nav">

                    {navigationItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `admin-sidebar-link ${
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

                <div className="admin-sidebar-footer">
                    <div className="admin-sidebar-footer-avatar">
                        {avatarLetter}
                    </div>

                    <div className="admin-sidebar-footer-user">
                        <strong>{displayName}</strong>
                        <span>Administrator</span>
                    </div>
                </div>

            </aside>

            <main className="admin-main">

                <header className="admin-topbar">

                    <button
                        type="button"
                        className="admin-mobile-menu"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open navigation"
                    >
                        <Menu size={23} />
                    </button>

                    <div className="admin-topbar-heading">
                        <span>FOODEXPRESS / ADMIN</span>
                        <h1>Administration</h1>
                    </div>

                    <div className="admin-topbar-actions">

                        <button
                            type="button"
                            className="admin-profile"
                            onClick={openProfile}
                            title="View and edit your profile"
                            aria-label="Open admin profile"
                        >

                            <div className="admin-profile-avatar">
                                {avatarLetter}
                            </div>

                            <div className="admin-profile-info">
                                <strong>{displayName}</strong>

                                <span>
                                    <ShieldCheck size={13} />
                                    Administrator
                                </span>

                                <small>
                                    <Mail size={12} />
                                    {email}
                                </small>
                            </div>

                        </button>

                        <button
                            type="button"
                            className="admin-logout-button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                        >
                            <LogOut size={17} />
                            <span>
                                {loggingOut ? "Logging out..." : "Logout"}
                            </span>
                        </button>

                    </div>

                </header>

                <section className="admin-page-content">
                    <Outlet />
                </section>

            </main>

        </div>
    );
};

export default AdminLayout;
