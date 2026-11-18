
import { useEffect, useState, useCallback } from "react";
import {
    Bike,
    Package,
    CheckCircle2,
    Clock,
    TrendingUp,
    MapPin,
    ArrowUpRight,
    RefreshCw,
    AlertCircle,
    Truck,
    Activity
} from "lucide-react";

import {
    getMyAssignments,
    getMyDeliveryStatistics
} from "../../services/deliveryService";

import "../../styles/delivery/DeliveryDashboardHome.css";

export default function DeliveryDashboardHome() {

    const [deliveries, setDeliveries] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {
        try {
            setError("");

            const [assignments, stats] = await Promise.all([
                getMyAssignments(),
                getMyDeliveryStatistics()
            ]);

            setDeliveries(Array.isArray(assignments) ? assignments : []);
            setStatistics(stats || {});
        } catch (err) {
            console.error("Delivery dashboard loading error:", err);
            setError("Unable to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const activeDeliveries = deliveries.filter(delivery =>
        ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"]
            .includes(delivery.status)
    );

    const completedCount = statistics?.completedDeliveries ?? 0;
    const totalCount = statistics?.totalAssignments ?? 0;

    const completionRate = totalCount > 0
        ? Math.round((completedCount / totalCount) * 100)
        : 0;

    const formatStatus = (status) => {
        return status?.replaceAll("_", " ") || "UNKNOWN";
    };

    const getStatusClass = (status) => {
        return status?.toLowerCase().replaceAll("_", "-") || "unknown";
    };

    if (loading) {
        return (
            <div className="delivery-dashboard-loading">
                <div className="delivery-loading-spinner"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="delivery-home">

            {/* PAGE HEADER */}
            <div className="delivery-home-header">
                <div>
                    <span className="delivery-eyebrow">
                        DELIVERY PARTNER WORKSPACE
                    </span>

                    <h1>Dashboard Overview</h1>

                    <p>
                        Track your deliveries, monitor your performance
                        and manage your daily operations.
                    </p>
                </div>

                <button
                    className="delivery-refresh-btn"
                    onClick={loadDashboard}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="delivery-error-message">
                    <AlertCircle size={19} />
                    {error}
                    <button onClick={loadDashboard}>Retry</button>
                </div>
            )}

            {/* STAT CARDS */}
            <div className="delivery-stats-grid">

                <div className="delivery-stat-card">
                    <div className="delivery-stat-top">
                        <span>Total Assignments</span>
                        <div className="delivery-stat-icon purple">
                            <Package size={21} />
                        </div>
                    </div>

                    <h2>{statistics?.totalAssignments ?? 0}</h2>

                    <p>All assigned deliveries</p>
                </div>

                <div className="delivery-stat-card">
                    <div className="delivery-stat-top">
                        <span>Active Deliveries</span>
                        <div className="delivery-stat-icon orange">
                            <Bike size={21} />
                        </div>
                    </div>

                    <h2>{statistics?.activeDeliveries ?? activeDeliveries.length}</h2>

                    <p>Currently in progress</p>
                </div>

                <div className="delivery-stat-card">
                    <div className="delivery-stat-top">
                        <span>Completed</span>
                        <div className="delivery-stat-icon green">
                            <CheckCircle2 size={21} />
                        </div>
                    </div>

                    <h2>{completedCount}</h2>

                    <p>Successfully delivered</p>
                </div>

                <div className="delivery-stat-card">
                    <div className="delivery-stat-top">
                        <span>Pending Assignments</span>
                        <div className="delivery-stat-icon blue">
                            <Clock size={21} />
                        </div>
                    </div>

                    <h2>{statistics?.assignedDeliveries ?? 0}</h2>

                    <p>Waiting for your action</p>
                </div>

            </div>

            {/* MAIN CONTENT GRID */}
            <div className="delivery-overview-grid">

                {/* ACTIVE DELIVERIES */}
                <section className="delivery-panel delivery-active-panel">

                    <div className="delivery-panel-header">
                        <div>
                            <h2>Active Deliveries</h2>
                            <p>Your current delivery assignments</p>
                        </div>

                        <span className="delivery-count-badge">
                            {activeDeliveries.length} Active
                        </span>
                    </div>

                    {activeDeliveries.length === 0 ? (

                        <div className="delivery-empty-state">
                            <div className="delivery-empty-icon">
                                <Truck size={30} />
                            </div>

                            <h3>No active deliveries</h3>

                            <p>
                                New delivery assignments will appear here
                                when they are assigned to you.
                            </p>
                        </div>

                    ) : (

                        <div className="delivery-active-list">

                            {activeDeliveries.slice(0, 5).map(delivery => (

                                <div
                                    className="delivery-active-item"
                                    key={delivery.id}
                                >

                                    <div className="delivery-item-icon">
                                        <Package size={20} />
                                    </div>

                                    <div className="delivery-item-details">
                                        <h3>
                                            Delivery #{delivery.id}
                                        </h3>

                                        <p>
                                            <MapPin size={14} />
                                            {delivery.deliveryAddress ||
                                                delivery.address ||
                                                "Address not available"}
                                        </p>

                                        <span className={`delivery-status ${getStatusClass(delivery.status)}`}>
                                            {formatStatus(delivery.status)}
                                        </span>
                                    </div>

                                    <ArrowUpRight
                                        className="delivery-item-arrow"
                                        size={19}
                                    />

                                </div>

                            ))}

                        </div>

                    )}

                </section>

                {/* PERFORMANCE */}
                <section className="delivery-panel delivery-performance-panel">

                    <div className="delivery-panel-header">
                        <div>
                            <h2>Performance</h2>
                            <p>Your delivery performance summary</p>
                        </div>

                        <TrendingUp size={21} />
                    </div>

                    <div className="delivery-completion-circle">
                        <div
                            className="delivery-circle-progress"
                            style={{
                                background: `conic-gradient(#e44747 ${completionRate * 3.6}deg, #f0f0f0 0deg)`
                            }}
                        >
                            <div className="delivery-circle-inner">
                                <strong>{completionRate}%</strong>
                                <span>Completion</span>
                            </div>
                        </div>
                    </div>

                    <div className="delivery-performance-details">

                        <div>
                            <span className="performance-dot completed"></span>
                            <span>Completed</span>
                            <strong>{completedCount}</strong>
                        </div>

                        <div>
                            <span className="performance-dot pending"></span>
                            <span>Assigned</span>
                            <strong>{statistics?.assignedDeliveries ?? 0}</strong>
                        </div>

                        <div>
                            <span className="performance-dot active"></span>
                            <span>Active</span>
                            <strong>{statistics?.activeDeliveries ?? 0}</strong>
                        </div>

                    </div>

                </section>

            </div>

            {/* QUICK SUMMARY */}
            <section className="delivery-panel delivery-summary-panel">

                <div className="delivery-panel-header">
                    <div>
                        <h2>Delivery Activity Summary</h2>
                        <p>Overview of your delivery operations</p>
                    </div>

                    <Activity size={21} />
                </div>

                <div className="delivery-summary-grid">

                    <div className="delivery-summary-item">
                        <span>Accepted Deliveries</span>
                        <strong>{statistics?.acceptedDeliveries ?? 0}</strong>
                    </div>

                    <div className="delivery-summary-item">
                        <span>Picked Up</span>
                        <strong>{statistics?.pickedUpDeliveries ?? 0}</strong>
                    </div>

                    <div className="delivery-summary-item">
                        <span>Out for Delivery</span>
                        <strong>{statistics?.outForDelivery ?? 0}</strong>
                    </div>

                    <div className="delivery-summary-item">
                        <span>Rejected</span>
                        <strong>{statistics?.rejectedDeliveries ?? 0}</strong>
                    </div>

                    <div className="delivery-summary-item">
                        <span>Cancelled</span>
                        <strong>{statistics?.cancelledDeliveries ?? 0}</strong>
                    </div>

                </div>

            </section>

        </div>
    );
}
