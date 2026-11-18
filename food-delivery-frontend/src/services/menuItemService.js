
import api from "../api/api";

// Get available menu items for customers
export const getRestaurantMenu = async (restaurantId) => {
    const response = await api.get(
        `/api/menu-items/restaurant/${restaurantId}`
    );
    return response.data;
};

// Get all menu items belonging to the owner's restaurant
// Includes unavailable items for management
export const getMyRestaurantMenu = async (restaurantId) => {
    const response = await api.get(
        `/api/menu-items/restaurant/${restaurantId}/mine`
    );
    return response.data;
};

// Get a single menu item
export const getMenuItemById = async (id) => {
    const response = await api.get(`/api/menu-items/${id}`);
    return response.data;
};

// Create a menu item
export const createMenuItem = async (menuItemData) => {
    const response = await api.post(
        "/api/menu-items",
        menuItemData
    );
    return response.data;
};

// Update a menu item
export const updateMenuItem = async (id, menuItemData) => {
    const response = await api.put(
        `/api/menu-items/${id}`,
        menuItemData
    );
    return response.data;
};

// Update menu item availability
export const updateMenuItemAvailability = async (id, available) => {
    const response = await api.patch(
        `/api/menu-items/${id}/availability`,
        { available }
    );
    return response.data;
};

// Delete a menu item
export const deleteMenuItem = async (id) => {
    const response = await api.delete(`/api/menu-items/${id}`);
    return response.data;
};
