
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    TrendingUp,
    ShoppingBag,
    IndianRupee,
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCw,
    Store,
    BarChart3,
    Wallet
} from "lucide-react";

import { getMyRestaurants } from "../../services/restaurantService";
import { getRestaurantOrders } from "../../services/orderService";

import "../../styles/restaurant/RestaurantAnalytics.css";

const DATE_FILTERS = [
    { label: "Last 7 Days", value: "7D" },
    { label: "Last 30 Days", value: "30D" },
    { label: "All Time", value: "ALL" }
];

const STATUS_COLORS = {
    PLACED: "#ed8b35",
    CONFIRMED: "#5484d8",
    PREPARING: "#8665cf",
    READY_FOR_PICKUP: "#2a9b67",
    PICKED_UP: "#3287c7",
    OUT_FOR_DELIVERY: "#289baf",
    DELIVERED: "#26945a",
    CANCELLED: "#d75b5b"
};

const STATUS_LABELS = {
    PLACED: "New",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    READY_FOR_PICKUP: "Ready for Pickup",
    PICKED_UP: "Picked Up",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled"
};

const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    })}`;

const formatShortDate = (date) =>
    date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short"
    });

export default function RestaurantAnalytics() {
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState("");
    const [orders, setOrders] = useState([]);

    const [dateFilter, setDateFilter] = useState("7D");
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // Load restaurants owned by the logged-in owner.
    const loadRestaurants = useCallback(async () => {
        try {
            setLoadingRestaurants(true);
            setError("");

            const data = await getMyRestaurants();
            const list = Array.isArray(data) ? data : [];

            setRestaurants(list);

            setSelectedRestaurant((current) => {
                if (
                    current &&
                    list.some((restaurant) =>
                        String(restaurant.id) === String(current)
                    )
                ) {
                    return current;
                }

                const preferred = list.find(
                    (restaurant) =>
                        restaurant.status === "APPROVED" &&
                        restaurant.active !== false
                ) || list[0];

                return preferred ? String(preferred.id) : "";
            });
        } catch (err) {
            console.error("Analytics restaurant loading error:", err);
            setError("Unable to load your restaurants.");
        } finally {
            setLoadingRestaurants(false);
        }
    }, []);

    // Load orders for selected restaurant.
    const loadOrders = useCallback(async (isRefresh = false) => {
        if (!selectedRestaurant) {
            setOrders([]);
            return;
        }

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoadingOrders(true);
            }

            setError("");

            const data = await getRestaurantOrders(selectedRestaurant);
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Analytics order loading error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load restaurant analytics."
            );
        } finally {
            setLoadingOrders(false);
            setRefreshing(false);
        }
    }, [selectedRestaurant]);

    useEffect(() => {
        loadRestaurants();
    }, [loadRestaurants]);

    useEffect(() => {
        if (selectedRestaurant) {
            loadOrders();
        } else if (!loadingRestaurants) {
            setOrders([]);
        }
    }, [selectedRestaurant, loadingRestaurants, loadOrders]);

    // Apply selected date range.
    const filteredOrders = useMemo(() => {
        if (dateFilter === "ALL") {
            return orders;
        }

        const days = dateFilter === "7D" ? 7 : 30;
        const cutoff = new Date();

        cutoff.setDate(cutoff.getDate() - (days - 1));
        cutoff.setHours(0, 0, 0, 0);

        return orders.filter((order) => {
            if (!order.createdAt) return false;

            const orderDate = new Date(order.createdAt);
            return !Number.isNaN(orderDate.getTime()) &&
                orderDate >= cutoff;
        });
    }, [orders, dateFilter]);

    // Calculate dashboard totals.
    const analytics = useMemo(() => {
        const paidOrders = filteredOrders.filter(
            (order) => order.paymentStatus === "PAID"
        );

        const revenue = paidOrders.reduce(
            (total, order) => total + Number(order.totalAmount || 0),
            0
        );

        const completed = filteredOrders.filter(
            (order) => order.status === "DELIVERED"
        ).length;

        const cancelled = filteredOrders.filter(
            (order) => order.status === "CANCELLED"
        ).length;

        const pending = filteredOrders.filter(
            (order) => order.status === "PLACED"
        ).length;

        const refunded = filteredOrders.filter(
            (order) => order.paymentStatus === "REFUNDED"
        ).length;

        const averageOrderValue = paidOrders.length
            ? revenue / paidOrders.length
            : 0;

        return {
            totalOrders: filteredOrders.length,
            revenue,
            completed,
            cancelled,
            pending,
            refunded,
            paidOrders: paidOrders.length,
            averageOrderValue
        };
    }, [filteredOrders]);

    // Build daily revenue chart data.
    const revenueChart = useMemo(() => {
        const days = dateFilter === "7D" ? 7 : 30;
        const today = new Date();

        const chartDays = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            date.setHours(0, 0, 0, 0);

            chartDays.push({
                key: date.toLocaleDateString("en-CA"),
                label: formatShortDate(date),
                revenue: 0
            });
        }

        const revenueByDate = new Map(
            chartDays.map((day) => [day.key, day])
        );

        filteredOrders.forEach((order) => {
            if (
                order.paymentStatus !== "PAID" ||
                !order.createdAt
            ) {
                return;
            }

            const date = new Date(order.createdAt);

            if (Number.isNaN(date.getTime())) return;

            const key = date.toLocaleDateString("en-CA");
            const day = revenueByDate.get(key);

            if (day) {
                day.revenue += Number(order.totalAmount || 0);
            }
        });

        return chartDays;
    }, [filteredOrders, dateFilter]);

    const maxRevenue = Math.max(
        ...revenueChart.map((day) => day.revenue),
        1
    );

    // Calculate order status distribution.
    const statusBreakdown = useMemo(() => {
        const counts = {};

        filteredOrders.forEach((order) => {
            counts[order.status] = (counts[order.status] || 0) + 1;
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => ({
                status,
                count,
                percentage: filteredOrders.length
                    ? (count / filteredOrders.length) * 100
                    : 0
            }));
    }, [filteredOrders]);

    // Recent orders.
    const recentOrders = useMemo(() => {
        return [...filteredOrders]
            .sort(
                (a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
            )
            .slice(0, 5);
    }, [filteredOrders]);

    const restaurantName = restaurants.find(
        (restaurant) =>
            String(restaurant.id) === String(selectedRestaurant)
    )?.name;

    if (loadingRestaurants) {
        return (
            <div className="restaurant-analytics-loading">
                <RefreshCw className="analytics-spin" size={24} />
                <p>Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="restaurant-analytics-page">

            {/* Header */}
            <div className="restaurant-analytics-header">
                <div>
                    <span className="analytics-breadcrumb">
                        Restaurant Management / Analytics
                    </span>

                    <h1>Restaurant Analytics</h1>

                    <p>
                        Track your restaurant's performance and business growth.
                    </p>
                </div>

                <div className="restaurant-analytics-controls">
                    <select
                        value={selectedRestaurant}
                        onChange={(e) =>
                            setSelectedRestaurant(e.target.value)
                        }
                    >
                        {restaurants.map((restaurant) => (
                            <option
                                key={restaurant.id}
                                value={restaurant.id}
                            >
                                {restaurant.name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => loadOrders(true)}
                        disabled={!selectedRestaurant || refreshing}
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? "analytics-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="restaurant-analytics-error">
                    <XCircle size={18} />
                    {error}
                </div>
            )}

            {!restaurants.length ? (
                <div className="restaurant-analytics-empty">
                    <Store size={42} />
                    <h2>No restaurant found</h2>
                    <p>Create a restaurant to view its analytics.</p>
                </div>
            ) : (
                <>
                    {/* Date Filter */}
                    <div className="restaurant-analytics-period">
                        <div>
                            <strong>{restaurantName}</strong>
                            <span>Business Overview</span>
                        </div>

                        <div className="analytics-date-filters">
                            {DATE_FILTERS.map((filter) => (
                                <button
                                    key={filter.value}
                                    className={
                                        dateFilter === filter.value
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setDateFilter(filter.value)
                                    }
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loadingOrders ? (
                        <div className="restaurant-analytics-loading">
                            <RefreshCw
                                className="analytics-spin"
                                size={24}
                            />
                            <p>Calculating restaurant analytics...</p>
                        </div>
                    ) : (
                        <>
                            {/* KPI Cards */}
                            <div className="restaurant-analytics-cards">

                                <div className="analytics-card">
                                    <div className="analytics-card-icon revenue">
                                        <IndianRupee size={21} />
                                    </div>
                                    <span>Total Revenue</span>
                                    <h2>{formatCurrency(analytics.revenue)}</h2>
                                    <small>
                                        From {analytics.paidOrders} paid orders
                                    </small>
                                </div>

                                <div className="analytics-card">
                                    <div className="analytics-card-icon orders">
                                        <ShoppingBag size={21} />
                                    </div>
                                    <span>Total Orders</span>
                                    <h2>{analytics.totalOrders}</h2>
                                    <small>Orders in selected period</small>
                                </div>

                                <div className="analytics-card">
                                    <div className="analytics-card-icon completed">
                                        <CheckCircle2 size={21} />
                                    </div>
                                    <span>Completed Orders</span>
                                    <h2>{analytics.completed}</h2>
                                    <small>Successfully delivered</small>
                                </div>

                                <div className="analytics-card">
                                    <div className="analytics-card-icon average">
                                        <Wallet size={21} />
                                    </div>
                                    <span>Average Order Value</span>
                                    <h2>
                                        {formatCurrency(
                                            analytics.averageOrderValue
                                        )}
                                    </h2>
                                    <small>Per paid order</small>
                                </div>

                            </div>

                            {/* Revenue Chart */}
                            <div className="analytics-main-grid">

                                <div className="analytics-panel revenue-panel">
                                    <div className="analytics-panel-header">
                                        <div>
                                            <h2>Revenue Overview</h2>
                                            <p>Daily revenue from paid orders</p>
                                        </div>

                                        <div className="analytics-panel-icon">
                                            <TrendingUp size={19} />
                                        </div>
                                    </div>

                                    {analytics.paidOrders === 0 ? (
                                        <div className="analytics-chart-empty">
                                            No paid orders in this period.
                                        </div>
                                    ) : (
                                        <div className="analytics-chart">
                                            <div className="analytics-chart-y">
                                                <span>
                                                    {formatCurrency(maxRevenue)}
                                                </span>
                                                <span>
                                                    {formatCurrency(maxRevenue / 2)}
                                                </span>
                                                <span>₹0</span>
                                            </div>

                                            <div className="analytics-chart-bars">
                                                {revenueChart.map((day) => (
                                                    <div
                                                        className="analytics-chart-column"
                                                        key={day.key}
                                                        title={`${day.label}: ${formatCurrency(day.revenue)}`}
                                                    >
                                                        <div className="analytics-bar-area">
                                                            <div
                                                                className="analytics-bar"
                                                                style={{
                                                                    height: `${day.revenue > 0
                                                                        ? Math.max(
                                                                            4,
                                                                            (day.revenue / maxRevenue) * 100
                                                                        )
                                                                        : 0}%`
                                                                }}
                                                            />
                                                        </div>

                                                        <span>{day.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Order Summary */}
                                <div className="analytics-panel order-summary-panel">
                                    <div className="analytics-panel-header">
                                        <div>
                                            <h2>Order Summary</h2>
                                            <p>Orders by current status</p>
                                        </div>

                                        <BarChart3 size={20} />
                                    </div>

                                    {statusBreakdown.length === 0 ? (
                                        <div className="analytics-chart-empty">
                                            No orders available.
                                        </div>
                                    ) : (
                                        <div className="analytics-status-list">
                                            {statusBreakdown.map((item) => (
                                                <div
                                                    className="analytics-status-item"
                                                    key={item.status}
                                                >
                                                    <div className="analytics-status-label">
                                                        <span>
                                                            <i
                                                                style={{
                                                                    background:
                                                                        STATUS_COLORS[item.status] ||
                                                                        "#999"
                                                                }}
                                                            />
                                                            {STATUS_LABELS[item.status] ||
                                                                item.status}
                                                        </span>

                                                        <strong>{item.count}</strong>
                                                    </div>

                                                    <div className="analytics-status-track">
                                                        <div
                                                            style={{
                                                                width: `${item.percentage}%`,
                                                                background:
                                                                    STATUS_COLORS[item.status] ||
                                                                    "#999"
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* Operational Summary */}
                            <div className="analytics-operational-grid">

                                <div className="analytics-operational-card">
                                    <Clock size={21} />
                                    <div>
                                        <span>New Orders</span>
                                        <strong>{analytics.pending}</strong>
                                    </div>
                                </div>

                                <div className="analytics-operational-card">
                                    <XCircle size={21} />
                                    <div>
                                        <span>Cancelled Orders</span>
                                        <strong>{analytics.cancelled}</strong>
                                    </div>
                                </div>

                                <div className="analytics-operational-card">
                                    <Wallet size={21} />
                                    <div>
                                        <span>Refunded Orders</span>
                                        <strong>{analytics.refunded}</strong>
                                    </div>
                                </div>

                            </div>

                            {/* Recent Orders */}
                            <div className="analytics-panel analytics-recent-panel">
                                <div className="analytics-panel-header">
                                    <div>
                                        <h2>Recent Orders</h2>
                                        <p>Latest five orders for this restaurant</p>
                                    </div>
                                </div>

                                {recentOrders.length === 0 ? (
                                    <div className="analytics-chart-empty">
                                        No orders found.
                                    </div>
                                ) : (
                                    <div className="analytics-recent-table-wrapper">
                                        <table className="analytics-recent-table">
                                            <thead>
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>Date</th>
                                                    <th>Amount</th>
                                                    <th>Payment</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {recentOrders.map((order) => (
                                                    <tr key={order.id}>
                                                        <td>#{order.id}</td>
                                                        <td>
                                                            {order.createdAt
                                                                ? new Date(
                                                                    order.createdAt
                                                                ).toLocaleString("en-IN")
                                                                : "—"}
                                                        </td>
                                                        <td>
                                                            {formatCurrency(
                                                                order.totalAmount
                                                            )}
                                                        </td>
                                                        <td>
                                                            {order.paymentStatus || "PENDING"}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className="analytics-recent-status"
                                                                style={{
                                                                    color:
                                                                        STATUS_COLORS[order.status] ||
                                                                        "#777"
                                                                }}
                                                            >
                                                                {STATUS_LABELS[order.status] ||
                                                                    order.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
