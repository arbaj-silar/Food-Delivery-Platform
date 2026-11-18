
import { useEffect, useState } from "react";
import {
    Store,
    Plus,
    MapPin,
    Phone,
    Clock,
    RefreshCw,
    X
} from "lucide-react";

import {
    getMyRestaurants,
    createRestaurant
} from "../../services/restaurantService";

import "../../styles/restaurant/MyRestaurants.css";

const initialForm = {
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

export default function MyRestaurants() {

    const [restaurants, setRestaurants] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadRestaurants = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getMyRestaurants();
            setRestaurants(Array.isArray(data) ? data : []);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your restaurants."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRestaurants();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setCreating(true);
            setError("");
            setMessage("");

            const restaurantData = {
                ...form,
                latitude: form.latitude ? Number(form.latitude) : null,
                longitude: form.longitude ? Number(form.longitude) : null
            };

            const newRestaurant = await createRestaurant(restaurantData);

            setRestaurants(prev => [
                newRestaurant,
                ...prev
            ]);

            setForm(initialForm);
            setShowForm(false);

            setMessage(
                "Restaurant registration submitted successfully. It is awaiting admin approval."
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Restaurant registration failed. Please check your details."
            );
        } finally {
            setCreating(false);
        }
    };

    const getStatusClass = (status) => {
        switch ((status || "PENDING").toUpperCase()) {
            case "APPROVED":
                return "approved";

            case "REJECTED":
                return "rejected";

            default:
                return "pending";
        }
    };

    return (
        <div className="my-restaurants-page">

            {/* PAGE HEADER */}
            <div className="my-restaurants-header">

                <div>
                    <span className="restaurant-eyebrow">
                        RESTAURANT MANAGEMENT
                    </span>

                    <h1>My Restaurants</h1>

                    <p>
                        Register, view and manage your restaurant businesses.
                    </p>
                </div>

                <div className="my-restaurants-header-actions">

                    <button
                        className="restaurant-refresh-btn"
                        onClick={loadRestaurants}
                        type="button"
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        className="restaurant-add-btn"
                        onClick={() => setShowForm(true)}
                        type="button"
                    >
                        <Plus size={18} />
                        Add Restaurant
                    </button>

                </div>

            </div>

            {/* FEEDBACK */}
            {error && (
                <div className="restaurant-feedback error">
                    {error}
                </div>
            )}

            {message && (
                <div className="restaurant-feedback success">
                    {message}
                </div>
            )}

            {/* RESTAURANT SUMMARY */}
            <div className="my-restaurants-summary">

                <div className="my-restaurants-summary-icon">
                    <Store size={22} />
                </div>

                <div>
                    <span>Total Registered Restaurants</span>
                    <strong>{restaurants.length}</strong>
                </div>

            </div>

            {/* RESTAURANT LIST */}
            <div className="my-restaurants-section">

                <div className="my-restaurants-section-heading">
                    <div>
                        <h2>Your Businesses</h2>
                        <p>All restaurants registered under your account.</p>
                    </div>
                </div>

                {loading ? (

                    <div className="restaurant-empty-state">
                        Loading your restaurants...
                    </div>

                ) : restaurants.length === 0 ? (

                    <div className="restaurant-empty-state">

                        <div className="restaurant-empty-icon">
                            <Store size={30} />
                        </div>

                        <h3>No restaurants registered yet</h3>

                        <p>
                            Start your restaurant business by registering
                            your first restaurant.
                        </p>

                        <button
                            className="restaurant-add-btn"
                            onClick={() => setShowForm(true)}
                            type="button"
                        >
                            <Plus size={17} />
                            Register Restaurant
                        </button>

                    </div>

                ) : (

                    <div className="my-restaurants-grid">

                        {restaurants.map(restaurant => (

                            <article
                                className="my-restaurant-card"
                                key={restaurant.id}
                            >

                                <div className="my-restaurant-image">

                                    {restaurant.imageUrl ? (
                                        <img
                                            src={restaurant.imageUrl}
                                            alt={restaurant.name}
                                        />
                                    ) : (
                                        <Store size={38} />
                                    )}

                                    <span
                                        className={`restaurant-status ${getStatusClass(restaurant.status)}`}
                                    >
                                        {restaurant.status || "PENDING"}
                                    </span>

                                </div>

                                <div className="my-restaurant-details">

                                    <div className="my-restaurant-title">
                                        <h3>{restaurant.name}</h3>

                                        <span>
                                            {restaurant.cuisineType || "Cuisine not specified"}
                                        </span>
                                    </div>

                                    <p className="my-restaurant-description">
                                        {restaurant.description ||
                                            "No restaurant description available."}
                                    </p>

                                    <div className="my-restaurant-info">
                                        <MapPin size={15} />
                                        <span>
                                            {restaurant.address}, {restaurant.city}
                                        </span>
                                    </div>

                                    <div className="my-restaurant-info">
                                        <Phone size={15} />
                                        <span>{restaurant.phone || "Phone not provided"}</span>
                                    </div>

                                    <div className="my-restaurant-info">
                                        <Clock size={15} />
                                        <span>
                                            {restaurant.openingTime || "--:--"}
                                            {" - "}
                                            {restaurant.closingTime || "--:--"}
                                        </span>
                                    </div>

                                    <div className="my-restaurant-footer">
                                        <span>
                                            Delivery:{" "}
                                            <strong>
                                                {restaurant.deliveryAvailable
                                                    ? "Available"
                                                    : "Unavailable"}
                                            </strong>
                                        </span>

                                        <span className="restaurant-id">
                                            ID: #{restaurant.id}
                                        </span>
                                    </div>

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </div>

            {/* REGISTRATION MODAL */}
            {showForm && (

                <div
                    className="restaurant-modal-overlay"
                    onClick={() => !creating && setShowForm(false)}
                >

                    <div
                        className="restaurant-modal"
                        onClick={e => e.stopPropagation()}
                    >

                        <div className="restaurant-modal-header">

                            <div>
                                <span className="restaurant-eyebrow">
                                    NEW BUSINESS
                                </span>
                                <h2>Register Restaurant</h2>
                                <p>Enter your restaurant information below.</p>
                            </div>

                            <button
                                type="button"
                                className="restaurant-modal-close"
                                onClick={() => setShowForm(false)}
                                disabled={creating}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="restaurant-form-grid">

                                <label>
                                    Restaurant Name *
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Spice Garden"
                                        required
                                    />
                                </label>

                                <label>
                                    Cuisine Type *
                                    <input
                                        name="cuisineType"
                                        value={form.cuisineType}
                                        onChange={handleChange}
                                        placeholder="e.g. Indian"
                                        required
                                    />
                                </label>

                                <label className="full-width">
                                    Description
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="Describe your restaurant..."
                                        rows="3"
                                    />
                                </label>

                                <label className="full-width">
                                    Address *
                                    <input
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        placeholder="Street address"
                                        required
                                    />
                                </label>

                                <label>
                                    City *
                                    <input
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                        required
                                    />
                                </label>

                                <label>
                                    Phone *
                                    <input
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="Contact number"
                                        required
                                    />
                                </label>

                                <label>
                                    Email *
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="restaurant@example.com"
                                        required
                                    />
                                </label>

                                <label>
                                    Restaurant Image URL
                                    <input
                                        name="imageUrl"
                                        value={form.imageUrl}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                    />
                                </label>

                                <label>
                                    Opening Time *
                                    <input
                                        type="time"
                                        name="openingTime"
                                        value={form.openingTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Closing Time *
                                    <input
                                        type="time"
                                        name="closingTime"
                                        value={form.closingTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Latitude
                                    <input
                                        type="number"
                                        step="any"
                                        name="latitude"
                                        value={form.latitude}
                                        onChange={handleChange}
                                        placeholder="26.9157"
                                    />
                                </label>

                                <label>
                                    Longitude
                                    <input
                                        type="number"
                                        step="any"
                                        name="longitude"
                                        value={form.longitude}
                                        onChange={handleChange}
                                        placeholder="75.8180"
                                    />
                                </label>

                                <label className="restaurant-delivery-checkbox full-width">
                                    <input
                                        type="checkbox"
                                        name="deliveryAvailable"
                                        checked={form.deliveryAvailable}
                                        onChange={handleChange}
                                    />
                                    Delivery service available
                                </label>

                            </div>

                            <div className="restaurant-modal-actions">

                                <button
                                    type="button"
                                    className="restaurant-cancel-btn"
                                    onClick={() => setShowForm(false)}
                                    disabled={creating}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="restaurant-add-btn"
                                    disabled={creating}
                                >
                                    {creating
                                        ? "Registering..."
                                        : "Submit Registration"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}
