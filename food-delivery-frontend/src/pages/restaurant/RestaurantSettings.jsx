
import { useEffect, useState } from "react";
import {
    Store,
    Save,
    RefreshCw,
    MapPin,
    Clock,
    Phone,
    Mail,
    Truck
} from "lucide-react";

import {
    getMyRestaurants,
    updateRestaurant
} from "../../services/restaurantService";

import "../../styles/restaurant/RestaurantSettings.css";

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

export default function RestaurantSettings() {

    const [restaurants, setRestaurants] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [form, setForm] = useState(initialForm);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadRestaurants = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getMyRestaurants();
            const list = Array.isArray(data) ? data : [];

            setRestaurants(list);

            if (list.length > 0) {
                const selected = list.find(
                    item => String(item.id) === String(selectedId)
                ) || list[0];

                setSelectedId(String(selected.id));
                populateForm(selected);
            } else {
                setSelectedId("");
                setForm(initialForm);
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load restaurant details."
            );
        } finally {
            setLoading(false);
        }
    };

    const populateForm = (restaurant) => {
        setForm({
            name: restaurant.name || "",
            description: restaurant.description || "",
            address: restaurant.address || "",
            latitude: restaurant.latitude ?? "",
            longitude: restaurant.longitude ?? "",
            city: restaurant.city || "",
            phone: restaurant.phone || "",
            email: restaurant.email || "",
            cuisineType: restaurant.cuisineType || "",
            imageUrl: restaurant.imageUrl || "",
            openingTime: restaurant.openingTime || "",
            closingTime: restaurant.closingTime || "",
            deliveryAvailable: Boolean(restaurant.deliveryAvailable)
        });
    };

    useEffect(() => {
        loadRestaurants();
    }, []);

    const handleRestaurantChange = (e) => {
        const id = e.target.value;
        setSelectedId(id);
        setMessage("");
        setError("");

        const selected = restaurants.find(
            restaurant => String(restaurant.id) === id
        );

        if (selected) {
            populateForm(selected);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedId) {
            setError("Please select a restaurant.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const restaurantData = {
                ...form,
                latitude: form.latitude !== ""
                    ? Number(form.latitude)
                    : null,
                longitude: form.longitude !== ""
                    ? Number(form.longitude)
                    : null
            };

            const updated = await updateRestaurant(
                selectedId,
                restaurantData
            );

            setRestaurants(prev =>
                prev.map(restaurant =>
                    String(restaurant.id) === String(selectedId)
                        ? updated
                        : restaurant
                )
            );

            populateForm(updated);

            setMessage("Restaurant details updated successfully.");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update restaurant details."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="restaurant-settings-page">
                <div className="settings-loading">
                    Loading restaurant settings...
                </div>
            </div>
        );
    }

    return (
        <div className="restaurant-settings-page">

            <div className="settings-page-header">
                <div>
                    <span className="restaurant-eyebrow">
                        BUSINESS CONFIGURATION
                    </span>

                    <h1>Restaurant Settings</h1>

                    <p>
                        Manage your restaurant profile, contact information
                        and business operations.
                    </p>
                </div>

                <button
                    type="button"
                    className="settings-refresh-btn"
                    onClick={loadRestaurants}
                    disabled={saving}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="settings-feedback error">
                    {error}
                </div>
            )}

            {message && (
                <div className="settings-feedback success">
                    {message}
                </div>
            )}

            {restaurants.length === 0 ? (

                <div className="settings-empty-state">
                    <Store size={38} />
                    <h2>No restaurant found</h2>
                    <p>
                        Register a restaurant before managing its settings.
                    </p>
                </div>

            ) : (

                <>
                    <div className="settings-restaurant-selector">
                        <div>
                            <Store size={20} />
                            <span>Select Restaurant</span>
                        </div>

                        <select
                            value={selectedId}
                            onChange={handleRestaurantChange}
                            disabled={saving}
                        >
                            {restaurants.map(restaurant => (
                                <option
                                    key={restaurant.id}
                                    value={restaurant.id}
                                >
                                    {restaurant.name} — #{restaurant.id}
                                </option>
                            ))}
                        </select>
                    </div>

                    <form
                        className="settings-form"
                        onSubmit={handleSubmit}
                    >

                        <section className="settings-section">

                            <div className="settings-section-heading">
                                <div className="settings-section-icon">
                                    <Store size={19} />
                                </div>

                                <div>
                                    <h2>Basic Information</h2>
                                    <p>
                                        Your restaurant's public profile
                                    </p>
                                </div>
                            </div>

                            <div className="settings-form-grid">

                                <label>
                                    Restaurant Name *
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        maxLength={150}
                                        required
                                    />
                                </label>

                                <label>
                                    Cuisine Type *
                                    <input
                                        name="cuisineType"
                                        value={form.cuisineType}
                                        onChange={handleChange}
                                        maxLength={100}
                                        required
                                    />
                                </label>

                                <label className="settings-full-width">
                                    Description
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        maxLength={1000}
                                        rows={4}
                                    />
                                </label>

                                <label className="settings-full-width">
                                    Restaurant Image URL
                                    <input
                                        name="imageUrl"
                                        type="url"
                                        value={form.imageUrl}
                                        onChange={handleChange}
                                        maxLength={500}
                                        placeholder="https://..."
                                    />
                                </label>

                            </div>
                        </section>

                        <section className="settings-section">

                            <div className="settings-section-heading">
                                <div className="settings-section-icon">
                                    <MapPin size={19} />
                                </div>

                                <div>
                                    <h2>Location Details</h2>
                                    <p>
                                        Your restaurant address and coordinates
                                    </p>
                                </div>
                            </div>

                            <div className="settings-form-grid">

                                <label className="settings-full-width">
                                    Street Address *
                                    <input
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        maxLength={255}
                                        required
                                    />
                                </label>

                                <label>
                                    City *
                                    <input
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        maxLength={100}
                                        required
                                    />
                                </label>

                                <label>
                                    Latitude
                                    <input
                                        type="number"
                                        step="any"
                                        min="-90"
                                        max="90"
                                        name="latitude"
                                        value={form.latitude}
                                        onChange={handleChange}
                                    />
                                </label>

                                <label>
                                    Longitude
                                    <input
                                        type="number"
                                        step="any"
                                        min="-180"
                                        max="180"
                                        name="longitude"
                                        value={form.longitude}
                                        onChange={handleChange}
                                    />
                                </label>

                            </div>
                        </section>

                        <section className="settings-section">

                            <div className="settings-section-heading">
                                <div className="settings-section-icon">
                                    <Phone size={19} />
                                </div>

                                <div>
                                    <h2>Contact Information</h2>
                                    <p>
                                        How customers can reach your restaurant
                                    </p>
                                </div>
                            </div>

                            <div className="settings-form-grid">

                                <label>
                                    Phone Number *
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        pattern="[0-9+()\- ]{7,20}"
                                        maxLength={20}
                                        required
                                    />
                                </label>

                                <label>
                                    Email Address *
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        maxLength={150}
                                        required
                                    />
                                </label>

                            </div>
                        </section>

                        <section className="settings-section">

                            <div className="settings-section-heading">
                                <div className="settings-section-icon">
                                    <Clock size={19} />
                                </div>

                                <div>
                                    <h2>Business Hours</h2>
                                    <p>
                                        Set your daily operating hours
                                    </p>
                                </div>
                            </div>

                            <div className="settings-form-grid">

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

                            </div>
                        </section>

                        <section className="settings-section">

                            <div className="settings-section-heading">
                                <div className="settings-section-icon">
                                    <Truck size={19} />
                                </div>

                                <div>
                                    <h2>Delivery Configuration</h2>
                                    <p>
                                        Control your delivery service
                                    </p>
                                </div>
                            </div>

                            <label className="settings-delivery-toggle">
                                <input
                                    type="checkbox"
                                    name="deliveryAvailable"
                                    checked={form.deliveryAvailable}
                                    onChange={handleChange}
                                />

                                <span>
                                    <strong>Delivery service available</strong>
                                    <small>
                                        Allow customers to order delivery
                                        from your restaurant.
                                    </small>
                                </span>
                            </label>

                        </section>

                        <div className="settings-form-actions">
                            <button
                                type="submit"
                                className="settings-save-btn"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving ? "Saving Changes..." : "Save Changes"}
                            </button>
                        </div>

                    </form>
                </>
            )}

        </div>
    );
}
