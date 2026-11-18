import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import DeliveryLocationStatus from "../../components/DeliveryLocationStatus";

import {
    getMyAssignments,
    acceptDelivery,
    rejectDelivery,
    pickupDelivery,
    startDelivery,
    completeDelivery,
    getMyDeliveryHistory,
    getMyDeliveryStatistics
} from "../../services/deliveryService";

import {
    LayoutDashboard,
    Package,
    CheckCircle2,
    Clock3,
    Truck,
    MapPin,
    RefreshCw,
    CalendarDays,
    ArrowRight,
    Bike,
    ShieldCheck,
    Activity,
    History,
    BarChart3,
    TrendingUp
} from "lucide-react";

import "../../styles/delivery/DeliveryPartnerDashboard.css";

export default function DeliveryPartnerDashboard() {

    const { user } = useAuth();

    const [deliveries, setDeliveries] = useState([]);
    const [deliveryHistory, setDeliveryHistory] = useState([]);
    const [statistics, setStatistics] = useState(null);

    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load current assignments
    const loadDeliveries = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getMyAssignments();
            setDeliveries(data || []);

        } catch (err) {
            console.error("Failed to load deliveries:", err);
            setError("Failed to load your deliveries. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Load delivery history and statistics
    const loadHistoryAndStatistics = async () => {
        try {
            setHistoryLoading(true);

            const [historyData, statisticsData] = await Promise.all([
                getMyDeliveryHistory(),
                getMyDeliveryStatistics()
            ]);

            setDeliveryHistory(historyData || []);
            setStatistics(statisticsData || null);

        } catch (err) {
            console.error(
                "Failed to load history and statistics:",
                err
            );
        } finally {
            setHistoryLoading(false);
        }
    };

    // Refresh all dashboard information
    const refreshDashboard = async () => {
        await Promise.all([
            loadDeliveries(),
            loadHistoryAndStatistics()
        ]);
    };

    useEffect(() => {
        refreshDashboard();
    }, []);

    // Perform delivery actions
    const handleAction = async (assignmentId, action) => {
        try {
            setActionLoading(assignmentId);
            setError("");
            setSuccess("");

            switch (action) {

                case "accept":
                    await acceptDelivery(assignmentId);
                    setSuccess("Delivery accepted successfully.");
                    break;

                case "reject":
                    await rejectDelivery(assignmentId);
                    setSuccess("Delivery rejected successfully.");
                    break;

                case "pickup":
                    await pickupDelivery(assignmentId);
                    setSuccess("Order picked up successfully.");
                    break;

                case "start":
                    await startDelivery(assignmentId);
                    setSuccess("Delivery started successfully.");
                    break;

                case "complete":
                    await completeDelivery(assignmentId);
                    setSuccess("Delivery completed successfully.");
                    break;

                default:
                    return;
            }

            await refreshDashboard();

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to perform delivery action."
            );

        } finally {
            setActionLoading(null);
        }
    };

    // Delivery Completion Rate
    const completionRate = statistics?.totalAssignments > 0
        ? Math.round(
            (statistics.completedDeliveries /
                statistics.totalAssignments) * 100
        )
        : 0;

    // Format dates
    const formatDate = (date) => {
        if (!date) return "Not available";

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Status labels
    const getStatusLabel = (status) => {

        const labels = {
            ASSIGNED: "New Assignment",
            ACCEPTED: "Accepted",
            REJECTED: "Rejected",
            PICKED_UP: "Order Picked Up",
            OUT_FOR_DELIVERY: "On the Way",
            DELIVERED: "Delivered",
            CANCELLED: "Cancelled"
        };

        return labels[status] || status;
    };

    // Render action buttons according to delivery status
    const renderActions = (delivery) => {

        const id = delivery.id;
        const busy = actionLoading === id;

        switch (delivery.status) {

            case "ASSIGNED":
                return (
                    <>
                        <button
                            className="dp-btn dp-btn-primary"
                            disabled={busy}
                            onClick={() => handleAction(id, "accept")}
                        >
                            {busy ? "Please wait..." : "Accept Delivery"}
                            <ArrowRight size={17} />
                        </button>

                        <button
                            className="dp-btn dp-btn-outline-danger"
                            disabled={busy}
                            onClick={() => handleAction(id, "reject")}
                        >
                            Reject
                        </button>
                    </>
                );

            case "ACCEPTED":
                return (
                    <button
                        className="dp-btn dp-btn-primary"
                        disabled={busy}
                        onClick={() => handleAction(id, "pickup")}
                    >
                        {busy ? "Please wait..." : "Confirm Pickup"}
                        <Package size={17} />
                    </button>
                );

            case "PICKED_UP":
                return (
                    <button
                        className="dp-btn dp-btn-primary"
                        disabled={busy}
                        onClick={() => handleAction(id, "start")}
                    >
                        {busy ? "Please wait..." : "Start Delivery"}
                        <Truck size={17} />
                    </button>
                );

            case "OUT_FOR_DELIVERY":
                return (
                    <button
                        className="dp-btn dp-btn-success"
                        disabled={busy}
                        onClick={() => handleAction(id, "complete")}
                    >
                        {busy ? "Please wait..." : "Complete Delivery"}
                        <CheckCircle2 size={17} />
                    </button>
                );

            default:
                return (
                    <span className="dp-no-action">
                        No further action required
                    </span>
                );
        }
    };

    return (
        <div className="delivery-dashboard">

            {/* Sidebar */}
            <aside className="dp-sidebar">

                <div className="dp-brand">
                    <div className="dp-brand-icon">
                        <Bike size={27} />
                    </div>

                    <div>
                        <h2>FoodExpress</h2>
                        <span>Delivery Partner</span>
                    </div>
                </div>

                <div className="dp-sidebar-label">
                    WORKSPACE
                </div>

                <nav className="dp-navigation">

                    <a href="#dashboard" className="dp-nav-link active">
                        <LayoutDashboard size={19} />
                        Dashboard
                    </a>

                    <a href="#my-deliveries" className="dp-nav-link">
                        <Package size={19} />
                        My Deliveries
                        <span className="dp-nav-count">
                            {deliveries.length}
                        </span>
                    </a>

                    <a href="#delivery-history" className="dp-nav-link">
                        <History size={19} />
                        Delivery History
                    </a>

                    <a href="#delivery-statistics" className="dp-nav-link">
                        <BarChart3 size={19} />
                        Statistics
                    </a>

                </nav>

                <div className="dp-sidebar-bottom">

                    <div className="dp-sidebar-status">
                        <span className="dp-online-dot"></span>

                        <div>
                            <strong>Dashboard Active</strong>
                            <small>Ready to manage deliveries</small>
                        </div>
                    </div>

                    <div className="dp-sidebar-footer">
                        <ShieldCheck size={17} />
                        Secure Partner Portal
                    </div>

                </div>

            </aside>

            {/* Main Content */}
            <main className="dp-main" id="dashboard">

                {/* Top Bar */}
                <div className="dp-topbar">

                    <div>
                        <span className="dp-breadcrumb">
                            Workspace / Dashboard
                        </span>

                        <h1>Delivery Dashboard</h1>
                    </div>

                    <button
                        className="dp-refresh-btn"
                        onClick={refreshDashboard}
                        disabled={loading || historyLoading}
                    >
                        <RefreshCw
                            size={17}
                            className={
                                loading || historyLoading
                                    ? "dp-spinning"
                                    : ""
                            }
                        />
                        Refresh
                    </button>

                </div>

                {/* Welcome Banner */}
                <section className="dp-welcome">

                    <div className="dp-welcome-content">

                        <span className="dp-welcome-tag">
                            <Activity size={14} />
                            PARTNER WORKSPACE
                        </span>

                        <h2>
                            Welcome back,{" "}
                            {user?.firstName ||
                                user?.name ||
                                user?.username ||
                                "Delivery Partner"}
                            !
                        </h2>

                        <p>
                            Manage your assignments, update delivery
                            progress and keep customers informed.
                        </p>

                    </div>

                    <div className="dp-welcome-art">
                        <div className="dp-art-circle">
                            <Bike size={76} strokeWidth={1.5} />
                        </div>
                    </div>

                </section>

                {/* Main Statistics */}
                <section
                    className="dp-stats-grid"
                    id="delivery-statistics"
                >

                    <div className="dp-stat-card">
                        <div className="dp-stat-icon blue">
                            <Package size={23} />
                        </div>

                        <div>
                            <span>Total Assignments</span>
                            <h3>
                                {statistics?.totalAssignments ?? 0}
                            </h3>
                            <small>All assigned deliveries</small>
                        </div>
                    </div>

                    <div className="dp-stat-card">
                        <div className="dp-stat-icon orange">
                            <Clock3 size={23} />
                        </div>

                        <div>
                            <span>Pending Assignments</span>
                            <h3>
                                {statistics?.assignedDeliveries ?? 0}
                            </h3>
                            <small>Waiting for acceptance</small>
                        </div>
                    </div>

                    <div className="dp-stat-card">
                        <div className="dp-stat-icon teal">
                            <Truck size={23} />
                        </div>

                        <div>
                            <span>Active Deliveries</span>
                            <h3>
                                {statistics?.activeDeliveries ?? 0}
                            </h3>
                            <small>Currently in progress</small>
                        </div>
                    </div>

                    <div className="dp-stat-card">
                        <div className="dp-stat-icon green">
                            <CheckCircle2 size={23} />
                        </div>

                        <div>
                            <span>Completed</span>
                            <h3>
                                {statistics?.completedDeliveries ?? 0}
                            </h3>
                            <small>Successfully delivered</small>
                        </div>
                    </div>

                </section>

                {/* Additional Statistics */}
                <section className="dp-extra-stats">

                    <div className="dp-extra-stat">
                        <span>Accepted</span>
                        <strong>
                            {statistics?.acceptedDeliveries ?? 0}
                        </strong>
                    </div>

                    <div className="dp-extra-stat">
                        <span>Picked Up</span>
                        <strong>
                            {statistics?.pickedUpDeliveries ?? 0}
                        </strong>
                    </div>

                    <div className="dp-extra-stat">
                        <span>Out for Delivery</span>
                        <strong>
                            {statistics?.outForDelivery ?? 0}
                        </strong>
                    </div>

                    <div className="dp-extra-stat">
                        <span>Rejected</span>
                        <strong>
                            {statistics?.rejectedDeliveries ?? 0}
                        </strong>
                    </div>

                    <div className="dp-extra-stat">
                        <span>Cancelled</span>
                        <strong>
                            {statistics?.cancelledDeliveries ?? 0}
                        </strong>
                    </div>

                    {/* Completion Rate */}
                    <div className="dp-extra-stat">
                        <span>
                            <TrendingUp size={15} />
                            Completion Rate
                        </span>

                        <strong>
                            {completionRate}%
                        </strong>
                    </div>

                </section>

                {/* Delivery Section */}
                <section
                    className="dp-deliveries-section"
                    id="my-deliveries"
                >

                    <div className="dp-section-heading">

                        <div>
                            <span className="dp-section-eyebrow">
                                YOUR WORK
                            </span>

                            <h2>My Deliveries</h2>

                            <p>
                                View and manage your delivery assignments.
                            </p>
                        </div>

                        <span className="dp-total-pill">
                            {deliveries.length} Assignments
                        </span>

                    </div>

                    {error && (
                        <div className="dp-alert dp-alert-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="dp-alert dp-alert-success">
                            <CheckCircle2 size={18} />
                            {success}
                        </div>
                    )}

                    {loading ? (

                        <div className="dp-loading">
                            <div className="dp-loader"></div>
                            <h3>Loading your deliveries</h3>
                            <p>
                                Please wait while we fetch your assignments.
                            </p>
                        </div>

                    ) : deliveries.length === 0 ? (

                        <div className="dp-empty-state">

                            <div className="dp-empty-icon">
                                <Package size={42} />
                            </div>

                            <h3>No deliveries assigned yet</h3>

                            <p>
                                New delivery assignments will appear here.
                                Check again in a little while.
                            </p>

                            <button
                                className="dp-btn dp-btn-primary"
                                onClick={refreshDashboard}
                            >
                                <RefreshCw size={17} />
                                Check Again
                            </button>

                        </div>

                    ) : (

                        <div className="dp-delivery-grid">

                            {deliveries.map((delivery) => (

                                <article
                                    key={delivery.id}
                                    className="dp-delivery-card"
                                >

                                    <div className="dp-card-top">

                                        <div className="dp-order-icon">
                                            <Package size={23} />
                                        </div>

                                        <div className="dp-order-info">
                                            <span>ORDER NUMBER</span>
                                            <h3>#{delivery.orderId}</h3>
                                        </div>

                                        <span
                                            className={`dp-status dp-status-${delivery.status?.toLowerCase()}`}
                                        >
                                            <span className="dp-status-dot"></span>
                                            {getStatusLabel(delivery.status)}
                                        </span>

                                    </div>

                                    <div className="dp-card-divider"></div>

                                    <div className="dp-card-details">

                                        <div className="dp-detail-item">
                                            <span>Assignment ID</span>
                                            <strong>#{delivery.id}</strong>
                                        </div>

                                        <div className="dp-detail-item">
                                            <span>Assigned Date</span>

                                            <strong>
                                                <CalendarDays size={15} />
                                                {formatDate(delivery.assignedAt)}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="dp-gps-panel">

                                        <div className="dp-gps-heading">
                                            <MapPin size={17} />
                                            <strong>
                                                Live Location Tracking
                                            </strong>
                                        </div>

                                        <DeliveryLocationStatus
                                            assignmentId={delivery.id}
                                            status={delivery.status}
                                        />

                                    </div>

                                    <div className="dp-card-actions">
                                        {renderActions(delivery)}
                                    </div>

                                </article>

                            ))}

                        </div>

                    )}

                </section>

                {/* Delivery History */}
                <section
                    className="dp-history-section"
                    id="delivery-history"
                >

                    <div className="dp-section-heading">

                        <div>
                            <span className="dp-section-eyebrow">
                                PAST DELIVERIES
                            </span>

                            <h2>Delivery History</h2>

                            <p>
                                Review your previously completed assignments.
                            </p>
                        </div>

                        <span className="dp-total-pill">
                            {deliveryHistory.length} Records
                        </span>

                    </div>

                    {historyLoading ? (

                        <div className="dp-loading">
                            <div className="dp-loader"></div>
                            <h3>Loading delivery history</h3>
                        </div>

                    ) : deliveryHistory.length === 0 ? (

                        <div className="dp-empty-state">
                            <div className="dp-empty-icon">
                                <History size={42} />
                            </div>

                            <h3>No delivery history available</h3>

                            <p>
                                Your completed delivery records will
                                appear here.
                            </p>
                        </div>

                    ) : (

                        <div className="dp-history-list">

                            {deliveryHistory.map((delivery) => (

                                <article
                                    className="dp-history-card"
                                    key={delivery.id}
                                >

                                    <div className="dp-history-icon">
                                        <CheckCircle2 size={23} />
                                    </div>

                                    <div className="dp-history-info">

                                        <h3>
                                            Order #{delivery.orderId}
                                        </h3>

                                        <p>
                                            Assignment #{delivery.id}
                                        </p>

                                        <span>
                                            <CalendarDays size={14} />
                                            Assigned: {formatDate(delivery.assignedAt)}
                                        </span>

                                        <span>
                                            <Clock3 size={14} />
                                            Delivered: {formatDate(delivery.deliveredAt)}
                                        </span>

                                    </div>

                                    <span
                                        className={`dp-status dp-status-${delivery.status?.toLowerCase()}`}
                                    >
                                        {getStatusLabel(delivery.status)}
                                    </span>

                                </article>

                            ))}

                        </div>

                    )}

                </section>

                {/* Footer */}
                <footer className="dp-footer">

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
