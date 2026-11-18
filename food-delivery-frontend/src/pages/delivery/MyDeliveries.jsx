
import { useCallback, useEffect, useState } from "react";
import {
    Package,
    MapPin,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Truck,
    Clock,
    AlertCircle,
    LoaderCircle
} from "lucide-react";

import {
    getMyAssignments,
    acceptDelivery,
    rejectDelivery,
    pickupDelivery,
    startDelivery,
    completeDelivery
} from "../../services/deliveryService";

import "../../styles/delivery/MyDeliveries.css";

export default function MyDeliveries() {

    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadDeliveries = useCallback(async (showLoader = false) => {
        try {
            if (showLoader) {
                setRefreshing(true);
            }

            setError("");

            const response = await getMyAssignments();

            setDeliveries(
                Array.isArray(response) ? response : []
            );

        } catch (err) {
            console.error("Failed to load deliveries:", err);
            setError("Unable to load your deliveries. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDeliveries();
    }, [loadDeliveries]);

    const handleAction = async (deliveryId, action, actionName) => {

        try {
            setActionLoading(deliveryId);
            setError("");
            setSuccess("");

            switch (action) {

                case "accept":
                    await acceptDelivery(deliveryId);
                    break;

                case "reject": {
                    const reason = window.prompt(
                        "Please enter a reason for rejecting this delivery:"
                    );

                    if (reason === null) {
                        return;
                    }

                    await rejectDelivery(
                        deliveryId,
                        reason.trim()
                    );
                    break;
                }

                case "pickup":
                    await pickupDelivery(deliveryId);
                    break;

                case "start":
                    await startDelivery(deliveryId);
                    break;

                case "complete":
                    await completeDelivery(deliveryId);
                    break;

                default:
                    return;
            }

            setSuccess(
                `Delivery successfully ${actionName}.`
            );

            await loadDeliveries();

        } catch (err) {
            console.error("Delivery action failed:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to update delivery. Please try again."
            );
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusClass = (status) => {
        return status?.toLowerCase().replaceAll("_", "-") || "unknown";
    };

    const formatStatus = (status) => {
        return status?.replaceAll("_", " ") || "UNKNOWN";
    };

    const getActionButtons = (delivery) => {

        const id = delivery.id;

        switch (delivery.status) {

            case "ASSIGNED":
                return (
                    <>
                        <button
                            className="my-delivery-btn accept"
                            disabled={actionLoading === id}
                            onClick={() =>
                                handleAction(id, "accept", "accepted")
                            }
                        >
                            <CheckCircle2 size={16} />
                            Accept
                        </button>

                        <button
                            className="my-delivery-btn reject"
                            disabled={actionLoading === id}
                            onClick={() =>
                                handleAction(id, "reject", "rejected")
                            }
                        >
                            <XCircle size={16} />
                            Reject
                        </button>
                    </>
                );

            case "ACCEPTED":
                return (
                    <button
                        className="my-delivery-btn pickup"
                        disabled={actionLoading === id}
                        onClick={() =>
                            handleAction(id, "pickup", "marked as picked up")
                        }
                    >
                        <Package size={16} />
                        Confirm Pickup
                    </button>
                );

            case "PICKED_UP":
                return (
                    <button
                        className="my-delivery-btn start"
                        disabled={actionLoading === id}
                        onClick={() =>
                            handleAction(id, "start", "started")
                        }
                    >
                        <Truck size={16} />
                        Start Delivery
                    </button>
                );

            case "OUT_FOR_DELIVERY":
                return (
                    <button
                        className="my-delivery-btn complete"
                        disabled={actionLoading === id}
                        onClick={() =>
                            handleAction(id, "complete", "completed")
                        }
                    >
                        <CheckCircle2 size={16} />
                        Complete Delivery
                    </button>
                );

            default:
                return null;
        }
    };

    const activeDeliveries = deliveries.filter(delivery =>
        ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"]
            .includes(delivery.status)
    );

    if (loading) {
        return (
            <div className="my-deliveries-loading">
                <LoaderCircle className="loading-spin" size={35} />
                <p>Loading your deliveries...</p>
            </div>
        );
    }

    return (
        <div className="my-deliveries-page">

            {/* HEADER */}
            <div className="my-deliveries-header">

                <div>
                    <span className="delivery-eyebrow">
                        DELIVERY MANAGEMENT
                    </span>

                    <h1>My Deliveries</h1>

                    <p>
                        Manage your assigned orders and update their
                        delivery progress.
                    </p>
                </div>

                <button
                    className="my-deliveries-refresh"
                    onClick={() => loadDeliveries(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={17}
                        className={refreshing ? "loading-spin" : ""}
                    />
                    Refresh
                </button>

            </div>

            {/* NOTIFICATIONS */}
            {error && (
                <div className="my-deliveries-alert error">
                    <AlertCircle size={18} />
                    <span>{error}</span>

                    <button onClick={() => setError("")}>
                        ×
                    </button>
                </div>
            )}

            {success && (
                <div className="my-deliveries-alert success">
                    <CheckCircle2 size={18} />
                    <span>{success}</span>

                    <button onClick={() => setSuccess("")}>
                        ×
                    </button>
                </div>
            )}

            {/* SUMMARY */}
            <div className="my-deliveries-summary">

                <div className="my-deliveries-summary-card">
                    <div className="summary-card-icon">
                        <Package size={21} />
                    </div>

                    <div>
                        <span>Total Assignments</span>
                        <strong>{deliveries.length}</strong>
                    </div>
                </div>

                <div className="my-deliveries-summary-card">
                    <div className="summary-card-icon active">
                        <Truck size={21} />
                    </div>

                    <div>
                        <span>Active Deliveries</span>
                        <strong>{activeDeliveries.length}</strong>
                    </div>
                </div>

                <div className="my-deliveries-summary-card">
                    <div className="summary-card-icon pending">
                        <Clock size={21} />
                    </div>

                    <div>
                        <span>Awaiting Acceptance</span>
                        <strong>
                            {deliveries.filter(
                                item => item.status === "ASSIGNED"
                            ).length}
                        </strong>
                    </div>
                </div>

            </div>

            {/* DELIVERY LIST */}
            <section className="my-deliveries-panel">

                <div className="my-deliveries-panel-header">
                    <div>
                        <h2>Assigned Orders</h2>
                        <p>
                            Review your assignments and take the next action.
                        </p>
                    </div>

                    <span className="my-deliveries-count">
                        {deliveries.length} Orders
                    </span>
                </div>

                {deliveries.length === 0 ? (

                    <div className="my-deliveries-empty">
                        <div>
                            <Package size={32} />
                        </div>

                        <h3>No deliveries assigned</h3>

                        <p>
                            You don't have any delivery assignments right now.
                            New assignments will appear here.
                        </p>

                        <button
                            onClick={() => loadDeliveries(true)}
                            disabled={refreshing}
                        >
                            Check Again
                        </button>
                    </div>

                ) : (

                    <div className="my-deliveries-list">

                        {deliveries.map(delivery => (

                            <article
                                className="my-delivery-card"
                                key={delivery.id}
                            >

                                <div className="my-delivery-card-top">

                                    <div className="my-delivery-order">
                                        <div className="my-delivery-order-icon">
                                            <Package size={21} />
                                        </div>

                                        <div>
                                            <span>DELIVERY ID</span>
                                            <h3>#{delivery.id}</h3>
                                        </div>
                                    </div>

                                    <span
                                        className={`my-delivery-status ${getStatusClass(delivery.status)}`}
                                    >
                                        {formatStatus(delivery.status)}
                                    </span>

                                </div>

                                <div className="my-delivery-address">

                                    <MapPin size={18} />

                                    <div>
                                        <span>Delivery Address</span>
                                        <p>
                                            {delivery.deliveryAddress ||
                                                delivery.address ||
                                                "Address not available"}
                                        </p>
                                    </div>

                                </div>

                                <div className="my-delivery-card-footer">

                                    <div className="my-delivery-order-reference">
                                        <span>Order ID</span>
                                        <strong>
                                            #{delivery.orderId ?? "N/A"}
                                        </strong>
                                    </div>

                                    <div className="my-delivery-actions">

                                        {actionLoading === delivery.id ? (
                                            <span className="my-delivery-processing">
                                                <LoaderCircle
                                                    size={16}
                                                    className="loading-spin"
                                                />
                                                Updating...
                                            </span>
                                        ) : (
                                            getActionButtons(delivery)
                                        )}

                                    </div>

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </section>

        </div>
    );
}
