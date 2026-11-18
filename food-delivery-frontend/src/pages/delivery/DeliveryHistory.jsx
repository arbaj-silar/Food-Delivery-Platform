
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    History,
    Package,
    CheckCircle2,
    XCircle,
    Clock,
    CalendarDays,
    AlertCircle
} from "lucide-react";

import { getMyDeliveryHistory } from "../../services/deliveryService";
import "../../styles/delivery/DeliveryHistory.css";

const DeliveryHistory = () => {

    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [error, setError] = useState("");

    const loadHistory = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await getMyDeliveryHistory();

            setDeliveries(Array.isArray(response) ? response : []);

        } catch (err) {
            console.error("Delivery history loading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load delivery history."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const filteredDeliveries = useMemo(() => {
        return deliveries.filter((delivery) => {

            const orderId = String(delivery.orderId || "");
            const deliveryId = String(delivery.id || "");

            const matchesSearch =
                orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                deliveryId.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === "ALL" ||
                delivery.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [deliveries, searchTerm, statusFilter]);

    const completedCount = deliveries.filter(
        item => item.status === "DELIVERED" ||
                item.status === "COMPLETED"
    ).length;

    const rejectedCount = deliveries.filter(
        item => item.status === "REJECTED"
    ).length;

    const cancelledCount = deliveries.filter(
        item => item.status === "CANCELLED"
    ).length;

    const getStatusClass = (status) => {
        switch (status) {
            case "DELIVERED":
            case "COMPLETED":
                return "success";

            case "REJECTED":
            case "CANCELLED":
                return "danger";

            default:
                return "neutral";
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="delivery-history-page">

            <div className="delivery-history-header">

                <div>
                    <span className="delivery-history-eyebrow">
                        DELIVERY MANAGEMENT
                    </span>

                    <h1>Delivery History</h1>

                    <p>
                        Review your previous delivery assignments
                        and completed orders.
                    </p>
                </div>

                <button
                    className="delivery-history-refresh"
                    onClick={() => loadHistory(true)}
                    disabled={loading || refreshing}
                >
                    <RefreshCw
                        size={17}
                        className={refreshing ? "spinning" : ""}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>

            </div>

            <div className="delivery-history-stats">

                <div className="delivery-history-stat-card">
                    <div className="history-stat-icon purple">
                        <History size={21} />
                    </div>

                    <div>
                        <span>Total Records</span>
                        <h2>{deliveries.length}</h2>
                    </div>
                </div>

                <div className="delivery-history-stat-card">
                    <div className="history-stat-icon green">
                        <CheckCircle2 size={21} />
                    </div>

                    <div>
                        <span>Completed</span>
                        <h2>{completedCount}</h2>
                    </div>
                </div>

                <div className="delivery-history-stat-card">
                    <div className="history-stat-icon red">
                        <XCircle size={21} />
                    </div>

                    <div>
                        <span>Rejected</span>
                        <h2>{rejectedCount}</h2>
                    </div>
                </div>

                <div className="delivery-history-stat-card">
                    <div className="history-stat-icon orange">
                        <AlertCircle size={21} />
                    </div>

                    <div>
                        <span>Cancelled</span>
                        <h2>{cancelledCount}</h2>
                    </div>
                </div>

            </div>

            <div className="delivery-history-content">

                <div className="delivery-history-toolbar">

                    <div className="delivery-history-search">
                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search by order or delivery ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                </div>

                {error && (
                    <div className="delivery-history-error">
                        <AlertCircle size={19} />
                        {error}
                    </div>
                )}

                {loading ? (

                    <div className="delivery-history-loading">
                        <div className="history-loader"></div>
                        <p>Loading delivery history...</p>
                    </div>

                ) : filteredDeliveries.length === 0 ? (

                    <div className="delivery-history-empty">

                        <div className="history-empty-icon">
                            <Package size={35} />
                        </div>

                        <h3>
                            {deliveries.length === 0
                                ? "No delivery history yet"
                                : "No matching deliveries"}
                        </h3>

                        <p>
                            {deliveries.length === 0
                                ? "Your previous delivery assignments will appear here."
                                : "Try changing your search or status filter."}
                        </p>

                    </div>

                ) : (

                    <div className="delivery-history-table-wrapper">

                        <table className="delivery-history-table">

                            <thead>
                                <tr>
                                    <th>DELIVERY</th>
                                    <th>ORDER ID</th>
                                    <th>STATUS</th>
                                    <th>DELIVERY ADDRESS</th>
                                    <th>DATE</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredDeliveries.map((delivery) => (

                                    <tr key={delivery.id}>

                                        <td>
                                            <div className="history-delivery-id">
                                                <Package size={17} />
                                                #{delivery.id}
                                            </div>
                                        </td>

                                        <td>
                                            #{delivery.orderId || "—"}
                                        </td>

                                        <td>
                                            <span
                                                className={`history-status ${getStatusClass(
                                                    delivery.status
                                                )}`}
                                            >
                                                {delivery.status || "UNKNOWN"}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="history-address">
                                                {delivery.deliveryAddress ||
                                                 delivery.address ||
                                                 "Address unavailable"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="history-date">
                                                <CalendarDays size={15} />
                                                {formatDate(
                                                    delivery.completedAt ||
                                                    delivery.updatedAt ||
                                                    delivery.createdAt
                                                )}
                                            </div>
                                        </td>

                                    </tr>

                                ))}
                            </tbody>

                        </table>

                    </div>

                )}

                {!loading && filteredDeliveries.length > 0 && (
                    <div className="delivery-history-footer">
                        Showing {filteredDeliveries.length} of{" "}
                        {deliveries.length} delivery records
                    </div>
                )}

            </div>

        </div>
    );
};

export default DeliveryHistory;
