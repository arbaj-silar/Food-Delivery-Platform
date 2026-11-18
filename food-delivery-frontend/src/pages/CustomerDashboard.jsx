
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProfile } from "../services/userService";
import { getMyOrders } from "../services/orderService";
import {
    submitRoleApplication,
    getMyRoleApplications
} from "../services/roleApplicationService";

import {
    User,
    ShoppingBag,
    Store,
    Clock,
    CheckCircle,
    Truck,
    ArrowRight,
    Package,
    RefreshCw,
    BriefcaseBusiness,
    Send,
    ClipboardList,
    AlertCircle
} from "lucide-react";

import "../styles/CustomerDashboard.css";

export default function CustomerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [applications, setApplications] = useState([]);

    const [selectedRole, setSelectedRole] = useState("RESTAURANT_OWNER");
    const [submittingApplication, setSubmittingApplication] = useState(false);
    const [applicationMessage, setApplicationMessage] = useState("");
    const [applicationError, setApplicationError] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                profileResult,
                ordersResult,
                applicationsResult
            ] = await Promise.allSettled([
                getMyProfile(),
                getMyOrders(),
                getMyRoleApplications()
            ]);

            if (profileResult.status === "fulfilled") {
                setProfile(profileResult.value);
            } else {
                throw profileResult.reason;
            }

            if (ordersResult.status === "fulfilled") {
                setOrders(
                    Array.isArray(ordersResult.value)
                        ? ordersResult.value
                        : []
                );
            } else {
                console.error("Unable to load orders:", ordersResult.reason);
                setOrders([]);
            }

            if (applicationsResult.status === "fulfilled") {
                setApplications(
                    Array.isArray(applicationsResult.value)
                        ? applicationsResult.value
                        : []
                );
            } else {
                console.error(
                    "Unable to load role applications:",
                    applicationsResult.reason
                );
                setApplications([]);
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);


    const handleApplicationSubmit = async (event) => {
        event.preventDefault();

        try {
            setSubmittingApplication(true);
            setApplicationMessage("");
            setApplicationError("");

            // Submit the application first
            const submittedApplication =
                await submitRoleApplication(selectedRole);

            // Confirm successful submission immediately
            setApplicationMessage(
                "Your application has been submitted successfully!"
            );

            // Refresh application history separately
            try {
                const updatedApplications = await getMyRoleApplications();

                setApplications(
                    Array.isArray(updatedApplications)
                        ? updatedApplications
                        : []
                );
            } catch (refreshError) {
                console.error(
                    "Application submitted, but history refresh failed:",
                    refreshError
                );

                // Keep the newly submitted application visible
                if (submittedApplication?.id) {
                    setApplications(previous => [
                        submittedApplication,
                        ...previous.filter(
                            application =>
                                application.id !== submittedApplication.id
                        )
                    ]);
                }
            }

        } catch (err) {
            setApplicationError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to submit your application. Please try again."
            );
        } finally {
            setSubmittingApplication(false);
        }
    };

    const customerName =
        profile?.fullName ||
        user?.firstName ||
        user?.username ||
        "Customer";

    const totalOrders = orders.length;

    const activeOrders = orders.filter(order =>
        [
            "PLACED",
            "CONFIRMED",
            "PREPARING",
            "READY_FOR_PICKUP",
            "ASSIGNED",
            "PICKED_UP",
            "OUT_FOR_DELIVERY"
        ].includes(order.status?.toUpperCase())
    ).length;

    const deliveredOrders = orders.filter(
        order => order.status?.toUpperCase() === "DELIVERED"
    ).length;

    const recentOrders = [...orders]
        .sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        )
        .slice(0, 4);

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const formatAmount = (amount) =>
        `₹${Number(amount || 0).toFixed(2)}`;

    const getStatusClass = (status) =>
        status?.toLowerCase().replaceAll("_", "-") || "unknown";

    const getRoleLabel = (role) => {
        if (role === "RESTAURANT_OWNER") return "Restaurant Owner";
        if (role === "DELIVERY_PARTNER") return "Delivery Partner";
        return role?.replaceAll("_", " ") || "Unknown Role";
    };

    const hasActiveApplication = applications.some(application =>
        application.requestedRole === selectedRole &&
        ["PENDING", "APPROVED"].includes(
            application.applicationStatus?.toUpperCase()
        )
    );

    if (loading) {
        return (
            <div className="dashboard-loading">
                <RefreshCw className="dashboard-spin" size={30} />
                <p>Preparing your dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <p>{error}</p>
                <button onClick={loadDashboard}>
                    <RefreshCw size={17} /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard-container">

            {/* Welcome section */}
            <section className="dashboard-welcome">
                <div>
                    <span className="dashboard-eyebrow">
                        CUSTOMER DASHBOARD
                    </span>

                    <h1>
                        Welcome back, {customerName}!
                    </h1>

                    <p>
                        Delicious food is just a few clicks away.
                        Explore restaurants and track your orders.
                    </p>

                    <button
                        className="dashboard-primary-btn"
                        onClick={() => navigate("/restaurants")}
                    >
                        Explore Restaurants
                        <ArrowRight size={18} />
                    </button>
                </div>

                <div className="dashboard-welcome-icon">
                    <Store size={76} strokeWidth={1.3} />
                </div>
            </section>

            {/* Statistics */}
            <section className="dashboard-stats">

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon green">
                        <ShoppingBag size={23} />
                    </div>
                    <div>
                        <span>Total Orders</span>
                        <h2>{totalOrders}</h2>
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon orange">
                        <Clock size={23} />
                    </div>
                    <div>
                        <span>Active Orders</span>
                        <h2>{activeOrders}</h2>
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon blue">
                        <CheckCircle size={23} />
                    </div>
                    <div>
                        <span>Delivered Orders</span>
                        <h2>{deliveredOrders}</h2>
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon purple">
                        <User size={23} />
                    </div>
                    <div>
                        <span>Account Status</span>
                        <h2 className="dashboard-status-text">
                            {profile?.status || "Active"}
                        </h2>
                    </div>
                </div>

            </section>

            {/* Quick actions */}
            <section className="dashboard-quick-actions">
                <div className="dashboard-section-heading">
                    <div>
                        <h2>Quick Actions</h2>
                        <p>Everything you need in one place.</p>
                    </div>
                </div>

                <div className="dashboard-action-grid">

                    <button
                        className="dashboard-action-card"
                        onClick={() => navigate("/restaurants")}
                    >
                        <Store size={25} />
                        <span>
                            <strong>Browse Restaurants</strong>
                            <small>Discover delicious food</small>
                        </span>
                        <ArrowRight size={18} />
                    </button>

                    <button
                        className="dashboard-action-card"
                        onClick={() => navigate("/my-orders")}
                    >
                        <Package size={25} />
                        <span>
                            <strong>My Orders</strong>
                            <small>View and track your orders</small>
                        </span>
                        <ArrowRight size={18} />
                    </button>

                    <button
                        className="dashboard-action-card"
                        onClick={() => navigate("/profile")}
                    >
                        <User size={25} />
                        <span>
                            <strong>My Profile</strong>
                            <small>Manage personal information</small>
                        </span>
                        <ArrowRight size={18} />
                    </button>

                </div>
            </section>

            {/* Become a partner */}
            <section className="dashboard-partner-section">

                <div className="dashboard-section-heading">
                    <div>
                        <h2>Grow With FoodExpress</h2>
                        <p>
                            Turn your passion into an opportunity.
                            Apply to join our partner community.
                        </p>
                    </div>
                    <div className="dashboard-partner-heading-icon">
                        <BriefcaseBusiness size={27} />
                    </div>
                </div>

                <div className="dashboard-partner-content">

                    <div className="dashboard-partner-intro">
                        <h3>Become a FoodExpress Partner</h3>
                        <p>
                            Run your own restaurant on our platform or
                            deliver happiness to customers as a delivery
                            partner. Submit an application and our admin
                            team will review it.
                        </p>

                        <div className="dashboard-partner-benefits">
                            <div>
                                <CheckCircle size={17} />
                                Simple application process
                            </div>
                            <div>
                                <CheckCircle size={17} />
                                Application status tracking
                            </div>
                            <div>
                                <CheckCircle size={17} />
                                Admin-reviewed approval
                            </div>
                        </div>
                    </div>

                    <form
                        className="dashboard-application-form"
                        onSubmit={handleApplicationSubmit}
                    >
                        <label htmlFor="requestedRole">
                            Select your application type
                        </label>

                        <select
                            id="requestedRole"
                            value={selectedRole}
                            onChange={(event) => {
                                setSelectedRole(event.target.value);
                                setApplicationMessage("");
                                setApplicationError("");
                            }}
                        >
                            <option value="RESTAURANT_OWNER">
                                Restaurant Owner
                            </option>
                            <option value="DELIVERY_PARTNER">
                                Delivery Partner
                            </option>
                        </select>

                        {hasActiveApplication ? (
                            applicationMessage ? (
                                <div className="dashboard-application-success">
                                    <CheckCircle size={18} />
                                    {applicationMessage}
                                </div>
                            ) : (
                                <div className="dashboard-application-notice">
                                    <AlertCircle size={18} />
                                    You already have a pending or approved
                                    application for this role.
                                </div>
                            )
                        ) : (
                            <button
                                type="submit"
                                className="dashboard-application-submit"
                                disabled={submittingApplication}
                            >
                                {submittingApplication ? (
                                    <>
                                        <RefreshCw
                                            size={17}
                                            className="dashboard-spin"
                                        />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Application
                                        <Send size={17} />
                                    </>
                                )}
                            </button>
                        )}

                        {applicationError && (
                            <div className="dashboard-application-error">
                                <AlertCircle size={18} />
                                {applicationError}
                            </div>
                        )}
                    </form>

                </div>

                {/* Application history */}
                <div className="dashboard-my-applications">

                    <div className="dashboard-applications-heading">
                        <div>
                            <ClipboardList size={21} />
                            <h3>My Applications</h3>
                        </div>
                        <span>
                            {applications.length} Total
                        </span>
                    </div>

                    {applications.length === 0 ? (
                        <div className="dashboard-no-applications">
                            <BriefcaseBusiness size={34} />
                            <strong>No applications submitted yet</strong>
                            <p>
                                Your submitted applications will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="dashboard-application-list">
                            {applications.map(application => (
                                <article
                                    className="dashboard-application-card"
                                    key={application.id}
                                >
                                    <div className="dashboard-application-card-top">
                                        <div className="dashboard-application-role-icon">
                                            {application.requestedRole ===
                                                "RESTAURANT_OWNER" ? (
                                                <Store size={22} />
                                            ) : (
                                                <Truck size={22} />
                                            )}
                                        </div>

                                        <div className="dashboard-application-title">
                                            <strong>
                                                {getRoleLabel(application.requestedRole)}
                                            </strong>
                                            <span>
                                                Application #{application.id}
                                            </span>
                                        </div>

                                        <span
                                            className={`dashboard-application-status ${getStatusClass(application.applicationStatus)}`}
                                        >
                                            {application.applicationStatus?.replaceAll(
                                                "_",
                                                " "
                                            )}
                                        </span>
                                    </div>

                                    <div className="dashboard-application-details">
                                        <div>
                                            <span>Submitted</span>
                                            <strong>
                                                {formatDate(application.submittedAt)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Reviewed</span>
                                            <strong>
                                                {application.reviewedAt
                                                    ? formatDate(application.reviewedAt)
                                                    : "Awaiting review"}
                                            </strong>
                                        </div>

                                        {application.reviewedByName && (
                                            <div>
                                                <span>Reviewed By</span>
                                                <strong>
                                                    {application.reviewedByName}
                                                </strong>
                                            </div>
                                        )}
                                    </div>

                                    {application.rejectionReason && (
                                        <div className="dashboard-rejection-reason">
                                            <strong>Admin feedback</strong>
                                            <p>{application.rejectionReason}</p>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}

                </div>
            </section>

            {/* Recent orders */}
            <section className="dashboard-recent-orders">

                <div className="dashboard-section-heading">
                    <div>
                        <h2>Recent Orders</h2>
                        <p>Your latest food orders.</p>
                    </div>

                    <button
                        className="dashboard-view-all"
                        onClick={() => navigate("/my-orders")}
                    >
                        View All <ArrowRight size={16} />
                    </button>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="dashboard-empty-orders">
                        <ShoppingBag size={40} />
                        <h3>No orders yet</h3>
                        <p>Your food journey starts here!</p>

                        <button
                            onClick={() => navigate("/restaurants")}
                        >
                            Order Now
                        </button>
                    </div>
                ) : (
                    <div className="dashboard-order-list">
                        {recentOrders.map(order => (
                            <div
                                className="dashboard-order-item"
                                key={order.id}
                            >
                                <div className="dashboard-order-icon">
                                    <Truck size={23} />
                                </div>

                                <div className="dashboard-order-info">
                                    <strong>Order #{order.id}</strong>
                                    <span>
                                        {order.items?.length || 0} items
                                        {" · "}
                                        {formatDate(order.createdAt)}
                                    </span>
                                </div>

                                <div className="dashboard-order-amount">
                                    <strong>
                                        {formatAmount(order.totalAmount)}
                                    </strong>
                                    <span
                                        className={`dashboard-order-status ${getStatusClass(order.status)}`}
                                    >
                                        {order.status?.replaceAll("_", " ") || "UNKNOWN"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </section>

        </div>
    );
}
