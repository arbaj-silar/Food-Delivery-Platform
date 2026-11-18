
import api from "../api/api";

// Fetch all approved and active restaurants
export const getApprovedRestaurants = async () => {
    const response = await api.get("/api/restaurants");
    return response.data;
};

// Fetch restaurant details by ID
export const getRestaurantById = async (id) => {
    const response = await api.get(`/api/restaurants/${id}`);
    return response.data;
};

// Fetch restaurants belonging to the logged-in restaurant owner
export const getMyRestaurants = async () => {
    const response = await api.get("/api/restaurants/me");
    return response.data;
};

// ADMIN: Fetch all restaurants regardless of status
export const getAllRestaurants = async () => {
    const response = await api.get("/api/restaurants/admin/all");
    return response.data;
};

// ADMIN: Approve restaurant registration
export const approveRestaurant = async (id) => {
    const response = await api.patch(`/api/restaurants/${id}/approve`);
    return response.data;
};

// ADMIN: Reject restaurant registration
export const rejectRestaurant = async (id) => {
    const response = await api.patch(`/api/restaurants/${id}/reject`);
    return response.data;
};

// ADMIN: Activate or deactivate approved restaurant
export const updateRestaurantStatus = async (id, active) => {
    const response = await api.patch(
        `/api/restaurants/${id}/status`,
        null,
        { params: { active } }
    );
    return response.data;
};

// ADMIN: Reopen a rejected restaurant registration for review
export const reopenRestaurant = async (id) => {
    const response = await api.patch(`/api/restaurants/${id}/reopen`);
    return response.data;
};

// ADMIN: Get restaurant details regardless of status
export const getAdminRestaurantById = async (id) => {
    const response = await api.get(`/api/restaurants/admin/${id}`);
    return response.data;
};

// RESTAURANT OWNER: Register a new restaurant
export const createRestaurant = async (restaurantData) => {
    const response = await api.post(
        "/api/restaurants",
        restaurantData
    );

    return response.data;
};

// RESTAURANT OWNER: Update existing restaurant details
export const updateRestaurant = async (id, restaurantData) => {
    const response = await api.put(
        `/api/restaurants/${id}`,
        restaurantData
    );

    return response.data;
};