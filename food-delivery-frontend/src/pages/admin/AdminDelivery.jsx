
import { useCallback, useEffect, useState } from "react";

import {
    getAllDeliveries,
    assignDelivery,
    getReadyForDeliveryOrders,
    getAvailablePartners,
    getAllPartners,
    updatePartnerStatus
} from "../../services/adminService";

import "../../styles/admin/AdminDelivery.css";

export default function AdminDelivery() {
    const [readyOrders, setReadyOrders] = useState([]);
    const [availablePartners, setAvailablePartners] = useState([]);
    const [allPartners, setAllPartners] = useState([]);
    const [deliveries, setDeliveries] = useState([]);

    const [selectedPartners, setSelectedPartners] = useState({});
    const [partnerSearch, setPartnerSearch] = useState("");
    const [deliverySearch, setDeliverySearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadDeliveryData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const results = await Promise.allSettled([
                getReadyForDeliveryOrders(),
                getAvailablePartners(),
                getAllPartners(),
                getAllDeliveries()
            ]);

            const [
                ordersResult,
                availableResult,
                partnersResult,
                deliveriesResult
            ] = results;

            if (ordersResult.status === "fulfilled") {
                setReadyOrders(
                    Array.isArray(ordersResult.value)
                        ? ordersResult.value
                        : []
                );
            } else {
                setReadyOrders([]);
            }

            if (availableResult.status === "fulfilled") {
                setAvailablePartners(
                    Array.isArray(availableResult.value)
                        ? availableResult.value
                        : []
                );
            } else {
                setAvailablePartners([]);
            }

            if (partnersResult.status === "fulfilled") {
                setAllPartners(
                    Array.isArray(partnersResult.value)
                        ? partnersResult.value
                        : []
                );
            } else {
                setAllPartners([]);
            }

            if (deliveriesResult.status === "fulfilled") {
                setDeliveries(
                    Array.isArray(deliveriesResult.value)
                        ? deliveriesResult.value
                        : []
                );
            } else {
                setDeliveries([]);
            }

            const failedRequests = results.filter(
                result => result.status === "rejected"
            );

            if (failedRequests.length === results.length) {
                setError("Unable to load delivery management data.");
            } else if (failedRequests.length > 0) {
                setError(
                    "Some delivery information could not be loaded. Check the affected service."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load delivery information."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDeliveryData();
    }, [loadDeliveryData]);

    const handlePartnerSelection = (orderId, partnerId) => {
        setSelectedPartners(previous => ({
            ...previous,
            [orderId]: partnerId
        }));
    };


    const handleAssignDelivery = async (orderId) => {
        const partnerId = selectedPartners[orderId];

        if (!partnerId) {
            setError("Please select a delivery partner first.");
            setSuccess("");
            return;
        }

        const selectedPartner = availablePartners.find(
            partner => String(partner.id) === String(partnerId)
        );

        const partnerName = selectedPartner?.fullName || `Partner #${partnerId}`;

        const confirmed = window.confirm(
            `Are you sure you want to assign Order #${orderId} to ${partnerName}?`
        );

        if (!confirmed) {
            return;
        }

        setActionLoading(`assign-${orderId}`);
        setError("");
        setSuccess("");

        try {
            await assignDelivery(orderId, partnerId);

            setSuccess(
                `Order #${orderId} successfully assigned to ${partnerName}.`
            );

            setSelectedPartners(previous => {
                const updated = { ...previous };
                delete updated[orderId];
                return updated;
            });

            await loadDeliveryData();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to assign delivery. Please try again."
            );
        } finally {
            setActionLoading(null);
        }
    };


    const handlePartnerStatus = async (partner) => {
        const partnerId = partner.id;
        const nextStatus = !partner.active;

        // Prevent deactivating a partner who is delivering an order
        if (!nextStatus && partner.availabilityStatus === "ON_DELIVERY") {
            setError(
                `${partner.fullName} cannot be deactivated while handling a delivery.`
            );
            setSuccess("");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to ${nextStatus ? "activate" : "deactivate"} ${partner.fullName}?`
        );

        if (!confirmed) {
            return;
        }

        setActionLoading(`partner-${partnerId}`);
        setError("");
        setSuccess("");

        try {
            await updatePartnerStatus(partnerId, nextStatus);

            setSuccess(
                `${partner.fullName || "Delivery partner"} has been ${nextStatus ? "activated" : "deactivated"
                }.`
            );

            await loadDeliveryData();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update delivery partner status."
            );
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString();
    };

    const getStatusClass = (status) => {
        return String(status || "UNKNOWN")
            .toLowerCase()
            .replaceAll("_", "-");
    };

    const filteredPartners = allPartners.filter(partner => {
        const search = partnerSearch.toLowerCase().trim();

        return (
            String(partner.id || "").toLowerCase().includes(search) ||
            (partner.fullName || "").toLowerCase().includes(search) ||
            (partner.phone || "").toLowerCase().includes(search)
        );
    });

    const filteredDeliveries = deliveries.filter(delivery => {
        const search = deliverySearch.toLowerCase().trim();

        const deliveryId = String(delivery.id || "");
        const orderId = String(
            delivery.orderId ?? delivery.order?.id ?? ""
        );
        const partnerId = String(
            delivery.deliveryPartnerId ??
            delivery.partnerId ??
            delivery.deliveryPartner?.id ??
            ""
        );
        const status = String(
            delivery.status || delivery.deliveryStatus || ""
        );

        return (
            deliveryId.includes(search) ||
            orderId.includes(search) ||
            partnerId.includes(search) ||
            status.toLowerCase().includes(search)
        );
    });

    if (loading) {
        return (
            <div className="admin-delivery-loading">
                Loading delivery management...
            </div>
        );
    }

    return (
        <div className="admin-delivery-page">

            <div className="admin-delivery-header">
                <div>
                    <h1>Delivery Management</h1>
                    <p>
                        Manage delivery assignments, partners and delivery
                        activity.
                    </p>
                </div>

                <button
                    className="admin-delivery-refresh"
                    onClick={loadDeliveryData}
                    disabled={loading}
                >
                    ↻ Refresh
                </button>
            </div>

            {error && (
                <div className="admin-delivery-alert error">
                    {error}
                </div>
            )}

            {success && (
                <div className="admin-delivery-alert success">
                    {success}
                </div>
            )}

            {/* Summary Cards */}

            <div className="admin-delivery-stats">

                <div className="admin-delivery-stat-card">
                    <span>Ready Orders</span>
                    <strong>{readyOrders.length}</strong>
                    <small>Waiting for assignment</small>
                </div>

                <div className="admin-delivery-stat-card">
                    <span>Available Partners</span>
                    <strong>{availablePartners.length}</strong>
                    <small>Ready to accept deliveries</small>
                </div>

                <div className="admin-delivery-stat-card">
                    <span>Total Partners</span>
                    <strong>{allPartners.length}</strong>
                    <small>Registered delivery partners</small>
                </div>

                <div className="admin-delivery-stat-card">
                    <span>Total Deliveries</span>
                    <strong>{deliveries.length}</strong>
                    <small>Recorded delivery assignments</small>
                </div>

            </div>

            {/* Ready Orders */}

            <section className="admin-delivery-section">

                <div className="admin-delivery-section-header">
                    <div>
                        <h2>Orders Ready for Delivery</h2>
                        <p>Assign available delivery partners to orders.</p>
                    </div>

                    <span className="admin-delivery-count">
                        {readyOrders.length} Orders
                    </span>
                </div>

                {readyOrders.length === 0 ? (
                    <div className="admin-delivery-empty">
                        No orders are currently waiting for delivery assignment.
                    </div>
                ) : (
                    <div className="admin-delivery-table-wrapper">
                        <table className="admin-delivery-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Delivery Address</th>
                                    <th>Amount</th>
                                    <th>Assign Partner</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {readyOrders.map((order, index) => {
                                    const orderId = order.id ?? order.orderId;

                                    return (
                                        <tr key={orderId ?? index}>
                                            <td>
                                                <strong>#{orderId ?? "—"}</strong>
                                            </td>

                                            <td>
                                                {order.customerName ||
                                                    order.customerFullName ||
                                                    order.customerEmail ||
                                                    "—"}
                                            </td>

                                            <td className="admin-delivery-address">
                                                {order.deliveryAddress || "—"}
                                            </td>

                                            <td>
                                                ₹{Number(
                                                    order.totalAmount ??
                                                    order.totalPrice ??
                                                    order.amount ??
                                                    0
                                                ).toFixed(2)}
                                            </td>

                                            <td>
                                                <select
                                                    value={
                                                        selectedPartners[orderId] || ""
                                                    }
                                                    onChange={(event) =>
                                                        handlePartnerSelection(
                                                            orderId,
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        {availablePartners.length === 0
                                                            ? "No Available Partners"
                                                            : "Select Partner"}
                                                    </option>

                                                    {availablePartners.map(partner => (
                                                        <option
                                                            key={partner.id}
                                                            value={partner.id}
                                                        >
                                                            {partner.fullName} (#{partner.id})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>
                                                <button
                                                    className="admin-delivery-assign-btn"
                                                    disabled={
                                                        !selectedPartners[orderId] ||
                                                        availablePartners.length === 0 ||
                                                        actionLoading === `assign-${orderId}`
                                                    }
                                                    onClick={() =>
                                                        handleAssignDelivery(orderId)
                                                    }
                                                >
                                                    {actionLoading === `assign-${orderId}`
                                                        ? "Assigning..."
                                                        : "Assign"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

            </section>

            {/* Delivery Partners */}

            <section className="admin-delivery-section">

                <div className="admin-delivery-section-header">
                    <div>
                        <h2>Delivery Partners</h2>
                        <p>View and manage registered delivery partners.</p>
                    </div>

                    <input
                        type="text"
                        className="admin-delivery-search"
                        placeholder="Search by name, phone or ID..."
                        value={partnerSearch}
                        onChange={(event) => setPartnerSearch(event.target.value)}
                    />
                </div>

                {allPartners.length === 0 ? (
                    <div className="admin-delivery-empty">
                        No delivery partners found.
                    </div>
                ) : filteredPartners.length === 0 ? (
                    <div className="admin-delivery-empty">
                        No delivery partners match your search.
                    </div>
                ) : (
                    <div className="admin-delivery-table-wrapper">
                        <table className="admin-delivery-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Partner Name</th>
                                    <th>Phone</th>
                                    <th>Vehicle</th>
                                    <th>Availability</th>
                                    <th>Account Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPartners.map(partner => (
                                    <tr key={partner.id}>
                                        <td>#{partner.id}</td>

                                        <td>
                                            <strong>
                                                {partner.fullName || "—"}
                                            </strong>
                                        </td>

                                        <td>{partner.phone || "—"}</td>

                                        <td>
                                            {partner.vehicleType ||
                                                partner.vehicle ||
                                                "—"}
                                        </td>

                                        <td>
                                            <span
                                                className={`admin-delivery-status ${getStatusClass(
                                                    partner.availabilityStatus
                                                )}`}
                                            >
                                                {partner.availabilityStatus ||
                                                    "UNKNOWN"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`admin-delivery-status ${partner.active
                                                    ? "active"
                                                    : "inactive"
                                                    }`}
                                            >
                                                {partner.active
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                className={
                                                    partner.active
                                                        ? "admin-delivery-deactivate-btn"
                                                        : "admin-delivery-activate-btn"
                                                }
                                                disabled={
                                                    actionLoading ===
                                                    `partner-${partner.id}`
                                                }
                                                onClick={() =>
                                                    handlePartnerStatus(partner)
                                                }
                                            >
                                                {actionLoading ===
                                                    `partner-${partner.id}`
                                                    ? "Updating..."
                                                    : partner.active
                                                        ? "Deactivate"
                                                        : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </section>

            {/* Delivery History */}

            <section className="admin-delivery-section">

                <div className="admin-delivery-section-header">
                    <div>
                        <h2>Delivery History</h2>
                        <p>Review delivery assignments recorded in the system.</p>
                    </div>

                    <input
                        type="text"
                        className="admin-delivery-search"
                        placeholder="Search delivery, order, partner or status..."
                        value={deliverySearch}
                        onChange={(event) => setDeliverySearch(event.target.value)}
                    />
                </div>

                {deliveries.length === 0 ? (
                    <div className="admin-delivery-empty">
                        No delivery history available.
                    </div>
                ) : filteredDeliveries.length === 0 ? (
                    <div className="admin-delivery-empty">
                        No delivery records match your search.
                    </div>
                ) : (
                    <div className="admin-delivery-table-wrapper">
                        <table className="admin-delivery-table">
                            <thead>
                                <tr>
                                    <th>Delivery ID</th>
                                    <th>Order ID</th>
                                    <th>Partner ID</th>
                                    <th>Status</th>
                                    <th>Assigned At</th>
                                    <th>Delivered At</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredDeliveries.map((delivery, index) => (
                                    <tr key={delivery.id ?? index}>
                                        <td>#{delivery.id ?? "—"}</td>

                                        <td>
                                            #{delivery.orderId ??
                                                delivery.order?.id ??
                                                "—"}
                                        </td>

                                        <td>
                                            #{delivery.deliveryPartnerId ??
                                                delivery.partnerId ??
                                                delivery.deliveryPartner?.id ??
                                                "—"}
                                        </td>

                                        <td>
                                            <span
                                                className={`admin-delivery-status ${getStatusClass(
                                                    delivery.status ||
                                                    delivery.deliveryStatus
                                                )}`}
                                            >
                                                {delivery.status ||
                                                    delivery.deliveryStatus ||
                                                    "UNKNOWN"}
                                            </span>
                                        </td>

                                        <td>
                                            {formatDate(
                                                delivery.assignedAt ||
                                                delivery.createdAt
                                            )}
                                        </td>

                                        <td>
                                            {formatDate(delivery.deliveredAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </section>

        </div>
    );
}
