
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Package,
    MapPin,
    Clock,
    ShoppingBag,
    RefreshCw,
    User,
    Check,
    Truck,
    Phone
} from "lucide-react";

import { getMyOrders } from "../services/orderService";
import { getDeliveryByOrderId } from "../services/deliveryService";
import DeliveryLiveMap from "../components/DeliveryLiveMap";
import "../styles/MyOrders.css";

const TRACKING_STAGES = [
    {
        label: "Order Placed",
        description: "Your order has been confirmed.",
        timestamp: "createdAt",
        source: "order"
    },
    {
        label: "Partner Assigned",
        description: "A delivery partner has been assigned.",
        timestamp: "assignedAt",
        source: "delivery"
    },
    {
        label: "Order Picked Up",
        description: "Your delivery partner has collected your order.",
        timestamp: "pickedUpAt",
        source: "delivery"
    },
    {
        label: "Out for Delivery",
        description: "Your order is on its way.",
        timestamp: "outForDeliveryAt",
        source: "delivery"
    },
    {
        label: "Delivered",
        description: "Your order has been delivered.",
        timestamp: "deliveredAt",
        source: "delivery"
    }
];

const ORDER_STAGES = [
    {
        status: "PLACED",
        label: "Order Placed",
        description: "Your order has been received."
    },
    {
        status: "CONFIRMED",
        label: "Order Confirmed",
        description: "The restaurant has accepted your order."
    },
    {
        status: "PREPARING",
        label: "Preparing Your Food",
        description: "Your food is being freshly prepared."
    },
    {
        status: "READY_FOR_PICKUP",
        label: "Ready for Pickup",
        description: "Your order is ready for the delivery partner."
    }
];

const ORDER_STATUS_PROGRESS = {
    PLACED: 0,
    CONFIRMED: 1,
    PREPARING: 2,
    READY_FOR_PICKUP: 3,
    PICKED_UP: 4,
    OUT_FOR_DELIVERY: 5,
    DELIVERED: 6
};

const STATUS_PROGRESS = {
    ASSIGNED: 1,
    ACCEPTED: 1,
    PICKED_UP: 2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4
};

export default function MyOrders() {

    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [tracking, setTracking] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load orders and initial delivery tracking
    const loadOrders = useCallback(async () => {

        try {
            setLoading(true);
            setError("");

            const data = await getMyOrders();

            const sortedOrders = [...(data || [])].sort(
                (a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
            );

            setOrders(sortedOrders);

            setTracking(
                Object.fromEntries(
                    sortedOrders.map(order => [
                        order.id,
                        {
                            loading: true,
                            data: null,
                            unavailable: false,
                            error: ""
                        }
                    ])
                )
            );

            const results = await Promise.allSettled(
                sortedOrders.map(order =>
                    getDeliveryByOrderId(order.id)
                )
            );

            const trackingResults = {};

            results.forEach((result, index) => {

                const orderId = sortedOrders[index].id;

                if (result.status === "fulfilled") {

                    trackingResults[orderId] = {
                        loading: false,
                        data: result.value,
                        unavailable: !result.value,
                        error: ""
                    };

                } else {

                    const status = result.reason?.response?.status;

                    trackingResults[orderId] = {
                        loading: false,
                        data: null,
                        unavailable: status === 400 || status === 404,
                        error:
                            status === 400 || status === 404
                                ? ""
                                : "Unable to load delivery tracking."
                    };
                }
            });

            setTracking(trackingResults);

        } catch (err) {

            console.error("Unable to load orders:", err);

            setError(
                "Unable to load your orders. Please try again."
            );

        } finally {
            setLoading(false);
        }

    }, []);

    // Refresh delivery tracking without reloading the page
    const refreshTracking = useCallback(async () => {

        if (orders.length === 0) return;

        try {

            const results = await Promise.allSettled(
                orders.map(order =>
                    getDeliveryByOrderId(order.id)
                )
            );

            const updatedTracking = {};

            results.forEach((result, index) => {

                const orderId = orders[index].id;

                if (result.status === "fulfilled") {

                    updatedTracking[orderId] = {
                        loading: false,
                        data: result.value,
                        unavailable: !result.value,
                        error: ""
                    };

                } else {

                    const status = result.reason?.response?.status;

                    updatedTracking[orderId] = {
                        loading: false,
                        data: null,
                        unavailable: status === 400 || status === 404,
                        error:
                            status === 400 || status === 404
                                ? ""
                                : "Unable to refresh delivery tracking."
                    };
                }
            });

            setTracking(previous => ({
                ...previous,
                ...updatedTracking
            }));

        } catch (err) {
            console.error("Tracking refresh failed:", err);
        }

    }, [orders]);

    // Initial loading
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Automatically refresh tracking every 15 seconds
    useEffect(() => {

        if (orders.length === 0) return;

        const interval = setInterval(() => {
            refreshTracking();
        }, 15000);

        return () => clearInterval(interval);

    }, [orders.length, refreshTracking]);

    // Format price
    const formatPrice = (price) =>
        Number(price || 0).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR"
        });

    // Format date
    const formatDate = (date) => {

        if (!date) return "Pending";

        return new Date(date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    };

    // Format order status CSS class
    const getStatusClass = (status) =>
        (status || "unknown").toLowerCase().replaceAll("_", "-");

    // Calculate delivery progress
    const getTrackingProgress = (status) => {

        return STATUS_PROGRESS[status] ?? -1;
    };

    const renderOrderProgress = (order) => {

        if (order.status === "CANCELLED") {
            return (
                <div className="order-progress-cancelled">
                    <strong>Order Cancelled</strong>
                    <p>This order has been cancelled.</p>
                </div>
            );
        }

        const currentProgress =
            ORDER_STATUS_PROGRESS[order.status] ?? -1;

        return (
            <div className="order-status-timeline">

                <h3>Restaurant Order Progress</h3>

                <div className="tracking-timeline">

                    {ORDER_STAGES.map((stage, index) => {

                        const completed = currentProgress >= index;

                        return (
                            <div
                                key={stage.status}
                                className={`tracking-step ${completed ? "completed" : "pending"
                                    }`}
                            >

                                <div className="tracking-step-indicator">

                                    <div className="tracking-step-circle">
                                        {completed && <Check size={12} />}
                                    </div>

                                    {index !== ORDER_STAGES.length - 1 && (
                                        <div className="tracking-step-line" />
                                    )}

                                </div>

                                <div className="tracking-step-content">

                                    <strong>{stage.label}</strong>

                                    <small>{stage.description}</small>

                                </div>

                            </div>
                        );
                    })}

                </div>

            </div>
        );
    };

    // Render delivery tracking
    const renderTracking = (order) => {

        const trackingInfo = tracking[order.id];

        if (!trackingInfo || trackingInfo.loading) {

            return (
                <div className="tracking-loading">
                    Loading delivery tracking...
                </div>
            );
        }

        if (trackingInfo.error) {

            return (
                <div className="tracking-unavailable">
                    {trackingInfo.error}
                </div>
            );
        }

        const delivery = trackingInfo.data;

        // No delivery assignment yet
        if (!delivery) {

            return (
                <div className="tracking-unavailable">

                    <Truck size={18} />

                    <strong>
                        Awaiting delivery assignment
                    </strong>

                    <p>
                        Your order is being processed.
                        Delivery tracking will appear once
                        a delivery partner is assigned.
                    </p>

                </div>
            );
        }

        const status = delivery.status;

        const isRejected =
            status === "REJECTED" ||
            status === "CANCELLED";

        const currentStep = getTrackingProgress(status);

        return (

            <div className="order-tracking">

                {/* Tracking header */}

                <div className="tracking-header">

                    <h3>Delivery Tracking</h3>

                    <span>
                        {(status || "UNKNOWN").replaceAll("_", " ")}
                    </span>

                </div>

                {/* Delivery partner information */}

                {delivery.deliveryPartnerName && (

                    <div className="tracking-partner">

                        <div className="tracking-partner-icon">
                            <User size={21} />
                        </div>

                        <div className="tracking-partner-info">

                            <small>YOUR DELIVERY PARTNER</small>

                            <strong>
                                {delivery.deliveryPartnerName}
                            </strong>

                            {delivery.deliveryPartnerPhone && (

                                <a
                                    href={`tel:${delivery.deliveryPartnerPhone}`}
                                    className="tracking-partner-phone"
                                >
                                    <Phone size={13} />
                                    {delivery.deliveryPartnerPhone}
                                </a>

                            )}

                        </div>

                    </div>

                )}

                {/* Rejected or cancelled assignment */}

                {isRejected ? (

                    <div className="tracking-unavailable">

                        {status === "REJECTED"
                            ? "Your delivery assignment was rejected. A new delivery partner may be assigned."
                            : "This delivery assignment has been cancelled."}

                    </div>

                ) : (
                    <>
                        {/* Delivery progress timeline */}

                        <div className="tracking-timeline">

                            {TRACKING_STAGES.map((stage, index) => {

                                const completed = index <= currentStep;

                                const stageTimestamp =
                                    stage.source === "order"
                                        ? order[stage.timestamp]
                                        : delivery[stage.timestamp];

                                return (
                                    <div
                                        key={stage.label}
                                        className={`tracking-step ${completed ? "completed" : "pending"
                                            }`}
                                    >

                                        <div className="tracking-step-indicator">

                                            <div className="tracking-step-circle">
                                                {completed && <Check size={12} />}
                                            </div>

                                            {index !== TRACKING_STAGES.length - 1 && (
                                                <div className="tracking-step-line" />
                                            )}

                                        </div>

                                        <div className="tracking-step-content">

                                            <strong>{stage.label}</strong>

                                            <small>{stage.description}</small>

                                            {completed && stageTimestamp && (
                                                <small className="tracking-timestamp">
                                                    <Clock size={12} />
                                                    {formatDate(stageTimestamp)}
                                                </small>
                                            )}

                                        </div>

                                    </div>
                                );
                            })}

                        </div>

                        {/* Live delivery map */}
                        {(status === "PICKED_UP" ||
                            status === "OUT_FOR_DELIVERY") && (
                                <DeliveryLiveMap
                                    latitude={delivery.latitude}
                                    longitude={delivery.longitude}
                                    locationUpdatedAt={delivery.locationUpdatedAt}
                                />
                            )}
                    </>
                )}

            </div>
        );
    };

    // Initial loading screen
    if (loading) {

        return (
            <div className="orders-loading">

                <Package size={40} />

                <p>Loading your orders...</p>

            </div>
        );
    }

    return (

        <div className="my-orders-page">

            {/* Header */}

            <div className="orders-header">

                <div>

                    <h1>My Orders</h1>

                    <p>
                        Track and manage your food orders.
                    </p>

                </div>

                <button
                    className="refresh-orders-btn"
                    onClick={loadOrders}
                    disabled={loading}
                >

                    <RefreshCw size={17} />

                    Refresh

                </button>

            </div>

            {/* Error */}

            {error && (

                <div className="orders-error">

                    {error}

                    <button onClick={loadOrders}>
                        Try Again
                    </button>

                </div>

            )}

            {/* Empty orders */}

            {!error && orders.length === 0 && (

                <div className="no-orders">

                    <ShoppingBag size={65} />

                    <h2>No orders yet</h2>

                    <p>
                        Your food orders will appear here.
                    </p>

                    <button
                        onClick={() => navigate("/restaurants")}
                    >
                        Explore Restaurants
                    </button>

                </div>

            )}

            {/* Orders list */}

            {!error && orders.length > 0 && (

                <div className="orders-list">

                    {orders.map(order => (

                        <article
                            className="order-card"
                            key={order.id}
                        >

                            {/* Order header */}

                            <div className="order-card-header">

                                <div>

                                    <span className="order-number">
                                        Order #{order.id}
                                    </span>

                                    <small>
                                        {formatDate(order.createdAt)}
                                    </small>

                                </div>

                                <span
                                    className={`order-status ${getStatusClass(order.status)}`}
                                >
                                    {(order.status || "UNKNOWN").replaceAll("_", " ")}
                                </span>

                            </div>

                            {/* Restaurant */}

                            <div className="order-restaurant">

                                <Package size={20} />

                                <strong>
                                    Restaurant #{order.restaurantId}
                                </strong>

                            </div>

                            {/* Restaurant order progress */}

                            {renderOrderProgress(order)}

                            {/* Ordered items */}

                            <div className="order-items">

                                {(order.items || []).map(item => (

                                    <div
                                        className="order-item"
                                        key={item.id}
                                    >

                                        <div>

                                            <strong>
                                                {item.itemName}
                                            </strong>

                                            <small>
                                                {formatPrice(item.unitPrice)}
                                                {" × "}
                                                {item.quantity}
                                            </small>

                                        </div>

                                        <strong>
                                            {formatPrice(item.subtotal)}
                                        </strong>

                                    </div>

                                ))}

                            </div>

                            {/* Delivery address */}

                            <div className="order-delivery">

                                <MapPin size={17} />

                                <span>
                                    {order.deliveryAddress}
                                </span>

                            </div>

                            {/* Special instructions */}

                            {order.specialInstructions && (

                                <p className="order-instructions">
                                    Note: {order.specialInstructions}
                                </p>

                            )}

                            {/* Delivery tracking */}

                            {renderTracking(order)}

                            {/* Order footer */}

                            <div className="order-card-footer">

                                <div>

                                    <small>
                                        Payment: {order.paymentStatus}
                                    </small>

                                    <h3>
                                        {formatPrice(order.totalAmount)}
                                    </h3>

                                </div>

                                <div className="order-updated">

                                    <Clock size={15} />

                                    <small>
                                        Updated: {formatDate(order.updatedAt)}
                                    </small>

                                </div>

                            </div>

                        </article>

                    ))}

                </div>

            )}

        </div>
    );
}
