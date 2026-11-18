
import { useEffect, useState } from "react";

import {
    getMyRestaurants,
    createRestaurant
} from "../../services/restaurantService";

import {
    getRestaurantOrders,
    updateOrderStatus
} from "../../services/orderService";

import "../../styles/restaurant/RestaurantOwnerDashboard.css";
import { useAuth } from "../../context/AuthContext";

const initialRestaurantForm = {
    name: "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    city: "",
    phone: "",
    email: "",
    cuisineType: "",
    imageUrl: "",
    openingTime: "",
    closingTime: "",
    deliveryAvailable: false
};

export default function RestaurantOwnerDashboard() {

    const { user } = useAuth();

    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState("");
    const [orders, setOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [creatingRestaurant, setCreatingRestaurant] = useState(false);

    const [error, setError] = useState("");
    const [registrationMessage, setRegistrationMessage] = useState("");
    const [updatingOrder, setUpdatingOrder] = useState(null);

    const [restaurantForm, setRestaurantForm] = useState(
        initialRestaurantForm
    );

    // Load restaurants belonging to the logged-in owner.
    useEffect(() => {

        const loadRestaurants = async () => {

            try {
                setLoading(true);
                setError("");

                const data = await getMyRestaurants();

                setRestaurants(data);

                const approvedRestaurants = data.filter(
                    restaurant => restaurant.status === "APPROVED"
                );

                if (approvedRestaurants.length > 0) {
                    setSelectedRestaurant(
                        String(approvedRestaurants[0].id)
                    );
                }

            } catch (err) {
                console.error(err);
                setError("Unable to load your restaurants.");
            } finally {
                setLoading(false);
            }
        };

        loadRestaurants();

    }, []);

    // Load orders whenever the selected restaurant changes.
    useEffect(() => {

        if (!selectedRestaurant) {
            setOrders([]);
            return;
        }

        const loadOrders = async () => {

            try {
                setOrdersLoading(true);
                setError("");

                const data = await getRestaurantOrders(
                    selectedRestaurant
                );

                setOrders(data);

            } catch (err) {
                console.error(err);
                setError("Unable to load restaurant orders.");
            } finally {
                setOrdersLoading(false);
            }
        };

        loadOrders();

    }, [selectedRestaurant]);

    // Approved restaurants.
    const approvedRestaurants = restaurants.filter(
        restaurant => restaurant.status === "APPROVED"
    );

    // Dashboard statistics.
    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
        order => order.status === "PLACED"
    ).length;

    const preparingOrders = orders.filter(
        order => ["CONFIRMED", "PREPARING"].includes(order.status)
    ).length;

    const completedOrders = orders.filter(
        order => order.status === "DELIVERED"
    ).length;

    const totalRevenue = orders
        .filter(order => order.status !== "CANCELLED")
        .reduce(
            (total, order) => total + Number(order.totalAmount || 0),
            0
        );

    // Apply order filter.
    const filteredOrders = orders.filter(order =>
        statusFilter === "ALL" || order.status === statusFilter
    );

    // Refresh restaurant orders.
    const handleRefreshOrders = async () => {

        if (!selectedRestaurant) {
            return;
        }

        try {
            setOrdersLoading(true);
            setError("");

            const data = await getRestaurantOrders(selectedRestaurant);

            setOrders(data);

        } catch (err) {
            console.error(err);
            setError("Unable to refresh restaurant orders.");
        } finally {
            setOrdersLoading(false);
        }
    };

    // Update order status.
    const handleStatusUpdate = async (orderId, status) => {

        if (
            status === "CANCELLED" &&
            !window.confirm("Are you sure you want to cancel this order?")
        ) {
            return;
        }

        try {
            setUpdatingOrder(orderId);
            setError("");

            await updateOrderStatus(orderId, status);

            const updatedOrders = await getRestaurantOrders(
                selectedRestaurant
            );

            setOrders(updatedOrders);

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to update order status."
            );

        } finally {
            setUpdatingOrder(null);
        }
    };

    // Handle restaurant registration form changes.
    const handleRestaurantFormChange = (e) => {

        const { name, value, type, checked } = e.target;

        setRestaurantForm(previous => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    // Submit a new restaurant registration.
    const handleRestaurantSubmit = async (e) => {

        e.preventDefault();

        try {
            setCreatingRestaurant(true);
            setRegistrationMessage("");
            setError("");

            const restaurantData = {
                ...restaurantForm,

                latitude: restaurantForm.latitude === ""
                    ? null
                    : Number(restaurantForm.latitude),

                longitude: restaurantForm.longitude === ""
                    ? null
                    : Number(restaurantForm.longitude)
            };

            const newRestaurant = await createRestaurant(
                restaurantData
            );

            setRestaurants(previous => [
                ...previous,
                newRestaurant
            ]);

            setRestaurantForm(initialRestaurantForm);

            setRegistrationMessage(
                "Restaurant registered successfully! Awaiting admin approval."
            );

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.detail ||
                "Unable to register restaurant. Please check your details."
            );

        } finally {
            setCreatingRestaurant(false);
        }
    };

    if (loading) {

        return (
            <div className="restaurant-owner-dashboard">
                <p>Loading restaurant dashboard...</p>
            </div>
        );
    }

    return (

        <div className="restaurant-owner-dashboard">

            <div className="owner-dashboard-shell">

                {/* SIDEBAR */}

                <aside className="owner-sidebar">

                    <div className="owner-sidebar-brand">
                        🍽 FoodieExpress
                    </div>

                    <p className="owner-sidebar-label">
                        RESTAURANT OWNER
                    </p>

                    <nav
                        className="owner-sidebar-nav"
                        aria-label="Restaurant owner navigation"
                    >

                        <a href="#overview">
                            📊 Dashboard Overview
                        </a>

                        <a href="#my-restaurants">
                            🏪 My Restaurants
                        </a>

                        <a href="#register-restaurant">
                            ➕ Register Restaurant
                        </a>

                        <a href="#orders">
                            📦 Orders Management
                        </a>

                        <a href="#approval">
                            ✅ Approval Status
                        </a>

                    </nav>

                </aside>

                {/* MAIN DASHBOARD */}

                <main className="owner-dashboard-main">

                    {/* DASHBOARD HEADER */}

                    <h1 id="overview">
                        Restaurant Owner Dashboard
                    </h1>

                    <p>
                        Welcome, {user?.firstName || user?.username || "Owner"}
                    </p>

                    {error && (
                        <p style={{ color: "red" }}>
                            {error}
                        </p>
                    )}

                    {/* MY RESTAURANTS */}

                    <h2 id="my-restaurants">
                        My Restaurants
                    </h2>

                    {restaurants.length === 0 ? (

                        <p>
                            You don't have any restaurants yet.
                        </p>

                    ) : (

                        <div>

                            {approvedRestaurants.length > 0 ? (

                                <>
                                    <label htmlFor="restaurantSelect">
                                        Select Restaurant:
                                    </label>

                                    <select
                                        id="restaurantSelect"
                                        value={selectedRestaurant}
                                        onChange={(e) =>
                                            setSelectedRestaurant(e.target.value)
                                        }
                                    >

                                        {approvedRestaurants.map(restaurant => (

                                            <option
                                                key={restaurant.id}
                                                value={restaurant.id}
                                            >
                                                {restaurant.name} - {restaurant.city}
                                            </option>

                                        ))}

                                    </select>
                                </>

                            ) : (

                                <p>
                                    You don't have an approved restaurant yet.
                                    Orders will be available after approval.
                                </p>

                            )}

                        </div>

                    )}

                    {/* RESTAURANT REGISTRATION */}

                    <section
                        className="owner-registration-panel"
                        id="register-restaurant"
                    >

                        <div className="registration-heading">

                            <div>
                                <h2>Register New Restaurant</h2>

                                <p>
                                    Add your restaurant to FoodieExpress
                                    and start receiving orders.
                                </p>
                            </div>

                            <span className="registration-icon">
                                🏪
                            </span>

                        </div>

                        {registrationMessage && (

                            <p className="registration-success">
                                ✅ {registrationMessage}
                            </p>

                        )}

                        <form onSubmit={handleRestaurantSubmit}>

                            <div className="registration-form-grid">

                                <div className="registration-field">
                                    <label htmlFor="restaurantName">
                                        Restaurant Name *
                                    </label>

                                    <input
                                        id="restaurantName"
                                        type="text"
                                        name="name"
                                        value={restaurantForm.name}
                                        onChange={handleRestaurantFormChange}
                                        maxLength={150}
                                        placeholder="Enter restaurant name"
                                        required
                                    />
                                </div>

                                <div className="registration-field">
                                    <label htmlFor="cuisineType">
                                        Cuisine Type *
                                    </label>

                                    <input
                                        id="cuisineType"
                                        type="text"
                                        name="cuisineType"
                                        value={restaurantForm.cuisineType}
                                        onChange={handleRestaurantFormChange}
                                        maxLength={100}
                                        placeholder="Indian, Chinese, Italian..."
                                        required
                                    />
                                </div>

                                <div className="registration-field registration-wide">
                                    <label htmlFor="restaurantDescription">
                                        Description
                                    </label>

                                    <textarea
                                        id="restaurantDescription"
                                        name="description"
                                        value={restaurantForm.description}
                                        onChange={handleRestaurantFormChange}
                                        maxLength={1000}
                                        rows={3}
                                        placeholder="Describe your restaurant..."
                                    />
                                </div>

                                <div className="registration-field registration-wide">
                                    <label htmlFor="restaurantAddress">
                                        Complete Address *
                                    </label>

                                    <input
                                        id="restaurantAddress"
                                        type="text"
                                        name="address"
                                        value={restaurantForm.address}
                                        onChange={handleRestaurantFormChange}
                                        maxLength={255}
                                        placeholder="Enter restaurant address"
                                        required
                                    />
                                </div>

                                <div className="registration-field">
                                    <label htmlFor="restaurantCity">
                                        City *
                                    </label>

                                    <input
                                        id="restaurantCity"
                                        type="text"
                                        name="city"
                                        value={restaurantForm.city}
                                        onChange={handleRestaurantFormChange}
                                        maxLength={100}
                                        placeholder="Enter city"
                                        required
                                    />
                                </div>

                                <div className="registration-field">
                                    <label htmlFor="restaurantPhone">
                                        Phone Number *
                                    </label>

                                    <input
                                        id="restaurantPhone"
                                        type="tel"
                                        name="phone"
                                        value={restaurantForm.phone}
                                        onChange={handleRestaurantFormChange}
                                        pattern="[0-9+() -]{7,20}"
                                        maxLength={20}
                                        placeholder="+91 9876543210"
                                        required
                                    />
                                </div>

                                <div className="registration-field">
                                    <label htmlFor="restaurantEmail">
                                        Restaurant Email *
                                    </label>

                                    <input
                                        id="restaurantEmail"
                                        type="email"
                                        name="email"
                                        value={restaurantForm.email}
                                        onChange={handleRestaurantFormChange}
                                        maxLength={150}
                                        placeholder="restaurant@example.com"
                                        required
                                    />
                                </div>

                                <div className="registration-field">
                                    <label htmlFor="restaurantImage">
                                        Restaurant Image URL
                                    </label>

                                    <input
                                        id="restaurantImage"
                                        type="url"
                                        name="imageUrl"
                                        value={restaurantForm.imageUrl}
                                        onChange={handleRestaurantFormChange}
                                        maxLength={500}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div className="registration-field">
                                    <label htmlFor="openingTime">
                                        Opening Time
                                    </label>

                                    <input
                                        id="openingTime"
                                        type="time"
                                        name="openingTime"
                                        value={restaurantForm.openingTime}
                                        onChange={handleRestaurantFormChange}
                                    />
                                </div>

                                <div className="registration-field">
                                    <label htmlFor="closingTime">
                                        Closing Time
                                    </label>

                                    <input
                                        id="closingTime"
                                        type="time"
                                        name="closingTime"
                                        value={restaurantForm.closingTime}
                                        onChange={handleRestaurantFormChange}
                                    />
                                </div>

                                <div className="registration-field">
                                    <label htmlFor="latitude">
                                        Latitude
                                    </label>

                                    <input
                                        id="latitude"
                                        type="number"
                                        name="latitude"
                                        value={restaurantForm.latitude}
                                        onChange={handleRestaurantFormChange}
                                        min="-90"
                                        max="90"
                                        step="any"
                                        placeholder="26.9124"
                                    />
                                </div>

                                <div className="registration-field">
                                    <label htmlFor="longitude">
                                        Longitude
                                    </label>

                                    <input
                                        id="longitude"
                                        type="number"
                                        name="longitude"
                                        value={restaurantForm.longitude}
                                        onChange={handleRestaurantFormChange}
                                        min="-180"
                                        max="180"
                                        step="any"
                                        placeholder="75.7873"
                                    />
                                </div>

                                <div className="registration-field registration-wide">

                                    <label className="delivery-checkbox">

                                        <input
                                            type="checkbox"
                                            name="deliveryAvailable"
                                            checked={restaurantForm.deliveryAvailable}
                                            onChange={handleRestaurantFormChange}
                                        />

                                        Delivery service available

                                    </label>

                                </div>

                            </div>

                            <button
                                type="submit"
                                className="register-restaurant-btn"
                                disabled={creatingRestaurant}
                            >
                                {creatingRestaurant
                                    ? "Registering Restaurant..."
                                    : "➕ Register Restaurant"
                                }
                            </button>

                        </form>

                    </section>

                    {/* ANALYTICS CARDS */}

                    <div className="owner-stats-grid">

                        <div className="owner-stat-card stat-purple">
                            <span className="stat-icon">📦</span>
                            <p>Total Orders</p>
                            <h3>{totalOrders}</h3>
                        </div>

                        <div className="owner-stat-card stat-orange">
                            <span className="stat-icon">🕒</span>
                            <p>New Orders</p>
                            <h3>{pendingOrders}</h3>
                        </div>

                        <div className="owner-stat-card stat-blue">
                            <span className="stat-icon">👨‍🍳</span>
                            <p>Preparing Orders</p>
                            <h3>{preparingOrders}</h3>
                        </div>

                        <div className="owner-stat-card stat-green">
                            <span className="stat-icon">✅</span>
                            <p>Completed Orders</p>
                            <h3>{completedOrders}</h3>
                        </div>

                        <div className="owner-stat-card stat-pink">
                            <span className="stat-icon">₹</span>
                            <p>Order Value</p>
                            <h3>₹{totalRevenue.toFixed(2)}</h3>
                        </div>

                    </div>

                    {/* ORDERS SECTION */}

                    <div className="orders-heading">

                        <h2 id="orders">
                            Restaurant Orders
                        </h2>

                        <div className="orders-heading-actions">

                            <span className="orders-count">
                                {filteredOrders.length} Orders
                            </span>

                            <button
                                className="refresh-orders-btn"
                                onClick={handleRefreshOrders}
                                disabled={ordersLoading || !selectedRestaurant}
                            >
                                ↻ {ordersLoading ? "Refreshing..." : "Refresh"}
                            </button>

                        </div>

                    </div>

                    {/* ORDER FILTERS */}

                    <div className="order-filter-bar">

                        {[
                            "ALL",
                            "PLACED",
                            "CONFIRMED",
                            "PREPARING",
                            "READY_FOR_PICKUP",
                            "DELIVERED",
                            "CANCELLED"
                        ].map(status => (

                            <button
                                key={status}
                                className={
                                    statusFilter === status ? "active" : ""
                                }
                                onClick={() => setStatusFilter(status)}
                            >
                                {status === "ALL"
                                    ? "All Orders"
                                    : status.replaceAll("_", " ")
                                }
                            </button>

                        ))}

                    </div>

                    {/* ORDER LIST */}

                    {ordersLoading ? (

                        <p>Loading orders...</p>

                    ) : filteredOrders.length === 0 ? (

                        <p>
                            No orders found for this restaurant.
                        </p>

                    ) : (

                        <div className="restaurant-orders-list">

                            {filteredOrders.map(order => (

                                <div
                                    key={order.id}
                                    className="restaurant-order-card"
                                >

                                    <h3>
                                        Order #{order.id}
                                    </h3>

                                    <p className="order-status-row">

                                        <strong>Status:</strong>

                                        <span
                                            className={`order-status-badge status-${order.status.toLowerCase()}`}
                                        >
                                            {order.status.replaceAll("_", " ")}
                                        </span>

                                    </p>

                                    <p>
                                        <strong>Amount:</strong> ₹
                                        {Number(order.totalAmount || 0).toFixed(2)}
                                    </p>

                                    <p>
                                        <strong>Delivery Address:</strong>{" "}
                                        {order.deliveryAddress}
                                    </p>

                                    <p>
                                        <strong>Payment:</strong>{" "}
                                        {order.paymentStatus}
                                    </p>

                                    <h4>Items</h4>

                                    {order.items?.map(item => (

                                        <p key={item.id}>
                                            {item.itemName} × {item.quantity}
                                            {" - ₹"}
                                            {Number(item.subtotal || 0).toFixed(2)}
                                        </p>

                                    ))}

                                    {order.specialInstructions && (

                                        <p>
                                            <strong>Instructions:</strong>{" "}
                                            {order.specialInstructions}
                                        </p>

                                    )}

                                    {/* ORDER ACTIONS */}

                                    <div className="order-actions">

                                        {order.status === "PLACED" && (

                                            <>

                                                <button
                                                    disabled={updatingOrder === order.id}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            order.id,
                                                            "CONFIRMED"
                                                        )
                                                    }
                                                >
                                                    Confirm Order
                                                </button>

                                                <button
                                                    disabled={updatingOrder === order.id}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            order.id,
                                                            "CANCELLED"
                                                        )
                                                    }
                                                >
                                                    Cancel Order
                                                </button>

                                            </>

                                        )}

                                        {order.status === "CONFIRMED" && (

                                            <>

                                                <button
                                                    disabled={updatingOrder === order.id}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            order.id,
                                                            "PREPARING"
                                                        )
                                                    }
                                                >
                                                    Start Preparing
                                                </button>

                                                <button
                                                    disabled={updatingOrder === order.id}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            order.id,
                                                            "CANCELLED"
                                                        )
                                                    }
                                                >
                                                    Cancel Order
                                                </button>

                                            </>

                                        )}

                                        {order.status === "PREPARING" && (

                                            <button
                                                disabled={updatingOrder === order.id}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        order.id,
                                                        "READY_FOR_PICKUP"
                                                    )
                                                }
                                            >
                                                Mark Ready for Pickup
                                            </button>

                                        )}

                                        {order.status === "READY_FOR_PICKUP" && (

                                            <p>
                                                Waiting for delivery partner pickup.
                                            </p>

                                        )}

                                        {order.status === "DELIVERED" && (

                                            <p>
                                                Order successfully delivered.
                                            </p>

                                        )}

                                        {order.status === "CANCELLED" && (

                                            <p>
                                                Order cancelled.
                                            </p>

                                        )}

                                    </div>

                                    {updatingOrder === order.id && (

                                        <p>
                                            Updating order...
                                        </p>

                                    )}

                                </div>

                            ))}

                        </div>

                    )}

                    {/* RESTAURANT APPROVAL STATUS */}

                    <h2 id="approval">
                        Restaurant Approval Status
                    </h2>

                    {restaurants.map(restaurant => (

                        <div key={restaurant.id}>

                            <strong>
                                {restaurant.name}
                            </strong>

                            {" - "}

                            {restaurant.status}

                        </div>

                    ))}

                </main>

            </div>

        </div>

    );
}
