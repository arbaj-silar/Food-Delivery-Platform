
import api from "../api/api";

// Register a new customer
export const registerUser = async (userData) => {
    try {
        const response = await api.post("/api/users", {
            fullName: userData.fullName,
            email: userData.email,
            phone: userData.phone,
            password: userData.password
        });

        return response.data;
    } catch (error) {
        console.error("Customer registration failed:", error);
        throw error;
    }
};

// Get the currently logged-in user's profile
export const getMyProfile = async () => {
    try {
        const response = await api.get("/api/users/me");
        return response.data;
    } catch (error) {
        console.error("Failed to fetch customer profile:", error);
        throw error;
    }
};

// Update the user's own profile
export const updateMyProfile = async (id, profileData) => {
    try {
        const response = await api.put(`/api/users/${id}`, {
            fullName: profileData.fullName,
            phone: profileData.phone
        });

        return response.data;
    } catch (error) {
        console.error("Failed to update customer profile:", error);
        throw error;
    }
};

// ADMIN: Get users with pagination, keyword search and status filter
export const getAllUsers = async ({
    page = 0,
    size = 10,
    keyword = "",
    status = ""
} = {}) => {
    try {
        const params = {
            page,
            size
        };

        if (keyword.trim()) {
            params.keyword = keyword.trim();
        }

        if (status) {
            params.status = status;
        }

        const response = await api.get("/api/users", { params });
        return response.data;
    } catch (error) {
        console.error("Failed to fetch users:", error);
        throw error;
    }
};

// ADMIN: Get a user by ID
export const getUserById = async (userId) => {
    try {
        const response = await api.get(`/api/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch user details:", error);
        throw error;
    }
};

// ADMIN: Activate a user account
export const activateUser = async (userId) => {
    try {
        const response = await api.patch(`/api/users/${userId}/activate`);
        return response.data;
    } catch (error) {
        console.error("Failed to activate user:", error);
        throw error;
    }
};

// ADMIN: Deactivate a user account
export const deactivateUser = async (userId) => {
    try {
        const response = await api.patch(`/api/users/${userId}/deactivate`);
        return response.data;
    } catch (error) {
        console.error("Failed to deactivate user:", error);
        throw error;
    }
};

// ADMIN: Delete a user account
export const deleteUser = async (userId) => {
    try {
        const response = await api.delete(`/api/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to delete user:", error);
        throw error;
    }
};
