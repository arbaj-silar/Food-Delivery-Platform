
import { useCallback, useEffect, useMemo, useState } from "react";

import { getAllPayments } from "../../services/paymentService";
import "../../styles/admin/AdminPayments.css";

export default function AdminPayments() {
    const [payments, setPayments] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadPayments = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getAllPayments();

            setPayments(
                Array.isArray(response)
                    ? response
                    : Array.isArray(response?.content)
                        ? response.content
                        : []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load payment transactions."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    const getPaymentStatus = (payment) => {
        return String(
            payment.paymentStatus || payment.status || "UNKNOWN"
        ).toUpperCase();
    };

    const getStatusClass = (status) => {
        return String(status)
            .toLowerCase()
            .replaceAll("_", "-");
    };

    const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString();
    };

    const successfulPayments = payments.filter(
        payment => getPaymentStatus(payment) === "SUCCESS"
    );

    const pendingPayments = payments.filter(
        payment => getPaymentStatus(payment) === "PENDING"
    );

    const failedPayments = payments.filter(
        payment => getPaymentStatus(payment) === "FAILED"
    );

    const refundedPayments = payments.filter(
        payment => getPaymentStatus(payment) === "REFUNDED"
    );

    const totalAmount = payments.reduce((total, payment) => {
        if (getPaymentStatus(payment) !== "SUCCESS") {
            return total;
        }

        return total + Number(payment.amount || 0);
    }, 0);

    const filteredPayments = useMemo(() => {
        return payments.filter(payment => {
            const searchText = [
                payment.id,
                payment.orderId,
                payment.customerId,
                payment.transactionReference,
                payment.paymentMethod,
                payment.failureReason
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch = searchText.includes(
                search.toLowerCase()
            );

            const matchesStatus =
                statusFilter === "ALL" ||
                getPaymentStatus(payment) === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [payments, search, statusFilter]);

    if (loading) {
        return (
            <div className="admin-payment-loading">
                Loading payment transactions...
            </div>
        );
    }

    return (
        <div className="admin-payment-page">

            {/* Header */}

            <div className="admin-payment-header">
                <div>
                    <h1>Payment Management</h1>
                    <p>
                        Monitor payment transactions across FoodExpress.
                    </p>
                </div>

                <button
                    className="admin-payment-refresh"
                    onClick={loadPayments}
                >
                    ↻ Refresh
                </button>
            </div>

            {error && (
                <div className="admin-payment-error">
                    {error}
                </div>
            )}

            {/* Statistics */}

            <div className="admin-payment-stats">

                <div className="admin-payment-stat-card">
                    <span>Total Transactions</span>
                    <strong>{payments.length}</strong>
                    <small>All recorded payments</small>
                </div>

                <div className="admin-payment-stat-card">
                    <span>Successful Payments</span>
                    <strong>{successfulPayments.length}</strong>
                    <small>Successfully completed</small>
                </div>

                <div className="admin-payment-stat-card">
                    <span>Pending Payments</span>
                    <strong>{pendingPayments.length}</strong>
                    <small>Awaiting completion</small>
                </div>

                <div className="admin-payment-stat-card">
                    <span>Failed Payments</span>
                    <strong>{failedPayments.length}</strong>
                    <small>Unsuccessful transactions</small>
                </div>

                <div className="admin-payment-stat-card">
                    <span>Refunded Payments</span>
                    <strong>{refundedPayments.length}</strong>
                    <small>Refunded transactions</small>
                </div>

                <div className="admin-payment-stat-card revenue">
                    <span>Successful Payment Amount</span>
                    <strong>₹{formatAmount(totalAmount)}</strong>
                    <small>Based on successful transactions</small>
                </div>

            </div>

            {/* Transactions */}

            <section className="admin-payment-section">

                <div className="admin-payment-section-header">
                    <div>
                        <h2>Payment Transactions</h2>
                        <p>
                            Search and review individual payment records.
                        </p>
                    </div>

                    <span className="admin-payment-count">
                        {filteredPayments.length} Records
                    </span>
                </div>

                <div className="admin-payment-toolbar">

                    <input
                        type="text"
                        placeholder="Search order, customer, transaction reference..."
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                    />

                    <select
                        value={statusFilter}
                        onChange={event =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAILED">Failed</option>
                        <option value="REFUNDED">Refunded</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                </div>

                {filteredPayments.length === 0 ? (
                    <div className="admin-payment-empty">
                        No payment transactions found.
                    </div>
                ) : (
                    <div className="admin-payment-table-wrapper">

                        <table className="admin-payment-table">

                            <thead>
                                <tr>
                                    <th>Payment ID</th>
                                    <th>Order ID</th>
                                    <th>Customer ID</th>
                                    <th>Amount</th>
                                    <th>Payment Method</th>
                                    <th>Transaction Reference</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPayments.map((payment, index) => {
                                    const status = getPaymentStatus(payment);

                                    return (
                                        <tr key={payment.id ?? index}>

                                            <td>
                                                <strong>
                                                    #{payment.id ?? "—"}
                                                </strong>
                                            </td>

                                            <td>
                                                #{payment.orderId ?? "—"}
                                            </td>

                                            <td>
                                                #{payment.customerId ?? "—"}
                                            </td>

                                            <td>
                                                <strong>
                                                    ₹{formatAmount(payment.amount)}
                                                </strong>
                                            </td>

                                            <td>
                                                {payment.paymentMethod || "—"}
                                            </td>

                                            <td className="admin-payment-reference">
                                                {payment.transactionReference || "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-payment-status ${getStatusClass(status)}`}
                                                >
                                                    {status}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className="admin-payment-view-btn"
                                                    onClick={() =>
                                                        setSelectedPayment(payment)
                                                    }
                                                >
                                                    View
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

            {/* Payment Details Modal */}

            {selectedPayment && (
                <div
                    className="admin-payment-modal-overlay"
                    onClick={() => setSelectedPayment(null)}
                >
                    <div
                        className="admin-payment-modal"
                        onClick={event => event.stopPropagation()}
                    >

                        <div className="admin-payment-modal-header">
                            <h2>Payment Details</h2>

                            <button
                                onClick={() => setSelectedPayment(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-payment-details">

                            <div>
                                <span>Payment ID</span>
                                <strong>
                                    #{selectedPayment.id ?? "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Order ID</span>
                                <strong>
                                    #{selectedPayment.orderId ?? "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Customer ID</span>
                                <strong>
                                    #{selectedPayment.customerId ?? "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Amount</span>
                                <strong>
                                    ₹{formatAmount(selectedPayment.amount)}
                                </strong>
                            </div>

                            <div>
                                <span>Payment Method</span>
                                <strong>
                                    {selectedPayment.paymentMethod || "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Transaction Reference</span>
                                <strong>
                                    {selectedPayment.transactionReference || "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Payment Status</span>
                                <strong>
                                    {getPaymentStatus(selectedPayment)}
                                </strong>
                            </div>

                            <div>
                                <span>Created At</span>
                                <strong>
                                    {formatDate(
                                        selectedPayment.createdAt
                                    )}
                                </strong>
                            </div>

                            {selectedPayment.failureReason && (
                                <div className="admin-payment-failure">
                                    <span>Failure Reason</span>
                                    <p>
                                        {selectedPayment.failureReason}
                                    </p>
                                </div>
                            )}

                        </div>

                        <button
                            className="admin-payment-close-btn"
                            onClick={() => setSelectedPayment(null)}
                        >
                            Close
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
}
