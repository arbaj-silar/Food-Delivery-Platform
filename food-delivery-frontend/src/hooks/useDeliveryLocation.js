
import { useEffect, useRef, useState } from "react";
import { updateDeliveryLocation } from "../services/deliveryService";

export default function useDeliveryLocation(assignmentId, enabled) {

    const [sharing, setSharing] = useState(false);
    const [error, setError] = useState("");

    const watchId = useRef(null);
    const isUpdating = useRef(false);

    useEffect(() => {

        // Stop tracking when disabled or assignment ID is missing
        if (!enabled || !assignmentId) {
            setSharing(false);
            setError("");
            return;
        }

        // Check browser GPS support
        if (!navigator.geolocation) {
            setSharing(false);
            setError("Geolocation is not supported by this browser.");
            return;
        }

        // Each effect instance manages its own active state.
        // This prevents old asynchronous callbacks from updating state.
        let active = true;

        setError("");
        setSharing(false);

        watchId.current = navigator.geolocation.watchPosition(

            async (position) => {

                if (!active || isUpdating.current) {
                    return;
                }

                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                isUpdating.current = true;

                try {
                    await updateDeliveryLocation(
                        assignmentId,
                        latitude,
                        longitude
                    );

                    if (!active) return;

                    setSharing(true);
                    setError("");

                } catch (err) {

                    console.error("GPS update failed:", err);

                    if (!active) return;

                    setSharing(false);
                    setError("Unable to update delivery location.");

                } finally {
                    isUpdating.current = false;
                }
            },

            (err) => {

                if (!active) return;

                console.error("GPS error:", err);

                setError(
                    err.message || "Unable to access GPS location."
                );

                setSharing(false);
            },

            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000
            }
        );

        // Cleanup when tracking stops or assignment changes
        return () => {

            active = false;

            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
        };

    }, [assignmentId, enabled]);

    return { sharing, error };
}
