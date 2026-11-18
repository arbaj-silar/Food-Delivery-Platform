
import { useCallback, useEffect, useState } from "react";

import {
    ChartNoAxesCombined,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    ClipboardList,
    XCircle,
    RefreshCw,
    AlertCircle,
    TrendingUp,
    Bike
} from "lucide-react";

import { getMyDeliveryStatistics } from "../../services/deliveryService";

import "../../styles/delivery/DeliveryStatistics.css";

export default function DeliveryStatistics() {

    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadStatistics = useCallback(async (isRefresh = false) => {

        try {

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await getMyDeliveryStatistics();

            setStatistics(response);

        } catch (err) {

            console.error("Statistics loading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load delivery statistics. Please try again."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }

    }, []);

    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    const total = statistics?.totalAssignments || 0;
    const completed = statistics?.completedDeliveries || 0;

    const completionRate = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    const summaryCards = [
        {
            title: "Total Assignments",
            value: total,
            description: "All assigned deliveries",
            icon: ClipboardList,
            color: "blue"
        },
        {
            title: "Active Deliveries",
            value: statistics?.activeDeliveries || 0,
            description: "Currently in progress",
            icon: Truck,
            color: "orange"
        },
        {
            title: "Completed Deliveries",
            value: completed,
            description: "Successfully delivered",
            icon: CheckCircle2,
            color: "green"
        },
        {
            title: "Completion Rate",
            value: `${completionRate}%`,
            description: "Completed assignments",
            icon: TrendingUp,
            color: "purple"
        }
    ];

    const statusItems = [
        {
            label: "Assigned",
            value: statistics?.assignedDeliveries || 0,
            icon: Package,
            color: "blue"
        },
        {
            label: "Accepted",
            value: statistics?.acceptedDeliveries || 0,
            icon: CheckCircle2,
            color: "purple"
        },
        {
            label: "Picked Up",
            value: statistics?.pickedUpDeliveries || 0,
            icon: Bike,
            color: "orange"
        },
        {
            label: "Out for Delivery",
            value: statistics?.outForDelivery || 0,
            icon: Truck,
            color: "cyan"
        },
        {
            label: "Rejected",
            value: statistics?.rejectedDeliveries || 0,
            icon: XCircle,
            color: "red"
        },
        {
            label: "Cancelled",
            value: statistics?.cancelledDeliveries || 0,
            icon: AlertCircle,
            color: "gray"
        }
    ];

    if (loading) {
        return (
            <div className="delivery-statistics-loading">
                <div className="delivery-statistics-spinner"></div>
                <p>Loading your delivery statistics...</p>
            </div>
        );
    }

    return (
        <div className="delivery-statistics-page">

            {/* Page Heading */}
            <div className="delivery-statistics-header">

                <div>
                    <div className="delivery-statistics-eyebrow">
                        <ChartNoAxesCombined size={15} />
                        PERFORMANCE OVERVIEW
                    </div>

                    <h2>Delivery Statistics</h2>

                    <p>
                        Track your delivery performance and assignment progress.
                    </p>
                </div>

                <button
                    type="button"
                    className="delivery-statistics-refresh"
                    onClick={() => loadStatistics(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={16}
                        className={refreshing ? "spinning" : ""}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>

            </div>

            {/* Error Message */}
            {error && (
                <div className="delivery-statistics-error">
                    <AlertCircle size={19} />
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => loadStatistics()}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {!error && statistics && (
                <>

                    {/* Summary Cards */}
                    <div className="delivery-statistics-summary">

                        {summaryCards.map((card) => {

                            const Icon = card.icon;

                            return (
                                <div
                                    className="delivery-stat-card"
                                    key={card.title}
                                >

                                    <div className="delivery-stat-card-top">

                                        <div className="delivery-stat-card-info">
                                            <span>{card.title}</span>

                                            <h3>{card.value}</h3>
                                        </div>

                                        <div className={`delivery-stat-icon ${card.color}`}>
                                            <Icon size={22} />
                                        </div>

                                    </div>

                                    <p>{card.description}</p>

                                </div>
                            );
                        })}

                    </div>

                    {/* Performance Section */}
                    <div className="delivery-statistics-content">

                        <section className="delivery-performance-card">

                            <div className="delivery-section-heading">
                                <div>
                                    <h3>Overall Performance</h3>
                                    <p>Your completed delivery assignments</p>
                                </div>

                                <div className="delivery-performance-icon">
                                    <TrendingUp size={20} />
                                </div>
                            </div>

                            <div className="delivery-completion-display">

                                <div className="delivery-completion-number">
                                    <strong>{completionRate}%</strong>
                                    <span>Completion Rate</span>
                                </div>

                                <div className="delivery-completion-count">
                                    <strong>{completed}</strong>
                                    <span>Completed out of {total} assignments</span>
                                </div>

                            </div>

                            <div className="delivery-progress-track">
                                <div
                                    className="delivery-progress-fill"
                                    style={{
                                        width: `${completionRate}%`
                                    }}
                                />
                            </div>

                            <div className="delivery-progress-labels">
                                <span>0% completed</span>
                                <span>100%</span>
                            </div>

                        </section>

                        {/* Status Breakdown */}
                        <section className="delivery-status-breakdown">

                            <div className="delivery-section-heading">
                                <div>
                                    <h3>Assignment Breakdown</h3>
                                    <p>Delivery status distribution</p>
                                </div>
                            </div>

                            <div className="delivery-status-list">

                                {statusItems.map((item) => {

                                    const Icon = item.icon;

                                    return (
                                        <div
                                            className="delivery-status-item"
                                            key={item.label}
                                        >

                                            <div className="delivery-status-item-left">

                                                <div className={`delivery-status-icon ${item.color}`}>
                                                    <Icon size={17} />
                                                </div>

                                                <span>{item.label}</span>

                                            </div>

                                            <strong>{item.value}</strong>

                                        </div>
                                    );
                                })}

                            </div>

                        </section>

                    </div>

                    {/* Bottom Information */}
                    <div className="delivery-statistics-note">
                        <Clock size={18} />

                        <p>
                            Statistics are retrieved directly from your
                            delivery partner account. Refresh to get the
                            latest information.
                        </p>
                    </div>

                </>
            )}

        </div>
    );
}
