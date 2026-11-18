
import { useCallback, useEffect, useState } from "react";
import {
    getReadyForDeliveryOrders,
    getAvailablePartners,
    getAllPartners,
    getRestaurantAnalytics,
    getPendingRoleApplications
} from "../../services/adminService";

import "../../styles/admin/AdminOverview.css";
import { getAllRestaurants } from "../../services/restaurantService";

import {
    ShoppingBag,
    Truck,
    Users,
    Store,
    Clock,
    CheckCircle,
    XCircle,
    IndianRupee,
    RefreshCw
} from "lucide-react";

import "../../styles/admin/AdminDashboard.css";

export default function AdminOverview() {
    const [data, setData] = useState({
        orders: [],
        partners: [],
        allPartners: [],
        restaurants: [],
        analytics: [],
        applications: []
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadOverview = useCallback(async (isRefresh = false) => {
        try {
            setError("");

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [
                orders,
                partners,
                allPartners,
                restaurants,
                analytics,
                applications
            ] = await Promise.all([
                getReadyForDeliveryOrders(),
                getAvailablePartners(),
                getAllPartners(),
                getAllRestaurants(),
                getRestaurantAnalytics(),
                getPendingRoleApplications()
            ]);

            setData({
                orders: Array.isArray(orders) ? orders : [],
                partners: Array.isArray(partners) ? partners : [],
                allPartners: Array.isArray(allPartners) ? allPartners : [],
                restaurants: Array.isArray(restaurants) ? restaurants : [],
                analytics: Array.isArray(analytics) ? analytics : [],
                applications: Array.isArray(applications) ? applications : []
            });
        } catch (err) {
            console.error("Failed to load admin overview:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load dashboard information. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    const totalOrders = data.analytics.reduce(
        (total, item) => total + Number(item.totalOrders || 0),
        0
    );

    const completedOrders = data.analytics.reduce(
        (total, item) => total + Number(item.completedOrders || 0),
        0
    );

    const cancelledOrders = data.analytics.reduce(
        (total, item) => total + Number(item.cancelledOrders || 0),
        0
    );

    const totalRevenue = data.analytics.reduce(
        (total, item) => total + Number(item.totalRevenue || 0),
        0
    );

    const pendingRestaurants = data.restaurants.filter(
        restaurant => restaurant.status === "PENDING"
    ).length;

    const approvedRestaurants = data.restaurants.filter(
        restaurant => restaurant.status === "APPROVED"
    ).length;

    const activeRestaurants = data.restaurants.filter(
        restaurant =>
            restaurant.status === "APPROVED" && restaurant.active
    ).length;

    const rejectedRestaurants = data.restaurants.filter(
        restaurant => restaurant.status === "REJECTED"
    ).length;

    const statCards = [
        {
            title: "Total Restaurants",
            value: data.restaurants.length,
            icon: Store,
            color: "orange"
        },
        {
            title: "Total Delivery Partners",
            value: data.allPartners.length,
            icon: Truck,
            color: "blue"
        },
        {
            title: "Available Partners",
            value: data.partners.length,
            icon: Users,
            color: "green"
        },
        {
            title: "Ready Orders",
            value: data.orders.length,
            icon: ShoppingBag,
            color: "purple"
        },
        {
            title: "Pending Applications",
            value: data.applications.length,
            icon: Clock,
            color: "yellow"
        },
        {
            title: "Total Revenue",
            value: `₹${totalRevenue.toLocaleString("en-IN", {
                maximumFractionDigits: 2
            })}`,
            icon: IndianRupee,
            color: "green"
        }
    ];

    if (loading) {
        return (
            <div className="admin-overview-loading">
                <RefreshCw className="admin-loading-icon" size={25} />
                <p>Loading dashboard overview...</p>
            </div>
        );
    }

    return (
        <div className="admin-overview">

            <div className="admin-overview-heading">
                <div>
                    <span className="admin-overview-eyebrow">
                        PLATFORM OVERVIEW
                    </span>

                    <h2>Dashboard Overview</h2>

                    <p>
                        Monitor restaurants, delivery operations and platform
                        performance.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-overview-refresh"
                    onClick={() => loadOverview(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={16}
                        className={refreshing ? "admin-refresh-spinning" : ""}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="admin-overview-error">
                    {error}
                </div>
            )}

            {/* Main Statistics */}

            <section className="admin-overview-stats">

                {statCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <article
                            className="admin-overview-stat-card"
                            key={card.title}
                        >
                            <div className={`admin-overview-stat-icon ${card.color}`}>
                                <Icon size={21} />
                            </div>

                            <div>
                                <p>{card.title}</p>
                                <h3>{card.value}</h3>
                            </div>
                        </article>
                    );
                })}

            </section>

            {/* Order Performance */}

            <section className="admin-overview-section">

                <div className="admin-overview-section-heading">
                    <div>
                        <h3>Order Performance</h3>
                        <p>Overall restaurant order performance.</p>
                    </div>
                </div>

                <div className="admin-overview-performance-grid">

                    <article className="admin-overview-performance-card">
                        <div className="performance-card-icon blue">
                            <ShoppingBag size={20} />
                        </div>

                        <div>
                            <span>Total Orders</span>
                            <strong>{totalOrders}</strong>
                        </div>
                    </article>

                    <article className="admin-overview-performance-card">
                        <div className="performance-card-icon green">
                            <CheckCircle size={20} />
                        </div>

                        <div>
                            <span>Completed Orders</span>
                            <strong>{completedOrders}</strong>
                        </div>
                    </article>

                    <article className="admin-overview-performance-card">
                        <div className="performance-card-icon red">
                            <XCircle size={20} />
                        </div>

                        <div>
                            <span>Cancelled Orders</span>
                            <strong>{cancelledOrders}</strong>
                        </div>
                    </article>

                </div>

            </section>

            {/* Restaurant Status */}

            <section className="admin-overview-section">

                <div className="admin-overview-section-heading">
                    <div>
                        <h3>Restaurant Status</h3>
                        <p>Registration and account status summary.</p>
                    </div>
                </div>

                <div className="admin-overview-restaurant-grid">

                    <div className="restaurant-summary-item">
                        <span className="restaurant-summary-dot pending" />
                        <div>
                            <span>Pending Review</span>
                            <strong>{pendingRestaurants}</strong>
                        </div>
                    </div>

                    <div className="restaurant-summary-item">
                        <span className="restaurant-summary-dot approved" />
                        <div>
                            <span>Approved</span>
                            <strong>{approvedRestaurants}</strong>
                        </div>
                    </div>

                    <div className="restaurant-summary-item">
                        <span className="restaurant-summary-dot active" />
                        <div>
                            <span>Active</span>
                            <strong>{activeRestaurants}</strong>
                        </div>
                    </div>

                    <div className="restaurant-summary-item">
                        <span className="restaurant-summary-dot rejected" />
                        <div>
                            <span>Rejected</span>
                            <strong>{rejectedRestaurants}</strong>
                        </div>
                    </div>

                </div>

            </section>

            {/* Restaurant Analytics Table */}

            <section className="admin-overview-section">

                <div className="admin-overview-section-heading">
                    <div>
                        <h3>Restaurant-wise Performance</h3>
                        <p>Compare orders, completion rates and revenue.</p>
                    </div>

                    <span className="admin-overview-record-count">
                        {data.analytics.length} Records
                    </span>
                </div>

                <div className="admin-overview-table-wrapper">

                    <table className="admin-overview-table">

                        <thead>
                            <tr>
                                <th>Restaurant</th>
                                <th>Total Orders</th>
                                <th>Completed</th>
                                <th>Cancelled</th>
                                <th>Completion Rate</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.analytics.length > 0 ? (
                                data.analytics.map(item => {
                                    const restaurant = data.restaurants.find(
                                        current =>
                                            current.id === item.restaurantId
                                    );

                                    const rate = Number(item.totalOrders) > 0
                                        ? (
                                            Number(item.completedOrders || 0) /
                                            Number(item.totalOrders)
                                        ) * 100
                                        : 0;

                                    return (
                                        <tr key={item.restaurantId}>
                                            <td>
                                                <strong>
                                                    {restaurant?.name ||
                                                        `Restaurant #${item.restaurantId}`}
                                                </strong>
                                                <span>
                                                    ID: #{item.restaurantId}
                                                </span>
                                            </td>

                                            <td>{item.totalOrders || 0}</td>
                                            <td>{item.completedOrders || 0}</td>
                                            <td>{item.cancelledOrders || 0}</td>
                                            <td>
                                                <div className="admin-completion-cell">
                                                    <span>{rate.toFixed(1)}%</span>
                                                    <div className="admin-completion-track">
                                                        <div
                                                            className="admin-completion-fill"
                                                            style={{
                                                                width: `${Math.min(rate, 100)}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                ₹{Number(item.totalRevenue || 0).toLocaleString(
                                                    "en-IN",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    }
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="admin-overview-empty">
                                        No restaurant analytics are available yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}
