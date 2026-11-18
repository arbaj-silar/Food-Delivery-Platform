
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    Store,
    CheckCircle,
    XCircle,
    Eye,
    Power,
    RotateCcw,
    MapPin,
    Phone,
    Mail,
    CalendarDays,
    X,
    Utensils,
    Clock,
    Building2
} from "lucide-react";

import {
    getAllRestaurants,
    approveRestaurant,
    rejectRestaurant,
    updateRestaurantStatus,
    reopenRestaurant,
    getAdminRestaurantById
} from "../../services/restaurantService";

import "../../styles/admin/AdminRestaurants.css";

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getApprovalStatus(restaurant) {
    return String(
        restaurant.approvalStatus ||
        restaurant.status ||
        "UNKNOWN"
    ).toUpperCase();
}

function getStatusClass(status) {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "approved") return "approved";
    if (normalized === "rejected") return "rejected";
    if (normalized === "pending") return "pending";

    return "unknown";
}

export default function AdminRestaurants() {
    const [restaurants, setRestaurants] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const loadRestaurants = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getAllRestaurants();

            setRestaurants(
                Array.isArray(response)
                    ? response
                    : response?.content || []
            );
        } catch (err) {
            console.error("Failed to load restaurants:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load restaurant records."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRestaurants();
    }, [loadRestaurants]);

    const filteredRestaurants = useMemo(() => {
        const query = search.trim().toLowerCase();

        return restaurants.filter((restaurant) => {
            const matchesSearch =
                !query ||
                String(restaurant.name || "").toLowerCase().includes(query) ||
                String(restaurant.email || "").toLowerCase().includes(query) ||
                String(restaurant.city || "").toLowerCase().includes(query) ||
                String(restaurant.cuisineType || "").toLowerCase().includes(query);

            const approvalStatus = getApprovalStatus(restaurant);

            const matchesStatus =
                statusFilter === "ALL" ||
                approvalStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [restaurants, search, statusFilter]);

    const counts = useMemo(() => ({
        total: restaurants.length,
        pending: restaurants.filter(
            (item) => getApprovalStatus(item) === "PENDING"
        ).length,
        approved: restaurants.filter(
            (item) => getApprovalStatus(item) === "APPROVED"
        ).length,
        rejected: restaurants.filter(
            (item) => getApprovalStatus(item) === "REJECTED"
        ).length,
        active: restaurants.filter(
            (item) =>
                getApprovalStatus(item) === "APPROVED" &&
                item.active === true
        ).length
    }), [restaurants]);

    const handleApprove = async (restaurant) => {
        if (!window.confirm(`Approve ${restaurant.name}?`)) return;

        try {
            setActionLoading(true);

            await approveRestaurant(restaurant.id);

            await loadRestaurants();

            if (selectedRestaurant?.id === restaurant.id) {
                const updated = await getAdminRestaurantById(restaurant.id);
                setSelectedRestaurant(updated);
            }
        } catch (err) {
            console.error("Restaurant approval failed:", err);

            alert(
                err.response?.data?.message ||
                "Unable to approve this restaurant."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (restaurant) => {
        if (!window.confirm(`Reject ${restaurant.name}?`)) return;

        try {
            setActionLoading(true);

            await rejectRestaurant(restaurant.id);

            await loadRestaurants();

            if (selectedRestaurant?.id === restaurant.id) {
                const updated = await getAdminRestaurantById(restaurant.id);
                setSelectedRestaurant(updated);
            }
        } catch (err) {
            console.error("Restaurant rejection failed:", err);

            alert(
                err.response?.data?.message ||
                "Unable to reject this restaurant."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (restaurant) => {
        const nextActive = restaurant.active !== true;

        const action = nextActive ? "activate" : "deactivate";

        if (!window.confirm(`${action} ${restaurant.name}?`)) return;

        try {
            setActionLoading(true);

            await updateRestaurantStatus(restaurant.id, nextActive);

            await loadRestaurants();

            if (selectedRestaurant?.id === restaurant.id) {
                const updated = await getAdminRestaurantById(restaurant.id);
                setSelectedRestaurant(updated);
            }
        } catch (err) {
            console.error("Restaurant status update failed:", err);

            alert(
                err.response?.data?.message ||
                `Unable to ${action} this restaurant.`
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleReopen = async (restaurant) => {
        if (!window.confirm(`Reopen ${restaurant.name} for review?`)) return;

        try {
            setActionLoading(true);

            await reopenRestaurant(restaurant.id);

            await loadRestaurants();

            if (selectedRestaurant?.id === restaurant.id) {
                const updated = await getAdminRestaurantById(restaurant.id);
                setSelectedRestaurant(updated);
            }
        } catch (err) {
            console.error("Restaurant reopening failed:", err);

            alert(
                err.response?.data?.message ||
                "Unable to reopen this restaurant."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewDetails = async (restaurantId) => {
        try {
            setDetailsLoading(true);
            setSelectedRestaurant(null);

            const response = await getAdminRestaurantById(restaurantId);

            setSelectedRestaurant(response);
        } catch (err) {
            console.error("Failed to load restaurant details:", err);

            alert(
                err.response?.data?.message ||
                "Unable to load restaurant details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const statusLabel = (restaurant) => {
        const status = getApprovalStatus(restaurant);

        return status.charAt(0) + status.slice(1).toLowerCase();
    };

    return (
        <div className="admin-restaurants-page">

            {/* PAGE HEADER */}
            <div className="admin-restaurants-header">
                <div>
                    <span className="admin-restaurants-eyebrow">
                        RESTAURANT OPERATIONS
                    </span>

                    <h2>Restaurant Management</h2>

                    <p>
                        Review applications and manage restaurant accounts.
                    </p>
                </div>

                <button
                    className="admin-restaurants-refresh"
                    onClick={loadRestaurants}
                    disabled={loading || actionLoading}
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>
            </div>

            {/* SUMMARY */}
            <div className="admin-restaurants-summary">

                <div className="admin-restaurants-summary-card">
                    <div className="restaurant-summary-icon total">
                        <Store size={21} />
                    </div>
                    <div>
                        <span>Total Restaurants</span>
                        <strong>{counts.total}</strong>
                    </div>
                </div>

                <div className="admin-restaurants-summary-card">
                    <div className="restaurant-summary-icon pending">
                        <Clock size={21} />
                    </div>
                    <div>
                        <span>Pending Review</span>
                        <strong>{counts.pending}</strong>
                    </div>
                </div>

                <div className="admin-restaurants-summary-card">
                    <div className="restaurant-summary-icon approved">
                        <CheckCircle size={21} />
                    </div>
                    <div>
                        <span>Approved</span>
                        <strong>{counts.approved}</strong>
                    </div>
                </div>

                <div className="admin-restaurants-summary-card">
                    <div className="restaurant-summary-icon active">
                        <Power size={21} />
                    </div>
                    <div>
                        <span>Active</span>
                        <strong>{counts.active}</strong>
                    </div>
                </div>

            </div>

            {/* FILTERS */}
            <div className="admin-restaurants-toolbar">

                <div className="admin-restaurants-search">
                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search restaurant, email, city or cuisine..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by approval status"
                >
                    <option value="ALL">All Applications</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* ERROR */}
            {error && (
                <div className="admin-restaurants-error">
                    {error}
                    <button onClick={loadRestaurants}>Try again</button>
                </div>
            )}

            {/* RESTAURANT TABLE */}
            <div className="admin-restaurants-table-card">

                <div className="admin-restaurants-table-heading">
                    <div>
                        <h3>Restaurant Records</h3>
                        <p>
                            {filteredRestaurants.length} restaurant(s) displayed
                        </p>
                    </div>

                    <span>
                        {filteredRestaurants.length} results
                    </span>
                </div>

                {loading ? (
                    <div className="admin-restaurants-loading">
                        <RefreshCw className="admin-restaurants-spinner" size={25} />
                        <p>Loading restaurants...</p>
                    </div>
                ) : filteredRestaurants.length === 0 ? (
                    <div className="admin-restaurants-empty">
                        <Store size={36} />
                        <h3>No restaurants found</h3>
                        <p>Try changing your search or status filter.</p>
                    </div>
                ) : (
                    <div className="admin-restaurants-table-wrapper">
                        <table className="admin-restaurants-table">
                            <thead>
                                <tr>
                                    <th>Restaurant</th>
                                    <th>Location</th>
                                    <th>Cuisine</th>
                                    <th>Approval</th>
                                    <th>Account</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredRestaurants.map((restaurant) => {
                                    const approval = getApprovalStatus(restaurant);

                                    return (
                                        <tr key={restaurant.id}>
                                            <td>
                                                <div className="admin-restaurant-identity">
                                                    <div className="admin-restaurant-avatar">
                                                        <Store size={17} />
                                                    </div>

                                                    <div>
                                                        <strong>{restaurant.name}</strong>
                                                        <span>#{restaurant.id}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="admin-restaurant-location">
                                                    <MapPin size={13} />
                                                    {restaurant.city || restaurant.address || "—"}
                                                </span>
                                            </td>

                                            <td>
                                                {restaurant.cuisineType || "—"}
                                            </td>

                                            <td>
                                                <span className={`admin-restaurant-approval ${getStatusClass(approval)}`}>
                                                    {statusLabel(restaurant)}
                                                </span>
                                            </td>

                                            <td>
                                                {approval === "APPROVED" ? (
                                                    <span className={`admin-restaurant-account ${restaurant.active ? "active" : "inactive"}`}>
                                                        {restaurant.active ? "Active" : "Inactive"}
                                                    </span>
                                                ) : (
                                                    <span className="admin-restaurant-account unavailable">
                                                        Not available
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="admin-restaurant-actions">

                                                    <button
                                                        title="View details"
                                                        onClick={() => handleViewDetails(restaurant.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {approval === "PENDING" && (
                                                        <>
                                                            <button
                                                                title="Approve"
                                                                className="approve"
                                                                onClick={() => handleApprove(restaurant)}
                                                                disabled={actionLoading}
                                                            >
                                                                <CheckCircle size={15} />
                                                            </button>

                                                            <button
                                                                title="Reject"
                                                                className="reject"
                                                                onClick={() => handleReject(restaurant)}
                                                                disabled={actionLoading}
                                                            >
                                                                <XCircle size={15} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {approval === "APPROVED" && (
                                                        <button
                                                            title={restaurant.active ? "Deactivate" : "Activate"}
                                                            className={restaurant.active ? "deactivate" : "approve"}
                                                            onClick={() => handleToggleStatus(restaurant)}
                                                            disabled={actionLoading}
                                                        >
                                                            <Power size={15} />
                                                        </button>
                                                    )}

                                                    {approval === "REJECTED" && (
                                                        <button
                                                            title="Reopen application"
                                                            className="reopen"
                                                            onClick={() => handleReopen(restaurant)}
                                                            disabled={actionLoading}
                                                        >
                                                            <RotateCcw size={15} />
                                                        </button>
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* DETAILS MODAL */}
            {(selectedRestaurant || detailsLoading) && (
                <div
                    className="admin-restaurants-modal-overlay"
                    onClick={() => {
                        if (!detailsLoading) setSelectedRestaurant(null);
                    }}
                >
                    <div
                        className="admin-restaurants-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="admin-restaurants-modal-header">
                            <div>
                                <span>RESTAURANT INFORMATION</span>
                                <h3>Restaurant Details</h3>
                            </div>

                            <button
                                onClick={() => setSelectedRestaurant(null)}
                                disabled={detailsLoading}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {detailsLoading ? (
                            <div className="admin-restaurants-loading">
                                <RefreshCw className="admin-restaurants-spinner" />
                                <p>Loading restaurant details...</p>
                            </div>
                        ) : selectedRestaurant && (
                            <>
                                <div className="admin-restaurants-profile">
                                    <div className="admin-restaurants-profile-icon">
                                        <Utensils size={27} />
                                    </div>

                                    <h3>{selectedRestaurant.name}</h3>

                                    <p>
                                        {selectedRestaurant.cuisineType || "Restaurant"}
                                    </p>

                                    <span className={`admin-restaurant-approval ${getStatusClass(getApprovalStatus(selectedRestaurant))}`}>
                                        {statusLabel(selectedRestaurant)}
                                    </span>
                                </div>

                                {selectedRestaurant.description && (
                                    <p className="admin-restaurants-description">
                                        {selectedRestaurant.description}
                                    </p>
                                )}

                                <div className="admin-restaurants-details-grid">

                                    <div>
                                        <MapPin size={17} />
                                        <span>
                                            <small>Address</small>
                                            <strong>
                                                {selectedRestaurant.address || "—"}
                                            </strong>
                                        </span>
                                    </div>

                                    <div>
                                        <Building2 size={17} />
                                        <span>
                                            <small>City</small>
                                            <strong>
                                                {selectedRestaurant.city || "—"}
                                            </strong>
                                        </span>
                                    </div>

                                    <div>
                                        <Phone size={17} />
                                        <span>
                                            <small>Phone</small>
                                            <strong>
                                                {selectedRestaurant.phone || "—"}
                                            </strong>
                                        </span>
                                    </div>

                                    <div>
                                        <Mail size={17} />
                                        <span>
                                            <small>Email</small>
                                            <strong>
                                                {selectedRestaurant.email || "—"}
                                            </strong>
                                        </span>
                                    </div>

                                    <div>
                                        <Utensils size={17} />
                                        <span>
                                            <small>Cuisine</small>
                                            <strong>
                                                {selectedRestaurant.cuisineType || "—"}
                                            </strong>
                                        </span>
                                    </div>

                                    <div>
                                        <CalendarDays size={17} />
                                        <span>
                                            <small>Restaurant ID</small>
                                            <strong>
                                                #{selectedRestaurant.id}
                                            </strong>
                                        </span>
                                    </div>

                                    <div>
                                        <Clock size={17} />
                                        <span>
                                            <small>Opening Time</small>
                                            <strong>
                                                {selectedRestaurant.openingTime || "—"}
                                            </strong>
                                        </span>
                                    </div>

                                    <div>
                                        <Clock size={17} />
                                        <span>
                                            <small>Closing Time</small>
                                            <strong>
                                                {selectedRestaurant.closingTime || "—"}
                                            </strong>
                                        </span>
                                    </div>

                                </div>

                                <div className="admin-restaurants-modal-footer">
                                    {getApprovalStatus(selectedRestaurant) === "PENDING" && (
                                        <>
                                            <button
                                                className="approve"
                                                onClick={() => handleApprove(selectedRestaurant)}
                                                disabled={actionLoading}
                                            >
                                                Approve
                                            </button>

                                            <button
                                                className="reject"
                                                onClick={() => handleReject(selectedRestaurant)}
                                                disabled={actionLoading}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {getApprovalStatus(selectedRestaurant) === "APPROVED" && (
                                        <button
                                            className={selectedRestaurant.active ? "deactivate" : "approve"}
                                            onClick={() => handleToggleStatus(selectedRestaurant)}
                                            disabled={actionLoading}
                                        >
                                            {selectedRestaurant.active
                                                ? "Deactivate Restaurant"
                                                : "Activate Restaurant"}
                                        </button>
                                    )}

                                    {getApprovalStatus(selectedRestaurant) === "REJECTED" && (
                                        <button
                                            className="approve"
                                            onClick={() => handleReopen(selectedRestaurant)}
                                            disabled={actionLoading}
                                        >
                                            Reopen Application
                                        </button>
                                    )}

                                    <button
                                        className="close"
                                        onClick={() => setSelectedRestaurant(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
