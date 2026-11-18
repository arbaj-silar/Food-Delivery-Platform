
import { useCallback, useEffect, useMemo, useState } from "react";

import { getAllNotifications } from "../../services/notificationService";

import "../../styles/admin/AdminNotifications.css";

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getAllNotifications();

            setNotifications(
                Array.isArray(response)
                    ? response
                    : Array.isArray(response?.content)
                        ? response.content
                        : []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load notifications."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const getReadStatus = (notification) => {
        return notification.read ??
            notification.isRead ??
            notification.readStatus ??
            false;
    };

    const filteredNotifications = useMemo(() => {
        return notifications.filter(notification => {
            const searchText = [
                notification.id,
                notification.userId,
                notification.userName,
                notification.title,
                notification.message,
                notification.type,
                notification.recipientEmail
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch = searchText.includes(
                search.toLowerCase()
            );

            const isRead = getReadStatus(notification);

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "READ" && isRead) ||
                (statusFilter === "UNREAD" && !isRead);

            return matchesSearch && matchesStatus;
        });
    }, [notifications, search, statusFilter]);

    const readCount = notifications.filter(
        notification => getReadStatus(notification)
    ).length;

    const unreadCount = notifications.length - readCount;

    const formatDate = (dateValue) => {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString();
    };

    const getReadLabel = (notification) => {
        return getReadStatus(notification) ? "READ" : "UNREAD";
    };

    if (loading) {
        return (
            <div className="admin-notification-loading">
                Loading notifications...
            </div>
        );
    }

    return (
        <div className="admin-notification-page">

            <div className="admin-notification-header">
                <div>
                    <h1>Notification Management</h1>
                    <p>
                        Monitor notifications sent across the FoodExpress
                        platform.
                    </p>
                </div>

                <button
                    className="admin-notification-refresh"
                    onClick={loadNotifications}
                >
                    ↻ Refresh
                </button>
            </div>

            {error && (
                <div className="admin-notification-error">
                    {error}
                </div>
            )}

            {/* Statistics */}

            <div className="admin-notification-stats">

                <div className="admin-notification-stat-card">
                    <span>Total Notifications</span>
                    <strong>{notifications.length}</strong>
                </div>

                <div className="admin-notification-stat-card">
                    <span>Read Notifications</span>
                    <strong>{readCount}</strong>
                </div>

                <div className="admin-notification-stat-card">
                    <span>Unread Notifications</span>
                    <strong>{unreadCount}</strong>
                </div>

                <div className="admin-notification-stat-card">
                    <span>Read Rate</span>
                    <strong>
                        {notifications.length
                            ? `${Math.round(
                                (readCount / notifications.length) * 100
                            )}%`
                            : "0%"}
                    </strong>
                </div>

            </div>

            {/* Notification List */}

            <section className="admin-notification-section">

                <div className="admin-notification-section-header">
                    <div>
                        <h2>All Notifications</h2>
                        <p>
                            Search and review platform notification records.
                        </p>
                    </div>

                    <span className="admin-notification-count">
                        {filteredNotifications.length} Records
                    </span>
                </div>

                <div className="admin-notification-toolbar">

                    <input
                        type="text"
                        placeholder="Search by title, message, user or ID..."
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                    />

                    <select
                        value={statusFilter}
                        onChange={event =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="ALL">All Notifications</option>
                        <option value="READ">Read</option>
                        <option value="UNREAD">Unread</option>
                    </select>

                </div>

                {filteredNotifications.length === 0 ? (
                    <div className="admin-notification-empty">
                        No notifications found.
                    </div>
                ) : (
                    <div className="admin-notification-table-wrapper">
                        <table className="admin-notification-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Recipient</th>
                                    <th>Title</th>
                                    <th>Message</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredNotifications.map(
                                    (notification, index) => (
                                        <tr key={notification.id ?? index}>

                                            <td>
                                                #{notification.id ?? "—"}
                                            </td>

                                            <td>
                                                {notification.userName ||
                                                    notification.recipientEmail ||
                                                    notification.userId ||
                                                    "—"}
                                            </td>

                                            <td>
                                                <strong>
                                                    {notification.title || "—"}
                                                </strong>
                                            </td>

                                            <td className="admin-notification-message">
                                                {notification.message || "—"}
                                            </td>

                                            <td>
                                                {notification.type ||
                                                    notification.notificationType ||
                                                    "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-notification-status ${
                                                        getReadStatus(notification)
                                                            ? "read"
                                                            : "unread"
                                                    }`}
                                                >
                                                    {getReadLabel(notification)}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(
                                                    notification.createdAt ||
                                                    notification.sentAt
                                                )}
                                            </td>

                                            <td>
                                                <button
                                                    className="admin-notification-view-btn"
                                                    onClick={() =>
                                                        setSelectedNotification(
                                                            notification
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>
                                            </td>

                                        </tr>
                                    )
                                )}
                            </tbody>

                        </table>
                    </div>
                )}

            </section>

            {/* Notification Details Modal */}

            {selectedNotification && (
                <div
                    className="admin-notification-modal-overlay"
                    onClick={() => setSelectedNotification(null)}
                >
                    <div
                        className="admin-notification-modal"
                        onClick={event => event.stopPropagation()}
                    >

                        <div className="admin-notification-modal-header">
                            <h2>Notification Details</h2>

                            <button
                                onClick={() =>
                                    setSelectedNotification(null)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-notification-details">

                            <div>
                                <span>Notification ID</span>
                                <strong>
                                    #{selectedNotification.id ?? "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Recipient</span>
                                <strong>
                                    {selectedNotification.userName ||
                                        selectedNotification.recipientEmail ||
                                        selectedNotification.userId ||
                                        "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Title</span>
                                <strong>
                                    {selectedNotification.title || "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Type</span>
                                <strong>
                                    {selectedNotification.type ||
                                        selectedNotification.notificationType ||
                                        "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Status</span>
                                <strong>
                                    {getReadLabel(selectedNotification)}
                                </strong>
                            </div>

                            <div>
                                <span>Created At</span>
                                <strong>
                                    {formatDate(
                                        selectedNotification.createdAt ||
                                        selectedNotification.sentAt
                                    )}
                                </strong>
                            </div>

                            <div className="admin-notification-full-message">
                                <span>Message</span>
                                <p>
                                    {selectedNotification.message || "No message"}
                                </p>
                            </div>

                        </div>

                        <button
                            className="admin-notification-close-btn"
                            onClick={() => setSelectedNotification(null)}
                        >
                            Close
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
}
