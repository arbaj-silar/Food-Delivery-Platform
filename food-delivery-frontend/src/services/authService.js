
import api from "../api/api";
import {
    setAccessToken,
    clearAccessToken
} from "./authToken";

// Login with email and password.
export const loginUser = async (email, password) => {
    try {
        const response = await api.post("/api/auth/login", {
            email,
            password
        });

        setAccessToken(response.data.accessToken);

        return response.data;

    } catch (error) {
        clearAccessToken();
        throw error;
    }
};

// Restore the session using the HttpOnly refresh-token cookie.
export const refreshSession = async () => {
    try {
        const response = await api.post("/api/auth/refresh");

        setAccessToken(response.data.accessToken);

        return response.data;

    } catch (error) {
        clearAccessToken();
        throw error;
    }
};

// Clear the in-memory access token.
export const logoutUser = async () => {
    clearAccessToken();

    try {
        await api.post("/api/auth/logout");
    } catch (error) {
        console.error("Backend logout error:", error);
        throw error;
    }
};
