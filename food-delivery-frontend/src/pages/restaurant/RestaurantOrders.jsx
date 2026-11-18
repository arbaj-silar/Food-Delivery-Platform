
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    ShoppingBag,
    Clock,
    ChefHat,
    PackageCheck,
    CheckCircle2,
    XCircle,
    Eye,
    MapPin,
    CalendarDays,
    IndianRupee,
    AlertCircle,
    ClipboardList
} from "lucide-react";

import {
    getRestaurantOrders,
    updateOrderStatus
} from "../../services/orderService";

import { getMyRestaurants } from "../../services/restaurantService";

import "../../styles/restaurant/RestaurantOrders.css";

const FILTERS = [
    { label: "All Orders", value: "ALL" },
    { label: "New", value: "PLACED" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Preparing", value: "PREPARING" },
    { label: "Ready", value: "READY_FOR_PICKUP" },
    { label: "Completed", value: "DELIVERED" },
    { label: "Cancelled", value: "CANCELLED" }
];

const STATUS_LABELS = {
    PLACED: "New Order",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    READY_FOR_PICKUP: "Ready for Pickup",
    PICKED_UP: "Picked Up",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled"
};

const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toFixed(2)}`;
};

export default function RestaurantOrders() {
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState("");
    const [orders, setOrders] = useState([]);

    const [activeFilter, setActiveFilter] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    // Load restaurants owned by the logged-in restaurant owner.
    const loadRestaurants = useCallback(async () => {
        try {
            setLoadingRestaurants(true);
            setError("");

            const data = await getMyRestaurants();
            const restaurantList = Array.isArray(data) ? data : [];

            setRestaurants(restaurantList);

            setSelectedRestaurant((current) => {
                if (
                    current &&
                    restaurantList.some(
                        (restaurant) => String(restaurant.id) === String(current)
                    )
                ) {
                    return current;
                }

                const availableRestaurant = restaurantList.find(
                    (restaurant) =>
                        restaurant.status === "APPROVED" &&
                        restaurant.active !== false
                ) || restaurantList[0];

                return availableRestaurant
                    ? String(availableRestaurant.id)
                    : "";
            });
        } catch (err) {
            console.error("Restaurant loading error:", err);
            setError("Unable to load your restaurants. Please try again.");
        } finally {
            setLoadingRestaurants(false);
        }
    }, []);

    // Load orders for the selected restaurant.
    const loadOrders = useCallback(async (showRefresh = false) => {
        if (!selectedRestaurant) {
            setOrders([]);
            return;
        }

        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoadingOrders(true);
            }

            setError("");

            const data = await getRestaurantOrders(selectedRestaurant);
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Restaurant orders loading error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load orders. Please refresh and try again."
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

    // Search and status filtering.
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesStatus =
                activeFilter === "ALL" || order.status === activeFilter;

            const search = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !search ||
                String(order.id).includes(search) ||
                String(order.customerId || "").toLowerCase().includes(search) ||
                (order.items || []).some((item) =>
                    String(item.itemName || "").toLowerCase().includes(search)
                );

            return matchesStatus && matchesSearch;
        });
    }, [orders, activeFilter, searchTerm]);

    // Dashboard summary counts.
    const summary = useMemo(() => ({
        total: orders.length,
        newOrders: orders.filter((o) => o.status === "PLACED").length,
        preparing: orders.filter(
            (o) => ["CONFIRMED", "PREPARING"].includes(o.status)
        ).length,
        ready: orders.filter((o) => o.status === "READY_FOR_PICKUP").length,
        completed: orders.filter((o) => o.status === "DELIVERED").length
    }), [orders]);

    const handleStatusUpdate = async (order, newStatus) => {
        const actionLabel = newStatus === "CANCELLED" ? "reject" : "update";

        if (
            newStatus === "CANCELLED" &&
            !window.confirm(`Are you sure you want to reject Order #${order.id}?`)
        ) {
            return;
        }

        try {
            setUpdatingOrderId(order.id);

            const updatedOrder = await updateOrderStatus(order.id, newStatus);

            setOrders((currentOrders) =>
                currentOrders.map((item) =>
                    item.id === order.id ? updatedOrder : item
                )
            );

            setSelectedOrder((current) =>
                current?.id === order.id ? updatedOrder : current
            );
        } catch (err) {
            console.error("Order status update error:", err);

            const message =
                err.response?.data?.message ||
                `Unable to ${actionLabel} this order. Please try again.`;

            alert(message);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const getAvailableActions = (order) => {
        switch (order.status) {
            case "PLACED":
                return [
                    { label: "Accept Order", status: "CONFIRMED", primary: true },
                    { label: "Reject", status: "CANCELLED", danger: true }
                ];

            case "CONFIRMED":
                return [
                    { label: "Start Preparing", status: "PREPARING", primary: true },
                    { label: "Reject", status: "CANCELLED", danger: true }
                ];

            case "PREPARING":
                return [
                    { label: "Mark Ready", status: "READY_FOR_PICKUP", primary: true }
                ];

            default:
                return [];
        }
    };

    const renderStatus = (status) => (
        <span className={`restaurant-orders-status status-${status?.toLowerCase()}`}>
            <span className="status-dot" />
            {STATUS_LABELS[status] || status}
        </span>
    );

    const selectedRestaurantName = restaurants.find(
        (restaurant) => String(restaurant.id) === String(selectedRestaurant)
    )?.name;

    if (loadingRestaurants) {
        return (
            <div className="restaurant-orders-loading">
                <RefreshCw className="spin" size={24} />
                <p>Loading your restaurants...</p>
            </div>
        );
    }

    return (
        <div className="restaurant-orders-page">

            {/* Page Header */}
            <div className="restaurant-orders-header">
                <div>
                    <div className="restaurant-orders-breadcrumb">
                        Restaurant Management / Orders
                    </div>

                    <h1>Order Management</h1>

                    <p>
                        Manage incoming orders and keep your kitchen running smoothly.
                    </p>
                </div>

                <div className="restaurant-orders-header-actions">
                    <select
                        className="restaurant-orders-restaurant-select"
                        value={selectedRestaurant}
                        onChange={(e) => setSelectedRestaurant(e.target.value)}
                    >
                        {restaurants.map((restaurant) => (
                            <option key={restaurant.id} value={restaurant.id}>
                                {restaurant.name}
                            </option>
                        ))}
                    </select>

                    <button
                        className="restaurant-orders-refresh"
                        onClick={() => loadOrders(true)}
                        disabled={!selectedRestaurant || refreshing}
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? "spin" : ""}
                        />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="restaurant-orders-error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {!restaurants.length ? (
                <div className="restaurant-orders-empty">
                    <ShoppingBag size={42} />
                    <h2>No restaurant found</h2>
                    <p>Create a restaurant first to start managing orders.</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="restaurant-orders-summary">

                        <div className="restaurant-orders-summary-card">
                            <div className="summary-icon purple">
                                <ShoppingBag size={21} />
                            </div>
                            <div>
                                <span>Total Orders</span>
                                <h2>{summary.total}</h2>
                            </div>
                        </div>

                        <div className="restaurant-orders-summary-card">
                            <div className="summary-icon orange">
                                <Clock size={21} />
                            </div>
                            <div>
                                <span>New Orders</span>
                                <h2>{summary.newOrders}</h2>
                            </div>
                        </div>

                        <div className="restaurant-orders-summary-card">
                            <div className="summary-icon blue">
                                <ChefHat size={21} />
                            </div>
                            <div>
                                <span>In Preparation</span>
                                <h2>{summary.preparing}</h2>
                            </div>
                        </div>

                        <div className="restaurant-orders-summary-card">
                            <div className="summary-icon green">
                                <PackageCheck size={21} />
                            </div>
                            <div>
                                <span>Ready for Pickup</span>
                                <h2>{summary.ready}</h2>
                            </div>
                        </div>

                        <div className="restaurant-orders-summary-card">
                            <div className="summary-icon teal">
                                <CheckCircle2 size={21} />
                            </div>
                            <div>
                                <span>Completed</span>
                                <h2>{summary.completed}</h2>
                            </div>
                        </div>

                    </div>

                    {/* Orders Workspace */}
                    <div className="restaurant-orders-workspace">

                        <div className="restaurant-orders-toolbar">
                            <div>
                                <h2>Orders</h2>
                                <p>
                                    {selectedRestaurantName || "Selected restaurant"} ·{" "}
                                    {filteredOrders.length} orders
                                </p>
                            </div>

                            <div className="restaurant-orders-search">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search order, customer or item..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Status Filters */}
                        <div className="restaurant-orders-filters">
                            {FILTERS.map((filter) => (
                                <button
                                    key={filter.value}
                                    className={
                                        activeFilter === filter.value ? "active" : ""
                                    }
                                    onClick={() => setActiveFilter(filter.value)}
                                >
                                    {filter.label}
                                    {filter.value === "ALL" && (
                                        <span>{orders.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Orders Table */}
                        <div className="restaurant-orders-table-wrapper">
                            {loadingOrders ? (
                                <div className="restaurant-orders-loading">
                                    <RefreshCw size={23} className="spin" />
                                    <p>Loading orders...</p>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="restaurant-orders-empty">
                                    <ClipboardList size={42} />
                                    <h3>No orders found</h3>
                                    <p>
                                        {searchTerm
                                            ? "Try changing your search or filter."
                                            : "Orders for this restaurant will appear here."}
                                    </p>
                                </div>
                            ) : (
                                <table className="restaurant-orders-table">
                                    <thead>
                                        <tr>
                                            <th>Order</th>
                                            <th>Customer</th>
                                            <th>Items</th>
                                            <th>Order Date</th>
                                            <th>Amount</th>
                                            <th>Payment</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td>
                                                    <strong className="order-number">
                                                        #{order.id}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <span className="customer-id">
                                                        {order.customerId || "Customer"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="order-items-preview">
                                                        {(order.items || [])
                                                            .slice(0, 2)
                                                            .map((item) => (
                                                                <span key={item.id}>
                                                                    {item.quantity} × {item.itemName}
                                                                </span>
                                                            ))}

                                                        {order.items?.length > 2 && (
                                                            <small>
                                                                +{order.items.length - 2} more
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="order-date">
                                                        {formatDate(order.createdAt)}
                                                    </span>
                                                </td>

                                                <td>
                                                    <strong>
                                                        {formatCurrency(order.totalAmount)}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <span className={`payment-status payment-${order.paymentStatus?.toLowerCase()}`}>
                                                        {order.paymentStatus || "PENDING"}
                                                    </span>
                                                </td>

                                                <td>{renderStatus(order.status)}</td>

                                                <td>
                                                    <button
                                                        className="restaurant-orders-view-button"
                                                        onClick={() => setSelectedOrder(order)}
                                                        title="View order details"
                                                    >
                                                        <Eye size={17} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                    </div>
                </>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div
                    className="restaurant-orders-modal-overlay"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        className="restaurant-orders-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="restaurant-orders-modal-header">
                            <div>
                                <span>ORDER DETAILS</span>
                                <h2>Order #{selectedOrder.id}</h2>
                            </div>

                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="restaurant-orders-modal-close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="restaurant-orders-modal-body">

                            <div className="order-detail-status">
                                {renderStatus(selectedOrder.status)}
                                <span>
                                    {formatDate(selectedOrder.createdAt)}
                                </span>
                            </div>

                            <div className="order-detail-section">
                                <h3>Customer Information</h3>

                                <div className="order-detail-info">
                                    <span>Customer ID</span>
                                    <strong>
                                        {selectedOrder.customerId || "Not available"}
                                    </strong>
                                </div>

                                <div className="order-detail-info">
                                    <span>Delivery Address</span>
                                    <strong>
                                        <MapPin size={15} />
                                        {selectedOrder.deliveryAddress || "Not provided"}
                                    </strong>
                                </div>
                            </div>

                            <div className="order-detail-section">
                                <h3>Order Items</h3>

                                <div className="order-detail-items">
                                    {(selectedOrder.items || []).map((item) => (
                                        <div className="order-detail-item" key={item.id}>
                                            <div>
                                                <strong>{item.itemName}</strong>
                                                <span>
                                                    {item.quantity} × {formatCurrency(item.unitPrice)}
                                                </span>
                                            </div>

                                            <strong>
                                                {formatCurrency(item.subtotal)}
                                            </strong>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-detail-total">
                                    <span>Total Amount</span>
                                    <strong>
                                        {formatCurrency(selectedOrder.totalAmount)}
                                    </strong>
                                </div>
                            </div>

                            <div className="order-detail-section">
                                <h3>Payment Information</h3>

                                <div className="order-detail-info">
                                    <span>Payment Status</span>
                                    <strong>
                                        {selectedOrder.paymentStatus || "PENDING"}
                                    </strong>
                                </div>
                            </div>

                            {selectedOrder.specialInstructions && (
                                <div className="order-detail-section">
                                    <h3>Special Instructions</h3>
                                    <p className="order-special-instructions">
                                        {selectedOrder.specialInstructions}
                                    </p>
                                </div>
                            )}

                            <div className="order-detail-section">
                                <h3>Update Order Status</h3>

                                {getAvailableActions(selectedOrder).length ? (
                                    <div className="order-detail-actions">
                                        {getAvailableActions(selectedOrder).map((action) => (
                                            <button
                                                key={action.status}
                                                className={[
                                                    "order-action-button",
                                                    action.primary ? "primary" : "",
                                                    action.danger ? "danger" : ""
                                                ].join(" ")}
                                                disabled={updatingOrderId === selectedOrder.id}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        selectedOrder,
                                                        action.status
                                                    )
                                                }
                                            >
                                                {updatingOrderId === selectedOrder.id
                                                    ? "Updating..."
                                                    : action.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="order-no-actions">
                                        No further restaurant actions are available for this order.
                                    </p>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
