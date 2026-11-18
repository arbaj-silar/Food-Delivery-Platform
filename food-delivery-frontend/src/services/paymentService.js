
import api from "../api/api";

// CUSTOMER: Create a payment
export const createPayment = async (paymentData) => {
    const response = await api.post(
        "/api/payments",
        paymentData
    );

    return response.data;
};

// CUSTOMER: Get payment by order ID
export const getPaymentByOrderId = async (orderId) => {
    const response = await api.get(
        `/api/payments/order/${orderId}`
    );

    return response.data;
};

// CUSTOMER: Complete payment
export const completePayment = async (orderId, successful) => {
    const response = await api.patch(
        `/api/payments/order/${orderId}/complete`,
        null,
        {
            params: { successful }
        }
    );

    return response.data;
};

// CUSTOMER: Refund payment
export const refundPayment = async (orderId) => {
    const response = await api.patch(
        `/api/payments/order/${orderId}/refund`
    );

    return response.data;
};

// ADMIN: Get all payment transactions
export const getAllPayments = async () => {
    const response = await api.get(
        "/api/payments/admin/all"
    );

    return response.data;
};
