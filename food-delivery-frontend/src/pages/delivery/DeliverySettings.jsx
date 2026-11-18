
import { useCallback, useEffect, useState } from "react";
import {
    UserRound,
    Phone,
    Bike,
    ShieldCheck,
    CalendarDays,
    RefreshCw,
    Save,
    Pencil,
    X,
    CheckCircle2,
    AlertCircle,
    Power
} from "lucide-react";

import {
    getMyDeliveryProfile,
    updateMyDeliveryProfile,
    updateMyAvailability
} from "../../services/deliveryService";

import "../../styles/delivery/DeliverySettings.css";

const vehicleTypes = ["BIKE", "SCOOTER", "BICYCLE", "CAR"];

function DeliverySettings() {
    const [profile, setProfile] = useState(null);

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        vehicleType: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingAvailability, setUpdatingAvailability] = useState(false);
    const [editing, setEditing] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getMyDeliveryProfile();

            setProfile(data);

            setFormData({
                fullName: data.fullName || "",
                phone: data.phone || "",
                vehicleType: data.vehicleType || ""
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your delivery partner profile."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        const fullName = formData.fullName.trim();
        const phone = formData.phone.trim();

        if (!fullName) {
            setError("Full name is required.");
            return;
        }

        if (!/^\+?[0-9]{10,15}$/.test(phone)) {
            setError("Enter a valid phone number (10–15 digits).");
            return;
        }

        if (!vehicleTypes.includes(formData.vehicleType)) {
            setError("Please select a valid vehicle type.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const updatedProfile = await updateMyDeliveryProfile({
                fullName,
                phone,
                vehicleType: formData.vehicleType
            });

            setProfile(updatedProfile);

            setFormData({
                fullName: updatedProfile.fullName || "",
                phone: updatedProfile.phone || "",
                vehicleType: updatedProfile.vehicleType || ""
            });

            setEditing(false);
            setSuccess("Profile updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update your profile."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            fullName: profile?.fullName || "",
            phone: profile?.phone || "",
            vehicleType: profile?.vehicleType || ""
        });

        setEditing(false);
        setError("");
        setSuccess("");
    };

    const handleAvailabilityChange = async () => {
        if (!profile || updatingAvailability) return;

        if (profile.availabilityStatus === "ON_DELIVERY") {
            setError("Availability cannot be changed while handling a delivery.");
            return;
        }

        const newStatus =
            profile.availabilityStatus === "AVAILABLE"
                ? "UNAVAILABLE"
                : "AVAILABLE";

        try {
            setUpdatingAvailability(true);
            setError("");
            setSuccess("");

            const updatedProfile = await updateMyAvailability(newStatus);

            setProfile(updatedProfile);

            setSuccess(
                newStatus === "AVAILABLE"
                    ? "You are now available for deliveries."
                    : "You are now unavailable for deliveries."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update availability."
            );
        } finally {
            setUpdatingAvailability(false);
        }
    };

    const getAvailabilityLabel = (status) => {
        switch (status) {
            case "AVAILABLE":
                return "Available";
            case "UNAVAILABLE":
                return "Unavailable";
            case "ON_DELIVERY":
                return "On Delivery";
            default:
                return status || "Unknown";
        }
    };

    const formatDate = (date) => {
        if (!date) return "Not available";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    };

    if (loading) {
        return (
            <div className="delivery-settings-loading">
                <RefreshCw className="delivery-settings-spinner" size={30} />
                <p>Loading your profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="delivery-settings-page">
                <div className="delivery-settings-alert error">
                    <AlertCircle size={18} />
                    {error || "Delivery partner profile not found."}
                </div>

                <button
                    className="delivery-settings-button primary"
                    onClick={loadProfile}
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        );
    }

    const isOnDelivery = profile.availabilityStatus === "ON_DELIVERY";
    const isAvailable = profile.availabilityStatus === "AVAILABLE";

    return (
        <div className="delivery-settings-page">

            <div className="delivery-settings-header">
                <div>
                    <span className="delivery-settings-eyebrow">
                        ACCOUNT MANAGEMENT
                    </span>

                    <h1>Profile & Settings</h1>

                    <p>
                        Manage your personal information, vehicle and availability.
                    </p>
                </div>

                <button
                    className="delivery-settings-button secondary"
                    onClick={loadProfile}
                    disabled={saving || updatingAvailability}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="delivery-settings-alert error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="delivery-settings-alert success">
                    <CheckCircle2 size={18} />
                    {success}
                </div>
            )}

            <div className="delivery-settings-grid">

                <section className="delivery-settings-card profile-card">

                    <div className="delivery-settings-card-heading">
                        <div className="delivery-settings-heading-icon">
                            <UserRound size={21} />
                        </div>

                        <div>
                            <h2>Personal Information</h2>
                            <p>Your registered delivery partner details</p>
                        </div>

                        {!editing && (
                            <button
                                className="delivery-settings-edit-button"
                                onClick={() => {
                                    setEditing(true);
                                    setError("");
                                    setSuccess("");
                                }}
                            >
                                <Pencil size={15} />
                                Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSaveProfile}>

                        <div className="delivery-settings-form-grid">

                            <div className="delivery-settings-field">
                                <label htmlFor="fullName">Full Name</label>

                                <div className="delivery-settings-input-wrapper">
                                    <UserRound size={17} />

                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        maxLength={100}
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="delivery-settings-field">
                                <label htmlFor="phone">Phone Number</label>

                                <div className="delivery-settings-input-wrapper">
                                    <Phone size={17} />

                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="delivery-settings-field full-width">
                                <label htmlFor="vehicleType">Vehicle Type</label>

                                <div className="delivery-settings-input-wrapper">
                                    <Bike size={17} />

                                    <select
                                        id="vehicleType"
                                        name="vehicleType"
                                        value={formData.vehicleType}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        required
                                    >
                                        <option value="">Select vehicle</option>

                                        {vehicleTypes.map((vehicle) => (
                                            <option key={vehicle} value={vehicle}>
                                                {vehicle}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                        </div>

                        {editing && (
                            <div className="delivery-settings-form-actions">
                                <button
                                    type="button"
                                    className="delivery-settings-button secondary"
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                >
                                    <X size={16} />
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="delivery-settings-button primary"
                                    disabled={saving}
                                >
                                    <Save size={16} />
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}

                    </form>
                </section>

                <section className="delivery-settings-card availability-card">

                    <div className="delivery-settings-card-heading">
                        <div className="delivery-settings-heading-icon">
                            <Power size={21} />
                        </div>

                        <div>
                            <h2>Delivery Availability</h2>
                            <p>Control whether you can receive assignments</p>
                        </div>
                    </div>

                    <div className="delivery-settings-availability-status">
                        <span
                            className={`delivery-settings-status-dot ${
                                isAvailable
                                    ? "available"
                                    : isOnDelivery
                                        ? "on-delivery"
                                        : "unavailable"
                            }`}
                        />

                        <div>
                            <strong>
                                {getAvailabilityLabel(profile.availabilityStatus)}
                            </strong>

                            <p>
                                {isOnDelivery
                                    ? "You are currently handling a delivery."
                                    : isAvailable
                                        ? "You can receive new delivery assignments."
                                        : "You are not receiving new delivery assignments."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className={`delivery-settings-availability-button ${
                            isAvailable ? "make-unavailable" : "make-available"
                        }`}
                        onClick={handleAvailabilityChange}
                        disabled={updatingAvailability || isOnDelivery || !profile.active}
                    >
                        <Power size={17} />

                        {updatingAvailability
                            ? "Updating..."
                            : isAvailable
                                ? "Go Unavailable"
                                : "Go Available"}
                    </button>

                    {isOnDelivery && (
                        <p className="delivery-settings-info">
                            Your availability is managed by the delivery workflow
                            while you have an active delivery.
                        </p>
                    )}

                    {!profile.active && (
                        <p className="delivery-settings-info warning">
                            Your account is inactive. Contact an administrator
                            to reactivate it.
                        </p>
                    )}

                </section>

                <section className="delivery-settings-card account-card">

                    <div className="delivery-settings-card-heading">
                        <div className="delivery-settings-heading-icon">
                            <ShieldCheck size={21} />
                        </div>

                        <div>
                            <h2>Account Information</h2>
                            <p>Your delivery partner account details</p>
                        </div>
                    </div>

                    <div className="delivery-settings-account-list">

                        <div className="delivery-settings-account-item">
                            <span>Partner ID</span>
                            <strong>#{profile.id}</strong>
                        </div>

                        <div className="delivery-settings-account-item">
                            <span>Account Status</span>

                            <strong className={profile.active ? "active-text" : "inactive-text"}>
                                {profile.active ? "Active" : "Inactive"}
                            </strong>
                        </div>

                        <div className="delivery-settings-account-item">
                            <span>Availability</span>
                            <strong>
                                {getAvailabilityLabel(profile.availabilityStatus)}
                            </strong>
                        </div>

                        <div className="delivery-settings-account-item">
                            <span>Vehicle</span>
                            <strong>{profile.vehicleType || "Not specified"}</strong>
                        </div>

                        <div className="delivery-settings-account-item">
                            <span>Member Since</span>

                            <strong className="date-value">
                                <CalendarDays size={15} />
                                {formatDate(profile.createdAt)}
                            </strong>
                        </div>

                    </div>
                </section>

            </div>
        </div>
    );
}

export default DeliverySettings;
