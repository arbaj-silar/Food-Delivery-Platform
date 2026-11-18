import useDeliveryLocation from "../hooks/useDeliveryLocation";
import { MapPin, MapPinOff, AlertCircle } from "lucide-react";

export default function DeliveryLocationStatus({
    assignmentId,
    status
}) {
    const gpsEnabled =
        status === "PICKED_UP" ||
        status === "OUT_FOR_DELIVERY";

    const { sharing, error } = useDeliveryLocation(
        assignmentId,
        gpsEnabled
    );

    if (!gpsEnabled) {
        return null;
    }

    return (
        <div className="gps-status">

            {error ? (
                <p className="gps-error">
                    <AlertCircle size={16} />
                    {error}
                </p>
            ) : sharing ? (
                <p className="gps-active">
                    <MapPin size={16} />
                    Live location sharing is active
                </p>
            ) : (
                <p className="gps-inactive">
                    <MapPinOff size={16} />
                    Waiting for GPS location...
                </p>
            )}

        </div>
    );
}