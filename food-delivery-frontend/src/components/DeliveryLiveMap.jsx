
import { MapPin, Clock, Map } from "lucide-react";

export default function DeliveryLiveMap({
    latitude,
    longitude,
    locationUpdatedAt
}) {
    const hasLocation =
        typeof latitude === "number" &&
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        typeof longitude === "number" &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180;

    const updatedAt = locationUpdatedAt
        ? new Date(locationUpdatedAt)
        : null;

    const hasValidUpdateTime =
        updatedAt && Number.isFinite(updatedAt.getTime());

    const isLocationStale =
        hasValidUpdateTime &&
        Date.now() - updatedAt.getTime() > 2 * 60 * 1000;

    if (!hasLocation) {
        return (
            <div className="delivery-map-unavailable">
                <MapPin size={20} />
                <span>
                    Waiting for the delivery partner's GPS location.
                </span>
            </div>
        );
    }

    const padding = 0.008;

    const bbox = [
        longitude - padding,
        latitude - padding,
        longitude + padding,
        latitude + padding
    ].join(",");

    const mapUrl =
        `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
        `&layer=mapnik&marker=${latitude},${longitude}`;

    return (
        <section className="delivery-live-map">
            <div className="delivery-map-header">
                <div>
                    <h4>
                        <Map size={18} />
                        Live Delivery Location
                    </h4>

                    <p>
                        Latest location shared by your delivery partner
                    </p>
                </div>

                <span
                    className={`live-location-indicator ${isLocationStale || !hasValidUpdateTime ? "stale" : ""
                        }`}
                >
                    <span className="live-dot"></span>

                    {isLocationStale
                        ? "Last Known Location"
                        : hasValidUpdateTime
                            ? "GPS Live"
                            : "GPS Time Unavailable"}
                </span>
            </div>

            <iframe
                title="Delivery partner live location"
                src={mapUrl}
                width="100%"
                height="280"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="delivery-map-footer">
                <span>
                    <MapPin size={14} />
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>

                <span>
                    <Clock size={14} />
                    Updated:{" "}
                    {hasValidUpdateTime
                        ? updatedAt.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit"
                        })
                        : "Not available"}
                </span>
            </div>
        </section>
    );
}
