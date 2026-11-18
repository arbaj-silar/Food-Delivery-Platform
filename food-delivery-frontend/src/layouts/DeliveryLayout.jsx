
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
    LayoutDashboard,
    Package,
    History,
    ChartNoAxesCombined,
    MapPin,
    Settings,
    LogOut,
    Bike,
    Menu,
    X,
    ShieldCheck,
    ChevronRight,
    Bell
} from "lucide-react";

import "../styles/delivery/DeliveryLayout.css";

export default function DeliveryLayout() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);

    const handleLogout = async () => {
        closeMenu();
        await logout();
        navigate("/login", { replace: true });
    };

    const navigationGroups = [
        {
            title: "WORKSPACE",
            items: [
                {
                    label: "Overview",
                    path: "/delivery-dashboard",
                    icon: LayoutDashboard,
                    end: true
                },
                {
                    label: "My Deliveries",
                    path: "/delivery-dashboard/deliveries",
                    icon: Package
                },
                {
                    label: "Delivery History",
                    path: "/delivery-dashboard/history",
                    icon: History
                }
            ]
        },
        {
            title: "PERFORMANCE",
            items: [
                {
                    label: "Statistics",
                    path: "/delivery-dashboard/statistics",
                    icon: ChartNoAxesCombined
                },
                {
                    label: "Live Tracking",
                    path: "/delivery-dashboard/tracking",
                    icon: MapPin
                }
            ]
        },
        {
            title: "ACCOUNT",
            items: [
                {
                    label: "Profile & Settings",
                    path: "/delivery-dashboard/settings",
                    icon: Settings
                }
            ]
        }
    ];

    const partnerName =
        user?.firstName ||
        user?.name ||
        user?.username ||
        "Delivery Partner";

    return (
        <div className="delivery-layout">

            {/* Mobile Header */}
            <header className="delivery-mobile-header">

                <div className="delivery-mobile-brand">
                    <div className="delivery-brand-icon">
                        <Bike size={24} />
                    </div>

                    <div>
                        <h2>FoodExpress</h2>
                        <span>DELIVERY PARTNER</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="delivery-mobile-menu-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label={
                        menuOpen
                            ? "Close navigation"
                            : "Open navigation"
                    }
                    aria-expanded={menuOpen}
                >
                    {menuOpen
                        ? <X size={23} />
                        : <Menu size={23} />
                    }
                </button>

            </header>

            {/* Sidebar */}
            <aside
                className={`delivery-sidebar ${
                    menuOpen ? "mobile-open" : ""
                }`}
            >

                <div className="delivery-sidebar-brand">

                    <div className="delivery-brand-icon">
                        <Bike size={27} />
                    </div>

                    <div className="delivery-brand-info">
                        <h2>FoodExpress</h2>
                        <span>DELIVERY PARTNER</span>
                    </div>

                    <button
                        type="button"
                        className="delivery-sidebar-close"
                        onClick={closeMenu}
                        aria-label="Close navigation"
                    >
                        <X size={21} />
                    </button>

                </div>

                {/* Navigation */}
                <nav className="delivery-navigation">

                    {navigationGroups.map((group) => (

                        <div
                            className="delivery-nav-group"
                            key={group.title}
                        >

                            <div className="delivery-nav-heading">
                                {group.title}
                            </div>

                            {group.items.map((item) => {

                                const Icon = item.icon;

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.end}
                                        onClick={closeMenu}
                                        className={({ isActive }) =>
                                            `delivery-nav-link ${
                                                isActive ? "active" : ""
                                            }`
                                        }
                                    >
                                        <Icon size={19} />

                                        <span>{item.label}</span>

                                        <ChevronRight
                                            className="delivery-nav-arrow"
                                            size={16}
                                        />
                                    </NavLink>
                                );
                            })}

                        </div>

                    ))}

                </nav>

                {/* Sidebar Bottom */}
                <div className="delivery-sidebar-bottom">

                    <div className="delivery-sidebar-status">
                        <span className="delivery-online-dot"></span>

                        <div>
                            <strong>Partner Portal</strong>
                            <small>Manage your deliveries</small>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="delivery-logout-btn"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>

                    <div className="delivery-sidebar-footer">
                        <ShieldCheck size={16} />
                        Secure Partner Portal
                    </div>

                </div>

            </aside>

            {/* Mobile Overlay */}
            <div
                className={`delivery-mobile-overlay ${
                    menuOpen ? "show" : ""
                }`}
                onClick={closeMenu}
            />

            {/* Main Workspace */}
            <main className="delivery-main">

                <header className="delivery-topbar">

                    <div className="delivery-topbar-title">
                        <span>FOODEXPRESS / WORKSPACE</span>
                        <h1>Delivery Workspace</h1>
                    </div>

                    <div className="delivery-topbar-actions">

                        <button
                            type="button"
                            className="delivery-notification-btn"
                            aria-label="Notifications"
                        >
                            <Bell size={19} />
                        </button>

                        <div className="delivery-user-profile">

                            <div className="delivery-user-avatar">
                                {partnerName.charAt(0).toUpperCase()}
                            </div>

                            <div className="delivery-user-info">
                                <strong>{partnerName}</strong>
                                <span>Delivery Partner</span>
                            </div>

                        </div>

                    </div>

                </header>

                <section className="delivery-page-content">
                    <Outlet />
                </section>

                <footer className="delivery-footer">
                    <span>
                        © {new Date().getFullYear()} FoodExpress
                    </span>

                    <span>
                        <ShieldCheck size={15} />
                        Delivery Partner Portal
                    </span>
                </footer>

            </main>

        </div>
    );
}
