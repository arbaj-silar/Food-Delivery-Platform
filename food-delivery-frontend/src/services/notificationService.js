
import api from "../api/api";

// CUSTOMER: Get my notifications
export const getMyNotifications = async () => {
    const response = await api.get("/api/notifications/me");
    return response.data;
};

// CUSTOMER: Get unread notifications
export const getUnreadNotifications = async () => {
    const response = await api.get("/api/notifications/me/unread");
    return response.data;
};

// CUSTOMER: Get unread notification count
export const getUnreadCount = async () => {
    const response = await api.get(
        "/api/notifications/me/unread/count"
    );
    return response.data;
};

// CUSTOMER: Get read notifications
export const getReadNotifications = async () => {
    const response = await api.get("/api/notifications/me/read");
    return response.data;
};

// CUSTOMER: Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
    const response = await api.patch(
        `/api/notifications/${notificationId}/read`
    );
    return response.data;
};

// ADMIN: Get all notifications across users
export const getAllNotifications = async () => {
    const response = await api.get(
        "/api/notifications/admin/all"
    );
    return response.data;
};
