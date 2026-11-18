
import { useEffect, useState } from "react";
import {
    Store,
    Utensils,
    ClipboardList,
    IndianRupee,
    RefreshCw
} from "lucide-react";

import "../../styles/restaurant/RestaurantDashboardHome.css";
import { getMyRestaurants } from "../../services/restaurantService";
import { getMyRestaurantMenu } from "../../services/menuItemService";
import { getRestaurantOrders } from "../../services/orderService";

export default function RestaurantDashboardHome() {

    const [stats, setStats] = useState({
        restaurants: 0,
        menuItems: 0,
        orders: 0,
        revenue: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            const restaurants = await getMyRestaurants();

            const restaurantList = Array.isArray(restaurants)
                ? restaurants
                : [];

            const menuResults = await Promise.all(
                restaurantList.map(restaurant =>
                    getMyRestaurantMenu(restaurant.id)
                )
            );

            const orderResults = await Promise.all(
                restaurantList.map(restaurant =>
                    getRestaurantOrders(restaurant.id)
                )
            );

            const allMenuItems = menuResults.flatMap(result =>
                Array.isArray(result) ? result : []
            );

            const allOrders = orderResults.flatMap(result =>
                Array.isArray(result) ? result : []
            );

            const paidRevenue = allOrders
                .filter(order => order.paymentStatus === "PAID")
                .reduce(
                    (total, order) => total + Number(order.totalAmount || 0),
                    0
                );

            setStats({
                restaurants: restaurantList.length,
                menuItems: allMenuItems.length,
                orders: allOrders.length,
                revenue: paidRevenue
            });

        } catch (err) {
            console.error("Dashboard loading error:", err);
            setError("Unable to load dashboard information. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const statCards = [
        {
            label: "Total Restaurants",
            value: stats.restaurants,
            icon: Store
        },
        {
            label: "Menu Items",
            value: stats.menuItems,
            icon: Utensils
        },
        {
            label: "Total Orders",
            value: stats.orders,
            icon: ClipboardList
        },
        {
            label: "Total Revenue",
            value: `₹${stats.revenue.toLocaleString("en-IN", {
                maximumFractionDigits: 2
            })}`,
            icon: IndianRupee
        }
    ];

    return (
        <div className="restaurant-overview">

            <div className="restaurant-page-heading">
                <div>
                    <h1>Dashboard Overview</h1>
                    <p>
                        Welcome back! Here's your restaurant business overview.
                    </p>
                </div>

                <button
                    className="dashboard-refresh-btn"
                    onClick={loadDashboardData}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}

            <div className="restaurant-overview-stats">
                {statCards.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            className="restaurant-overview-card"
                            key={stat.label}
                        >
                            <div className="restaurant-overview-card-icon">
                                <Icon size={21} />
                            </div>

                            <div className="restaurant-overview-card-content">
                                <p>{stat.label}</p>
                                <h2>
                                    {loading ? "..." : stat.value}
                                </h2>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="restaurant-overview-welcome">
                <h2>Your restaurant workspace</h2>
                <p>
                    Manage your restaurants, create menus, process customer
                    orders and monitor your business from one place.
                </p>
            </div>

        </div>
    );
}
