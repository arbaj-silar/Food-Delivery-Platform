
import api from "../api/api";

// Get delivery tracking information for an order
export const getDeliveryByOrderId = async (orderId) => {
    try {
        const response = await api.get(
            `/api/deliveries/order/${orderId}`
        );

        return response.data;
    } catch (error) {
        // No assignment may exist yet
        if (error.response?.status === 404) {
            return null;
        }

        console.error(
            `Failed to fetch delivery for order ${orderId}:`,
            error
        );

        throw error;
    }
};

// Update delivery partner's live GPS location
export const updateDeliveryLocation = async (
    assignmentId,
    latitude,
    longitude
) => {

    // Validate assignment ID and GPS coordinates
    if (
        !assignmentId ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        throw new Error("Invalid delivery location coordinates.");
    }

    try {
        const response = await api.patch(
            `/api/deliveries/${assignmentId}/location`,
            {
                latitude,
                longitude
            }
        );

        return response.data;
    } catch (error) {
        console.error("Failed to update delivery location:", error);
        throw error;
    }
};

// Get assignments for the logged-in delivery partner
export const getMyAssignments = async () => {
    try {
        const response = await api.get("/api/deliveries/my");
        return response.data;
    } catch (error) {
        console.error("Failed to fetch delivery assignments:", error);
        throw error;
    }
};

// Accept delivery assignment
export const acceptDelivery = async (assignmentId) => {
    const response = await api.patch(
        `/api/deliveries/${assignmentId}/accept`
    );

    return response.data;
};

// Reject delivery assignment
export const rejectDelivery = async (
    assignmentId,
    rejectionReason = ""
) => {
    const response = await api.patch(
        `/api/deliveries/${assignmentId}/reject`,
        { rejectionReason }
    );

    return response.data;
};

// Mark order as picked up
export const pickupDelivery = async (assignmentId) => {
    const response = await api.patch(
        `/api/deliveries/${assignmentId}/pickup`
    );

    return response.data;
};

// Start delivery
export const startDelivery = async (assignmentId) => {
    const response = await api.patch(
        `/api/deliveries/${assignmentId}/start`
    );

    return response.data;
};

// Complete delivery
export const completeDelivery = async (assignmentId) => {
    const response = await api.patch(
        `/api/deliveries/${assignmentId}/complete`
    );

    return response.data;
};

// Get logged-in delivery partner's delivery history
export const getMyDeliveryHistory = async () => {
    const response = await api.get("/api/deliveries/my/history");
    return response.data;
};

// Get logged-in delivery partner's statistics
export const getMyDeliveryStatistics = async () => {
    const response = await api.get("/api/deliveries/my/statistics");
    return response.data;
};

// Get logged-in delivery partner profile
export const getMyDeliveryProfile = async () => {
    const response = await api.get("/api/delivery-partners/me");
    return response.data;
};

// Update delivery partner profile
export const updateMyDeliveryProfile = async (profileData) => {
    const response = await api.put(
        "/api/delivery-partners/me",
        profileData
    );
    return response.data;
};

// Update delivery partner availability
export const updateMyAvailability = async (availabilityStatus) => {
    const response = await api.patch(
        "/api/delivery-partners/me/availability",
        { availabilityStatus }
    );
    return response.data;
};
