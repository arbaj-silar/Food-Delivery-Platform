
import { useEffect, useState } from "react";

import {
    getAvailablePartners,
    getReadyForDeliveryOrders,
    assignDelivery,
    getAllPartners,
    getAllDeliveries,
    updatePartnerStatus,
    getRestaurantAnalytics,
    getPendingRoleApplications,
    getAllRoleApplications,
    approveRoleApplication,
    rejectRoleApplication
} from "../../services/adminService";

import {
    getAllRestaurants,
    approveRestaurant,
    rejectRestaurant,
    updateRestaurantStatus,
    reopenRestaurant,
    getAdminRestaurantById
} from "../../services/restaurantService";

import "../styles/admin/AdminDashboard.css";

export default function AdminDashboard() {

    const [orders, setOrders] = useState([]);
    const [partners, setPartners] = useState([]);
    const [allPartners, setAllPartners] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [roleApplications, setRoleApplications] = useState([]);
    const [applicationHistory, setApplicationHistory] = useState([]);
    const [applicationSearch, setApplicationSearch] = useState("");
    const [applicationRoleFilter, setApplicationRoleFilter] = useState("ALL");
    const [restaurantSearch, setRestaurantSearch] = useState("");
    const [partnerSearch, setPartnerSearch] = useState("");
    const [selectedOrder, setSelectedOrder] = useState("");
    const [selectedPartner, setSelectedPartner] = useState("");
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [restaurantAnalytics, setRestaurantAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");

    const loadDashboard = async () => {
        try {
            setError("");

            const [
                ordersData,
                partnersData,
                allPartnersData,
                deliveriesData,
                restaurantsData,
                analyticsData,
                applicationsData,
                applicationHistoryData
            ] = await Promise.all([
                getReadyForDeliveryOrders(),
                getAvailablePartners(),
                getAllPartners(),
                getAllDeliveries(),
                getAllRestaurants(),
                getRestaurantAnalytics(),
                getPendingRoleApplications(),
                getAllRoleApplications()
            ]);

            setOrders(ordersData);
            setPartners(partnersData);
            setAllPartners(allPartnersData);
            setDeliveries(deliveriesData);
            setRestaurants(restaurantsData);
            setRestaurantAnalytics(analyticsData);
            setRoleApplications(Array.isArray(applicationsData) ? applicationsData : []);
            setApplicationHistory(
                Array.isArray(applicationHistoryData) ? applicationHistoryData : []
            );
        } catch (error) {
            console.error("Failed to load admin dashboard:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load admin dashboard. Please refresh."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);


    const handleApproveRoleApplication = async (applicationId) => {
        const confirmed = window.confirm(
            "Are you sure you want to approve this role application?"
        );

        if (!confirmed) return;

        try {
            await approveRoleApplication(applicationId);

            setMessage("Role application approved successfully!");
            setError("");

            await loadDashboard();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to approve role application."
            );
            setMessage("");
        }
    };

    const handleRejectRoleApplication = async (applicationId) => {
        const reason = window.prompt(
            "Please enter the reason for rejecting this application:"
        );

        if (reason === null) return;

        if (!reason.trim()) {
            setError("Rejection reason is required.");
            return;
        }

        try {
            await rejectRoleApplication(applicationId, reason.trim());

            setMessage("Role application rejected successfully!");
            setError("");

            await loadDashboard();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to reject role application."
            );
            setMessage("");
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();

        if (!selectedOrder || !selectedPartner) {
            setError("Please select an order and delivery partner.");
            return;
        }

        try {
            setAssigning(true);
            setError("");
            setMessage("");

            await assignDelivery(selectedOrder, selectedPartner);

            setMessage("Delivery partner assigned successfully!");

            setSelectedOrder("");
            setSelectedPartner("");

            await loadDashboard();

        } catch (err) {
            console.error("Assignment error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to assign delivery partner."
            );
        } finally {
            setAssigning(false);
        }
    };

    const handlePartnerStatus = async (partner) => {
        const newStatus = !partner.active;

        try {
            setError("");
            setMessage("");

            await updatePartnerStatus(partner.id, newStatus);

            setMessage(
                `Delivery partner ${newStatus ? "activated" : "deactivated"} successfully!`
            );

            await loadDashboard();

        } catch (err) {
            console.error("Partner status update error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to update delivery partner status."
            );
        }
    };

    // ADMIN: Approve restaurant
    const handleApproveRestaurant = async (restaurant) => {
        try {
            setError("");
            setMessage("");

            await approveRestaurant(restaurant.id);

            setMessage(
                `${restaurant.name} approved successfully!`
            );

            await loadDashboard();

        } catch (err) {
            console.error("Restaurant approval error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to approve restaurant."
            );
        }
    };


    // ADMIN: Reject restaurant
    const handleRejectRestaurant = async (restaurant) => {
        const confirmed = window.confirm(
            `Are you sure you want to reject ${restaurant.name}?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");

            await rejectRestaurant(restaurant.id);

            setMessage(
                `${restaurant.name} rejected successfully!`
            );

            await loadDashboard();

        } catch (err) {
            console.error("Restaurant rejection error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to reject restaurant."
            );
        }
    };

    // ADMIN: Reopen rejected restaurant registration
    const handleReopenRestaurant = async (restaurant) => {
        const confirmed = window.confirm(
            `Are you sure you want to reopen the review for ${restaurant.name}?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");

            await reopenRestaurant(restaurant.id);

            setMessage(`${restaurant.name} moved back to pending review!`);

            await loadDashboard();

        } catch (err) {
            console.error("Restaurant reopen error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to reopen restaurant registration."
            );
        }
    };

    // ADMIN: Activate or deactivate restaurant
    const handleRestaurantStatus = async (restaurant) => {
        const newStatus = !restaurant.active;

        if (!newStatus) {
            const confirmed = window.confirm(
                `Are you sure you want to deactivate ${restaurant.name}?`
            );

            if (!confirmed) return;
        }

        try {
            setError("");
            setMessage("");

            await updateRestaurantStatus(
                restaurant.id,
                newStatus
            );

            setMessage(
                `${restaurant.name} ${newStatus ? "activated" : "deactivated"} successfully!`
            );

            await loadDashboard();

        } catch (err) {
            console.error("Restaurant status update error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to update restaurant status."
            );
        }
    };

    // ADMIN: View complete restaurant details
    const handleViewRestaurant = async (id) => {
        try {
            setError("");
            setMessage("");

            const restaurant = await getAdminRestaurantById(id);

            setSelectedRestaurant(restaurant);

        } catch (err) {
            console.error("Restaurant details error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to load restaurant details."
            );
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard">
                <h2>Loading Admin Dashboard...</h2>
            </div>
        );
    }

    const filteredPartners = allPartners.filter(partner =>
        partner.fullName?.toLowerCase().includes(partnerSearch.toLowerCase()) ||
        partner.phone?.includes(partnerSearch)
    );

    const filteredRestaurants = restaurants.filter(restaurant => {
        const search = restaurantSearch.toLowerCase();

        return (
            restaurant.name?.toLowerCase().includes(search) ||
            restaurant.city?.toLowerCase().includes(search) ||
            restaurant.email?.toLowerCase().includes(search) ||
            restaurant.status?.toLowerCase().includes(search)
        );
    });

    // Restaurant Performance Analytics Calculations

    const totalRestaurantOrders = restaurantAnalytics.reduce(
        (total, item) => total + (item.totalOrders || 0),
        0
    );

    const totalCompletedOrders = restaurantAnalytics.reduce(
        (total, item) => total + (item.completedOrders || 0),
        0
    );

    const totalCancelledOrders = restaurantAnalytics.reduce(
        (total, item) => total + (item.cancelledOrders || 0),
        0
    );

    const totalRestaurantRevenue = restaurantAnalytics.reduce(
        (total, item) => total + Number(item.totalRevenue || 0),
        0
    );

    const filteredRoleApplications = roleApplications.filter(application => {
        const search = applicationSearch.toLowerCase();

        const matchesSearch =
            (application.fullName || "").toLowerCase().includes(search) ||
            (application.email || "").toLowerCase().includes(search) ||
            String(application.id).includes(search);

        const matchesRole =
            applicationRoleFilter === "ALL" ||
            application.requestedRole === applicationRoleFilter;

        return matchesSearch && matchesRole;
    });

    const filteredApplicationHistory = applicationHistory.filter(application => {
        const matchesStatus =
            historyStatusFilter === "ALL" ||
            application.applicationStatus === historyStatusFilter;

        const search = applicationSearch.toLowerCase();

        const matchesSearch =
            (application.fullName || "").toLowerCase().includes(search) ||
            (application.email || "").toLowerCase().includes(search) ||
            String(application.id).includes(search);

        const matchesRole =
            applicationRoleFilter === "ALL" ||
            application.requestedRole === applicationRoleFilter;

        return matchesStatus && matchesSearch && matchesRole;
    });

    return (
        <div className="admin-dashboard">

            <header className="admin-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Manage delivery assignments and delivery partners</p>
                </div>

                <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={loading}
                >
                    Refresh
                </button>
            </header>

            {error && (
                <div className="admin-error">{error}</div>
            )}

            {message && (
                <div className="admin-success">{message}</div>
            )}

            {/* Dashboard Statistics */}
            <section className="admin-stats">

                <div className="admin-stat-card">
                    <h3>Ready Orders</h3>
                    <p>{orders.length}</p>
                </div>

                <div className="admin-stat-card">
                    <h3>Available Partners</h3>
                    <p>{partners.length}</p>
                </div>

                <div className="admin-stat-card">
                    <h3>Total Partners</h3>
                    <p>{allPartners.length}</p>
                </div>

                {/* Restaurant Statistics */}

                <div className="admin-stat-card">
                    <h3>Total Restaurants</h3>
                    <p>{restaurants.length}</p>
                </div>

                <div className="admin-stat-card">
                    <h3>Pending Approvals</h3>
                    <p>
                        {restaurants.filter(
                            restaurant => restaurant.status === "PENDING"
                        ).length}
                    </p>
                </div>

                <div className="admin-stat-card">
                    <h3>Approved Restaurants</h3>
                    <p>
                        {restaurants.filter(
                            restaurant => restaurant.status === "APPROVED"
                        ).length}
                    </p>
                </div>

                <div className="admin-stat-card">
                    <h3>Active Restaurants</h3>
                    <p>
                        {restaurants.filter(
                            restaurant =>
                                restaurant.status === "APPROVED" &&
                                restaurant.active
                        ).length}
                    </p>
                </div>

                <div className="admin-stat-card">
                    <h3>Rejected Restaurants</h3>
                    <p>
                        {restaurants.filter(
                            restaurant => restaurant.status === "REJECTED"
                        ).length}
                    </p>
                </div>
            </section>

            {/* Restaurant Performance Analytics */}
            <section className="admin-analytics-section">

                <div className="admin-section-header">
                    <div>
                        <h2>Restaurant Performance Analytics</h2>
                        <p>Overall restaurant order and revenue performance.</p>
                    </div>
                </div>

                <div className="admin-analytics-stats">

                    <div className="admin-analytics-card">
                        <h3>Total Orders</h3>
                        <p>{totalRestaurantOrders}</p>
                    </div>

                    <div className="admin-analytics-card">
                        <h3>Completed Orders</h3>
                        <p>{totalCompletedOrders}</p>
                    </div>

                    <div className="admin-analytics-card">
                        <h3>Cancelled Orders</h3>
                        <p>{totalCancelledOrders}</p>
                    </div>

                    <div className="admin-analytics-card">
                        <h3>Total Revenue</h3>
                        <p>
                            ₹{totalRestaurantRevenue.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                    </div>

                </div>

            </section>

            {/* Restaurant-wise Performance Comparison */}
            <section className="admin-partners-section admin-analytics-table-section">

                <div className="admin-section-header">
                    <div>
                        <h2>Restaurant-wise Performance</h2>
                        <p>Compare orders and revenue across restaurants.</p>
                    </div>

                    <span className="admin-partner-count">
                        {restaurantAnalytics.length} Records
                    </span>
                </div>

                <div className="admin-partners-table-wrapper">

                    <table className="admin-partners-table">

                        <thead>
                            <tr>
                                <th>Restaurant ID</th>
                                <th>Restaurant Name</th>
                                <th>Total Orders</th>
                                <th>Completed</th>
                                <th>Cancelled</th>
                                <th>Completion Rate</th>
                                <th>Total Revenue</th>
                            </tr>
                        </thead>

                        <tbody>
                            {restaurantAnalytics.length > 0 ? (

                                restaurantAnalytics.map(item => {

                                    const restaurant = restaurants.find(
                                        r => r.id === item.restaurantId
                                    );

                                    const completionRate = item.totalOrders > 0
                                        ? (
                                            item.completedOrders /
                                            item.totalOrders
                                        ) * 100
                                        : 0;

                                    return (
                                        <tr key={item.restaurantId}>

                                            <td>#{item.restaurantId}</td>

                                            <td>
                                                <strong>
                                                    {restaurant?.name || `Restaurant #${item.restaurantId}`}
                                                </strong>
                                            </td>

                                            <td>{item.totalOrders}</td>

                                            <td>{item.completedOrders}</td>

                                            <td>{item.cancelledOrders}</td>

                                            <td>
                                                {completionRate.toFixed(1)}%
                                            </td>

                                            <td>
                                                ₹{Number(item.totalRevenue || 0).toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </td>

                                        </tr>
                                    );
                                })

                            ) : (

                                <tr>
                                    <td colSpan="7" className="admin-no-partners">
                                        No restaurant performance data available yet.
                                    </td>
                                </tr>

                            )}
                        </tbody>

                    </table>

                </div>

            </section>

            {/* Delivery Assignment */}
            <section className="admin-assignment-section">

                <h2>Assign Delivery Partner</h2>

                <form onSubmit={handleAssign}>

                    <div className="admin-form-group">
                        <label>Select Ready Order</label>

                        <select
                            value={selectedOrder}
                            onChange={(e) =>
                                setSelectedOrder(e.target.value)
                            }
                            required
                        >
                            <option value="">Choose an order</option>

                            {orders.map(order => (
                                <option key={order.id} value={order.id}>
                                    Order #{order.id} — ₹{order.totalAmount}
                                    {" "}— Restaurant #{order.restaurantId}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label>Select Available Delivery Partner</label>

                        <select
                            value={selectedPartner}
                            onChange={(e) =>
                                setSelectedPartner(e.target.value)
                            }
                            required
                        >
                            <option value="">Choose a partner</option>

                            {partners.map(partner => (
                                <option key={partner.id} value={partner.id}>
                                    {partner.fullName} — {partner.vehicleType}
                                    {" "}({partner.phone})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={
                            assigning ||
                            !orders.length ||
                            !partners.length
                        }
                    >
                        {assigning ? "Assigning..." : "Assign Delivery"}
                    </button>

                </form>

                {!orders.length && (
                    <p>No orders are currently ready for delivery.</p>
                )}

                {!partners.length && (
                    <p>No available delivery partners found.</p>
                )}

            </section>

            {/* Delivery Partner Management */}
            <section className="admin-partners-section">

                <div className="admin-section-header">
                    <div>
                        <h2>Delivery Partner Management</h2>
                        <div className="admin-partner-search">
                            <input
                                type="text"
                                placeholder="Search by partner name or phone..."
                                value={partnerSearch}
                                onChange={(e) => setPartnerSearch(e.target.value)}
                            />

                            {partnerSearch && (
                                <button
                                    type="button"
                                    onClick={() => setPartnerSearch("")}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <p>View all registered delivery partners and their status.</p>
                    </div>

                    <span className="admin-partner-count">
                        {allPartners.length} Partners
                    </span>
                </div>

                {allPartners.length === 0 ? (

                    <p>No delivery partners have registered yet.</p>

                ) : (

                    <div className="admin-partners-table-wrapper">

                        <table className="admin-partners-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Partner</th>
                                    <th>Phone</th>
                                    <th>Vehicle</th>
                                    <th>Availability</th>
                                    <th>Account</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPartners.length > 0 ? (
                                    filteredPartners.map(partner => (
                                        <tr key={partner.id}>

                                            <td>#{partner.id}</td>

                                            <td>{partner.fullName}</td>

                                            <td>{partner.phone}</td>

                                            <td>{partner.vehicleType}</td>

                                            <td>
                                                <span className={`admin-status ${partner.availabilityStatus?.toLowerCase()}`}>
                                                    {partner.availabilityStatus}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`admin-status ${partner.active ? "active" : "inactive"}`}>
                                                    {partner.active ? "ACTIVE" : "INACTIVE"}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className={`admin-partner-action ${partner.active ? "deactivate" : "activate"
                                                        }`}
                                                    onClick={() => handlePartnerStatus(partner)}
                                                >
                                                    {partner.active ? "Deactivate" : "Activate"}
                                                </button>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="admin-no-partners">
                                            No delivery partners found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>

                    </div>
                )}

            </section>


            {/* Restaurant Management */}
            <section className="admin-partners-section admin-restaurants-section">

                <div className="admin-section-header">
                    <div>
                        <h2>Restaurant Management</h2>

                        <p>
                            Review registrations and manage restaurant accounts.
                        </p>

                        <div className="admin-partner-search">
                            <input
                                type="text"
                                placeholder="Search by restaurant, city, email or status..."
                                value={restaurantSearch}
                                onChange={(e) => setRestaurantSearch(e.target.value)}
                            />

                            {restaurantSearch && (
                                <button
                                    type="button"
                                    onClick={() => setRestaurantSearch("")}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <span className="admin-partner-count">
                        {restaurants.length} Restaurants
                    </span>
                </div>

                <div className="admin-partners-table-wrapper">

                    <table className="admin-partners-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Restaurant</th>
                                <th>City</th>
                                <th>Owner Email</th>
                                <th>Cuisine</th>
                                <th>Registration</th>
                                <th>Account</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredRestaurants.length > 0 ? (

                                filteredRestaurants.map(restaurant => (

                                    <tr key={restaurant.id}>

                                        <td>#{restaurant.id}</td>

                                        <td>
                                            <strong>{restaurant.name}</strong>
                                        </td>

                                        <td>{restaurant.city || "N/A"}</td>

                                        <td>{restaurant.email || "N/A"}</td>

                                        <td>{restaurant.cuisineType || "N/A"}</td>

                                        <td>
                                            <span className={`admin-status ${restaurant.status?.toLowerCase()}`}>
                                                {restaurant.status}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`admin-status ${restaurant.active ? "active" : "inactive"}`}>
                                                {restaurant.active ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="admin-restaurant-actions">
                                                <button
                                                    type="button"
                                                    className="admin-partner-action"
                                                    onClick={() => handleViewRestaurant(restaurant.id)}
                                                >
                                                    View Details
                                                </button>
                                                {restaurant.status === "PENDING" && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="admin-partner-action activate"
                                                            onClick={() => handleApproveRestaurant(restaurant)}
                                                        >
                                                            Approve
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="admin-partner-action deactivate"
                                                            onClick={() => handleRejectRestaurant(restaurant)}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}

                                                {restaurant.status === "APPROVED" && (
                                                    <button
                                                        type="button"
                                                        className={`admin-partner-action ${restaurant.active ? "deactivate" : "activate"}`}
                                                        onClick={() => handleRestaurantStatus(restaurant)}
                                                    >
                                                        {restaurant.active ? "Deactivate" : "Activate"}
                                                    </button>
                                                )}

                                                {restaurant.status === "REJECTED" && (
                                                    <button
                                                        type="button"
                                                        className="admin-partner-action activate"
                                                        onClick={() => handleReopenRestaurant(restaurant)}
                                                    >
                                                        Reopen Review
                                                    </button>
                                                )}

                                            </div>
                                        </td>

                                    </tr>

                                ))

                            ) : (

                                <tr>
                                    <td colSpan="8" className="admin-no-partners">
                                        No restaurants found.
                                    </td>
                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </section>

            {/* ROLE APPLICATION MANAGEMENT */}
            <section className="admin-section role-applications-section">

                <div className="section-heading">
                    <div>
                        <span className="section-eyebrow">ACCESS MANAGEMENT</span>
                        <h2>Role Applications</h2>
                        <p>
                            Review applications and track previous approval decisions.
                        </p>
                    </div>

                    <span className="application-count">
                        {roleApplications.length} Pending
                    </span>
                </div>

                {/* PENDING APPLICATIONS */}
                <h3 className="application-subheading">Pending Applications</h3>

                <div className="application-toolbar">
                    <input
                        type="text"
                        placeholder="Search by name, email or application ID..."
                        value={applicationSearch}
                        onChange={(e) => setApplicationSearch(e.target.value)}
                        aria-label="Search role applications"
                    />

                    <select
                        value={applicationRoleFilter}
                        onChange={(e) => setApplicationRoleFilter(e.target.value)}
                        aria-label="Filter applications by requested role"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="RESTAURANT_OWNER">Restaurant Owners</option>
                        <option value="DELIVERY_PARTNER">Delivery Partners</option>
                    </select>
                </div>

                {filteredRoleApplications.length === 0 ? (
                    <div className="empty-applications">
                        <div className="empty-application-icon">📋</div>
                        <h3>
                            {roleApplications.length === 0
                                ? "All caught up!"
                                : "No matching applications"}
                        </h3>
                        <p>
                            {roleApplications.length === 0
                                ? "There are no pending role applications right now."
                                : "Try another search term or choose a different role filter."}
                        </p>
                    </div>
                ) : (
                    <div className="role-application-grid">
                        {filteredRoleApplications.map(application => (
                            <article
                                className="role-application-card"
                                key={application.id}
                            >
                                <div className="application-card-top">
                                    <div className="applicant-avatar">
                                        {application.fullName?.charAt(0)?.toUpperCase() || "U"}
                                    </div>

                                    <span className="application-status pending">
                                        {application.applicationStatus}
                                    </span>
                                </div>

                                <h3>{application.fullName || "Unnamed applicant"}</h3>

                                <p className="applicant-email">
                                    {application.email || "Email not provided"}
                                </p>

                                <div className="application-details">
                                    <div>
                                        <span>Phone</span>
                                        <strong>{application.phone || "Not provided"}</strong>
                                    </div>

                                    <div>
                                        <span>Requested Role</span>
                                        <strong className="requested-role">
                                            {application.requestedRole === "RESTAURANT_OWNER"
                                                ? "🍽️ Restaurant Owner"
                                                : application.requestedRole === "DELIVERY_PARTNER"
                                                    ? "🛵 Delivery Partner"
                                                    : application.requestedRole || "Unknown"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Application ID</span>
                                        <strong>#{application.id}</strong>
                                    </div>

                                    <div>
                                        <span>Submitted</span>
                                        <strong>
                                            {application.submittedAt
                                                ? new Date(application.submittedAt).toLocaleDateString()
                                                : "N/A"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="application-actions">
                                    <button
                                        type="button"
                                        className="approve-application-btn"
                                        onClick={() =>
                                            handleApproveRoleApplication(application.id)
                                        }
                                    >
                                        ✓ Approve
                                    </button>

                                    <button
                                        type="button"
                                        className="reject-application-btn"
                                        onClick={() =>
                                            handleRejectRoleApplication(application.id)
                                        }
                                    >
                                        ✕ Reject
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* APPLICATION HISTORY */}
                <div className="application-history-section">

                    <div className="application-history-heading">
                        <div>
                            <h3>Application History</h3>
                            <p>Previously submitted and reviewed role applications.</p>
                        </div>

                        <span className="application-count">
                            {filteredApplicationHistory.length} Records
                        </span>
                    </div>

                    <div className="application-history-toolbar">
                        <select
                            value={historyStatusFilter}
                            onChange={(e) => setHistoryStatusFilter(e.target.value)}
                            aria-label="Filter application history by status"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>

                    {filteredApplicationHistory.length === 0 ? (
                        <div className="empty-applications">
                            <div className="empty-application-icon">📚</div>
                            <h3>No application history found</h3>
                            <p>
                                No applications match your selected search and filters.
                            </p>
                        </div>
                    ) : (
                        <div className="application-history-list">
                            {filteredApplicationHistory.map(application => (
                                <article
                                    className="application-history-card"
                                    key={application.id}
                                >
                                    <div className="application-history-top">
                                        <div>
                                            <h4>{application.fullName || "Unnamed applicant"}</h4>
                                            <p>{application.email || "Email not provided"}</p>
                                        </div>

                                        <span className={`application-status ${application.applicationStatus?.toLowerCase()
                                            }`}>
                                            {application.applicationStatus}
                                        </span>
                                    </div>

                                    <div className="application-history-details">
                                        <div>
                                            <span>Application ID</span>
                                            <strong>#{application.id}</strong>
                                        </div>

                                        <div>
                                            <span>Requested Role</span>
                                            <strong>{application.requestedRole?.replaceAll("_", " ")}</strong>
                                        </div>

                                        <div>
                                            <span>Phone</span>
                                            <strong>{application.phone || "Not provided"}</strong>
                                        </div>

                                        <div>
                                            <span>Submitted</span>
                                            <strong>
                                                {application.submittedAt
                                                    ? new Date(application.submittedAt).toLocaleString()
                                                    : "N/A"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Reviewed</span>
                                            <strong>
                                                {application.reviewedAt
                                                    ? new Date(application.reviewedAt).toLocaleString()
                                                    : "Not reviewed"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Reviewed By</span>
                                            <strong>
                                                {application.reviewedByName
                                                    ? `${application.reviewedByName} (ID: ${application.reviewedById})`
                                                    : "Not reviewed"}
                                            </strong>
                                        </div>
                                        {application.applicationStatus === "REJECTED" && (
                                            <div className="application-rejection-reason">
                                                <span>Rejection Reason</span>
                                                <p>
                                                    {application.rejectionReason || "No reason provided"}
                                                </p>
                                            </div>
                                        )}

                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

            </section>

            {/* Delivery History */}
            <section className="admin-partners-section admin-history-section">

                <div className="admin-section-header">
                    <h2>Delivery History</h2>

                    <span className="admin-partner-count">
                        {deliveries.length} Records
                    </span>
                </div>

                <div className="admin-partners-table-wrapper">
                    <table className="admin-partners-table">

                        <thead>
                            <tr>
                                <th>Assignment ID</th>
                                <th>Order ID</th>
                                <th>Delivery Partner</th>
                                <th>Status</th>
                                <th>Assigned At</th>
                                <th>Delivered At</th>
                            </tr>
                        </thead>

                        <tbody>
                            {deliveries.length > 0 ? (
                                deliveries.map((delivery) => (
                                    <tr key={delivery.id}>
                                        <td>#{delivery.id}</td>

                                        <td>#{delivery.orderId}</td>

                                        <td>
                                            {delivery.deliveryPartnerName || "N/A"}
                                        </td>

                                        <td>
                                            <span className={`admin-status ${delivery.status?.toLowerCase()}`}>
                                                {delivery.status?.replaceAll("_", " ")}
                                            </span>
                                        </td>

                                        <td>
                                            {delivery.assignedAt
                                                ? new Date(delivery.assignedAt).toLocaleString()
                                                : "N/A"}
                                        </td>

                                        <td>
                                            {delivery.deliveredAt
                                                ? new Date(delivery.deliveredAt).toLocaleString()
                                                : "Not delivered"}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="admin-empty-history">
                                        No delivery history available.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                </div>

            </section>
            {/* Restaurant Details Modal */}
            {
                selectedRestaurant && (
                    <div className="restaurant-modal-overlay">
                        <div className="restaurant-details-modal">

                            <div className="restaurant-modal-header">
                                <h2>Restaurant Details</h2>

                                <button
                                    type="button"
                                    onClick={() => setSelectedRestaurant(null)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="restaurant-modal-content">

                                <h3>{selectedRestaurant.name}</h3>

                                <p>
                                    <strong>ID:</strong> #{selectedRestaurant.id}
                                </p>

                                <p>
                                    <strong>Description:</strong>{" "}
                                    {selectedRestaurant.description || "N/A"}
                                </p>

                                <p>
                                    <strong>Address:</strong>{" "}
                                    {selectedRestaurant.address || "N/A"}
                                </p>

                                <p>
                                    <strong>City:</strong>{" "}
                                    {selectedRestaurant.city || "N/A"}
                                </p>

                                <p>
                                    <strong>Phone:</strong>{" "}
                                    {selectedRestaurant.phone || "N/A"}
                                </p>

                                <p>
                                    <strong>Email:</strong>{" "}
                                    {selectedRestaurant.email || "N/A"}
                                </p>

                                <p>
                                    <strong>Cuisine:</strong>{" "}
                                    {selectedRestaurant.cuisineType || "N/A"}
                                </p>

                                <p>
                                    <strong>Opening Time:</strong>{" "}
                                    {selectedRestaurant.openingTime || "N/A"}
                                </p>

                                <p>
                                    <strong>Closing Time:</strong>{" "}
                                    {selectedRestaurant.closingTime || "N/A"}
                                </p>

                                <p>
                                    <strong>Delivery Available:</strong>{" "}
                                    {selectedRestaurant.deliveryAvailable ? "Yes" : "No"}
                                </p>

                                <p>
                                    <strong>Account Status:</strong>{" "}
                                    {selectedRestaurant.active ? "ACTIVE" : "INACTIVE"}
                                </p>

                                <p>
                                    <strong>Registration Status:</strong>{" "}
                                    {selectedRestaurant.status}
                                </p>

                                <p>
                                    <strong>Latitude:</strong>{" "}
                                    {selectedRestaurant.latitude ?? "N/A"}
                                </p>

                                <p>
                                    <strong>Longitude:</strong>{" "}
                                    {selectedRestaurant.longitude ?? "N/A"}
                                </p>

                                <p>
                                    <strong>Created At:</strong>{" "}
                                    {selectedRestaurant.createdAt
                                        ? new Date(selectedRestaurant.createdAt).toLocaleString()
                                        : "N/A"}
                                </p>

                                <p>
                                    <strong>Last Updated:</strong>{" "}
                                    {selectedRestaurant.updatedAt
                                        ? new Date(selectedRestaurant.updatedAt).toLocaleString()
                                        : "N/A"}
                                </p>

                            </div>

                            <button
                                type="button"
                                className="restaurant-modal-close"
                                onClick={() => setSelectedRestaurant(null)}
                            >
                                Close
                            </button>

                        </div>
                    </div>
                )
            }
        </div>
    );
}
