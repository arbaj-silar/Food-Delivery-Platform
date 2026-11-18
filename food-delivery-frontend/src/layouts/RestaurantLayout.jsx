
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
    LayoutDashboard,
    Store,
    Utensils,
    ClipboardList,
    ChartNoAxesCombined,
    Settings,
    LogOut,
    LifeBuoy,
    ChevronRight,
    Menu,
    X
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "../styles/restaurant/RestaurantLayout.css";

export default function RestaurantLayout() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);

    const ownerName =
        user?.firstName ||
        user?.username ||
        "Restaurant Owner";

    const avatarLetter = ownerName.charAt(0).toUpperCase();

    const navigation = [
        {
            title: "WORKSPACE",
            items: [
                {
                    label: "Dashboard",
                    path: "/restaurant-dashboard",
                    icon: LayoutDashboard,
                    end: true
                }
            ]
        },
        {
            title: "MANAGEMENT",
            items: [
                {
                    label: "My Restaurants",
                    path: "/restaurant-dashboard/restaurants",
                    icon: Store
                },
                {
                    label: "Menu Management",
                    path: "/restaurant-dashboard/menu",
                    icon: Utensils
                },
                {
                    label: "Orders",
                    path: "/restaurant-dashboard/orders",
                    icon: ClipboardList
                }
            ]
        },
        {
            title: "BUSINESS",
            items: [
                {
                    label: "Analytics",
                    path: "/restaurant-dashboard/analytics",
                    icon: ChartNoAxesCombined
                },
                {
                    label: "Settings",
                    path: "/restaurant-dashboard/settings",
                    icon: Settings
                }
            ]
        }
    ];

    const closeMobileMenu = () => {
        setMenuOpen(false);
    };

    return (
        <div className="restaurant-layout">

            {/* MOBILE HEADER */}

            <header className="restaurant-mobile-header">

                <div className="restaurant-mobile-brand">

                    <div className="restaurant-brand-icon">
                        🍽️
                    </div>

                    <div className="restaurant-brand-info">
                        <h2>FoodExpress</h2>
                        <span>RESTAURANT PANEL</span>
                    </div>

                </div>

                <button
                    type="button"
                    className="restaurant-mobile-menu-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? <X size={23} /> : <Menu size={23} />}
                </button>

            </header>

            {/* SIDEBAR */}

            <aside
                className={`restaurant-sidebar ${
                    menuOpen ? "mobile-open" : ""
                }`}
            >

                {/* DESKTOP BRAND */}

                <div className="restaurant-brand">

                    <div className="restaurant-brand-icon">
                        🍽️
                    </div>

                    <div className="restaurant-brand-info">
                        <h2>FoodExpress</h2>
                        <span>RESTAURANT PANEL</span>
                    </div>

                    <button
                        type="button"
                        className="restaurant-sidebar-close"
                        onClick={closeMobileMenu}
                        aria-label="Close navigation"
                    >
                        <X size={22} />
                    </button>

                </div>

                {/* NAVIGATION */}

                <nav className="restaurant-navigation">

                    {navigation.map(group => (
                        <div
                            className="restaurant-nav-group"
                            key={group.title}
                        >

                            <p className="restaurant-nav-heading">
                                {group.title}
                            </p>

                            {group.items.map(item => {

                                const Icon = item.icon;

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.end}
                                        onClick={closeMobileMenu}
                                        className={({ isActive }) =>
                                            `restaurant-nav-link ${
                                                isActive ? "active" : ""
                                            }`
                                        }
                                    >

                                        <Icon
                                            size={19}
                                            strokeWidth={1.8}
                                        />

                                        <span>{item.label}</span>

                                        <ChevronRight
                                            className="restaurant-nav-arrow"
                                            size={15}
                                        />

                                    </NavLink>
                                );
                            })}

                        </div>
                    ))}

                </nav>

                {/* SIDEBAR BOTTOM */}

                <div className="restaurant-sidebar-bottom">

                    <div className="restaurant-help-card">

                        <div className="restaurant-help-icon">
                            <LifeBuoy size={20} />
                        </div>

                        <div>
                            <strong>Need assistance?</strong>

                            <p>
                                We're here to help you manage your business.
                            </p>
                        </div>

                    </div>

                    <button
                        className="restaurant-account-button"
                        onClick={logout}
                        type="button"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>

                </div>

            </aside>

            {/* MOBILE OVERLAY */}

            <div
                className={`restaurant-mobile-overlay ${
                    menuOpen ? "show" : ""
                }`}
                onClick={closeMobileMenu}
            />

            {/* MAIN CONTENT */}

            <main className="restaurant-main">

                <header className="restaurant-topbar">

                    <div className="restaurant-topbar-title">

                        <span className="restaurant-topbar-eyebrow">
                            FOOD EXPRESS / RESTAURANT
                        </span>

                        <h2>Restaurant Workspace</h2>

                        <p>
                            Manage your restaurant operations from one place.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="restaurant-user-profile"
                        onClick={() =>
                            navigate("/restaurant-dashboard/settings")
                        }
                        title="Open restaurant settings"
                    >

                        <div className="restaurant-user-avatar">
                            {avatarLetter}
                        </div>

                        <div className="restaurant-user-details">
                            <strong>{ownerName}</strong>
                            <span>Restaurant Owner</span>
                        </div>

                        <Settings size={16} />

                    </button>

                </header>

                <section className="restaurant-page-content">
                    <Outlet />
                </section>

            </main>

        </div>
    );
}
