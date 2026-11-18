
import api from "../api/api";

// Get all delivery assignments
export const getAllDeliveries = async () => {
    const response = await api.get("/api/deliveries/admin/all");
    return response.data;
};

// Assign an order to a delivery partner
export const assignDelivery = async (orderId, deliveryPartnerId) => {
    const response = await api.post("/api/deliveries/assign", {
        orderId: Number(orderId),
        deliveryPartnerId: Number(deliveryPartnerId)
    });

    return response.data;
};

// Get orders ready for delivery assignment (Admin only)
export const getReadyForDeliveryOrders = async () => {
    const response = await api.get("/api/deliveries/admin/ready-orders");
    return response.data;
};

// Get available delivery partners (Admin only)
export const getAvailablePartners = async () => {
    const response = await api.get(
        "/api/delivery-partners/admin/available"
    );
    return response.data;
};

// Get all delivery partners (Admin only)
export const getAllPartners = async () => {
    const response = await api.get("/api/delivery-partners/admin/all");
    return response.data;
};

// Activate or deactivate a delivery partner
export const updatePartnerStatus = async (partnerId, active) => {
    const response = await api.patch(
        `/api/delivery-partners/admin/${partnerId}/status`,
        null,
        {
            params: { active }
        }
    );

    return response.data;
};

// Get restaurant-wise performance analytics (Admin only)
export const getRestaurantAnalytics = async () => {
    const response = await api.get(
        "/api/orders/admin/restaurant-analytics"
    );

    return response.data;
};


// ADMIN: Get all pending role applications
export const getPendingRoleApplications = async () => {
    const response = await api.get(
        "/api/role-applications/admin/pending"
    );

    return response.data;
};

// ADMIN: Approve a role application
export const approveRoleApplication = async (applicationId) => {
    const response = await api.patch(
        `/api/role-applications/admin/${applicationId}/approve`
    );

    return response.data;
};

// ADMIN: Reject a role application with a reason
export const rejectRoleApplication = async (
    applicationId,
    reason
) => {
    const response = await api.patch(
        `/api/role-applications/admin/${applicationId}/reject`,
        { reason }
    );

    return response.data;
};

// Get complete role application history
export const getAllRoleApplications = async () => {
    const response = await api.get("/api/role-applications/admin/all");
    return response.data;
};