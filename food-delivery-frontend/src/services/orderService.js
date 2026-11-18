import api from "../api/api";

export const createOrder = async (orderData) => {
  const response = await api.post("/api/orders", orderData);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get("/api/orders/my");
  return response.data;
};

// Fetch orders for a restaurant owned by the logged-in owner
export const getRestaurantOrders = async (restaurantId) => {
    const response = await api.get(
        `/api/orders/restaurant/${restaurantId}`
    );
    return response.data;
};

// Update restaurant order status
export const updateOrderStatus = async (orderId, status) => {
    const response = await api.patch(
        `/api/orders/${orderId}/status`,
        { status }
    );
    return response.data;
};