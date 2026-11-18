
import { useCallback, useEffect, useState } from "react";

import {
    MapPin,
    Navigation,
    RefreshCw,
    Truck,
    Package,
    LocateFixed,
    AlertCircle,
    Clock,
    CheckCircle2
} from "lucide-react";

import {
    getMyAssignments,
    updateDeliveryLocation
} from "../../services/deliveryService";

import "../../styles/delivery/DeliveryTracking.css";

export default function DeliveryTracking() {

    const [deliveries, setDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingLocation, setUpdatingLocation] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [location, setLocation] = useState(null);

    const loadDeliveries = useCallback(async (isRefresh = false) => {

        try {

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await getMyAssignments();

            const activeDeliveries = Array.isArray(response)
                ? response.filter(delivery =>
                    ["ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(
                        delivery.status
                    )
                )
                : [];

            setDeliveries(activeDeliveries);

            setSelectedDelivery(previous => {

                if (!previous) {
                    return activeDeliveries[0] || null;
                }

                return activeDeliveries.find(
                    delivery => delivery.id === previous.id
                ) || activeDeliveries[0] || null;

            });

        } catch (err) {

            console.error("Delivery tracking error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load your active deliveries."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }

    }, []);

    useEffect(() => {
        loadDeliveries();
    }, [loadDeliveries]);

    const handleShareLocation = () => {

        if (!selectedDelivery) {
            setError("No active delivery selected.");
            return;
        }

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by this browser.");
            return;
        }

        setUpdatingLocation(true);
        setError("");
        setSuccess("");

        navigator.geolocation.getCurrentPosition(
            async position => {

                try {

                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    await updateDeliveryLocation(
                        selectedDelivery.id,
                        latitude,
                        longitude
                    );

                    setLocation({
                        latitude,
                        longitude,
                        updatedAt: new Date()
                    });

                    setSuccess("Your delivery location was updated successfully.");

                } catch (err) {

                    console.error("Location update error:", err);

                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Unable to update your location."
                    );

                } finally {

                    setUpdatingLocation(false);

                }

            },

            geoError => {

                const messages = {
                    1: "Location permission was denied. Please allow location access.",
                    2: "Your current location is unavailable.",
                    3: "Location request timed out. Please try again."
                };

                setError(
                    messages[geoError.code] ||
                    "Unable to get your current location."
                );

                setUpdatingLocation(false);

            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );

    };

    if (loading) {
        return (
            <div className="delivery-tracking-loading">
                <div className="delivery-tracking-spinner"></div>
                <p>Loading delivery tracking...</p>
            </div>
        );
    }

    return (
        <div className="delivery-tracking-page">

            {/* Header */}
            <div className="delivery-tracking-header">

                <div>
                    <div className="delivery-tracking-eyebrow">
                        <Navigation size={15} />
                        LOCATION MANAGEMENT
                    </div>

                    <h2>Live Delivery Tracking</h2>

                    <p>
                        Share your current location while completing deliveries.
                    </p>
                </div>

                <button
                    type="button"
                    className="delivery-tracking-refresh"
                    onClick={() => loadDeliveries(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={16}
                        className={refreshing ? "spinning" : ""}
                    />
                    Refresh
                </button>

            </div>

            {/* Alerts */}
            {error && (
                <div className="delivery-tracking-alert error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="delivery-tracking-alert success">
                    <CheckCircle2 size={18} />
                    {success}
                </div>
            )}

            {deliveries.length === 0 ? (

                <div className="delivery-tracking-empty">

                    <div className="delivery-tracking-empty-icon">
                        <MapPin size={34} />
                    </div>

                    <h3>No Active Deliveries</h3>

                    <p>
                        You don't currently have an active delivery to track.
                        Once you accept an assignment, it will appear here.
                    </p>

                    <button
                        type="button"
                        onClick={() => loadDeliveries(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw size={16} />
                        Check Again
                    </button>

                </div>

            ) : (

                <div className="delivery-tracking-content">

                    {/* Delivery Selection */}
                    <section className="delivery-tracking-list">

                        <div className="delivery-tracking-section-heading">
                            <div>
                                <h3>Active Deliveries</h3>
                                <p>{deliveries.length} active assignment(s)</p>
                            </div>

                            <span>{deliveries.length}</span>
                        </div>

                        {deliveries.map(delivery => (

                            <button
                                type="button"
                                key={delivery.id}
                                className={`delivery-tracking-delivery-card ${
                                    selectedDelivery?.id === delivery.id
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() => {
                                    setSelectedDelivery(delivery);
                                    setLocation(null);
                                    setSuccess("");
                                }}
                            >

                                <div className="delivery-tracking-card-icon">
                                    <Package size={21} />
                                </div>

                                <div className="delivery-tracking-card-info">
                                    <strong>
                                        Order #{delivery.orderId || delivery.id}
                                    </strong>

                                    <span>
                                        {delivery.status?.replaceAll("_", " ")}
                                    </span>
                                </div>

                                <MapPin size={17} />

                            </button>

                        ))}

                    </section>

                    {/* Selected Delivery Details */}
                    {selectedDelivery && (

                        <section className="delivery-tracking-details">

                            <div className="delivery-tracking-section-heading">
                                <div>
                                    <h3>Tracking Details</h3>
                                    <p>Selected delivery information</p>
                                </div>

                                <span className="delivery-tracking-live-badge">
                                    <span></span>
                                    ACTIVE
                                </span>
                            </div>

                            <div className="delivery-tracking-order-info">

                                <div>
                                    <span>Order Number</span>
                                    <strong>
                                        #{selectedDelivery.orderId || selectedDelivery.id}
                                    </strong>
                                </div>

                                <div>
                                    <span>Delivery Status</span>
                                    <strong>
                                        {selectedDelivery.status?.replaceAll("_", " ")}
                                    </strong>
                                </div>

                            </div>

                            <div className="delivery-tracking-address">

                                <div className="delivery-tracking-address-icon">
                                    <MapPin size={20} />
                                </div>

                                <div>
                                    <span>Customer Delivery Address</span>

                                    <strong>
                                        {selectedDelivery.deliveryAddress ||
                                            selectedDelivery.address ||
                                            "Address not available"}
                                    </strong>
                                </div>

                            </div>

                            {/* Location Sharing */}
                            <div className="delivery-location-panel">

                                <div className="delivery-location-panel-heading">
                                    <div className="delivery-location-icon">
                                        <LocateFixed size={21} />
                                    </div>

                                    <div>
                                        <h4>Your Current Location</h4>
                                        <p>GPS location sharing</p>
                                    </div>
                                </div>

                                {location ? (

                                    <div className="delivery-location-coordinates">

                                        <div>
                                            <span>Latitude</span>
                                            <strong>{location.latitude.toFixed(6)}</strong>
                                        </div>

                                        <div>
                                            <span>Longitude</span>
                                            <strong>{location.longitude.toFixed(6)}</strong>
                                        </div>

                                        <small>
                                            <Clock size={13} />
                                            Updated at {location.updatedAt.toLocaleTimeString()}
                                        </small>

                                    </div>

                                ) : (

                                    <p className="delivery-location-placeholder">
                                        Your current GPS location has not been
                                        shared in this session.
                                    </p>

                                )}

                                <button
                                    type="button"
                                    className="delivery-share-location-btn"
                                    onClick={handleShareLocation}
                                    disabled={updatingLocation}
                                >
                                    {updatingLocation ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className="spinning"
                                            />
                                            Updating Location...
                                        </>
                                    ) : (
                                        <>
                                            <Navigation size={17} />
                                            Share Current Location
                                        </>
                                    )}
                                </button>

                            </div>

                            <div className="delivery-tracking-info-note">
                                <Truck size={18} />

                                <p>
                                    Location sharing sends your GPS coordinates
                                    to FoodExpress when you press the button.
                                    This page does not continuously track your
                                    location in the background.
                                </p>

                            </div>

                        </section>

                    )}

                </div>

            )}

        </div>
    );
}
