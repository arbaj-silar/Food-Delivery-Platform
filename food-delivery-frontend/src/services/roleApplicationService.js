
import api from "../api/api";

// Submit a Restaurant Owner or Delivery Partner application.
export const submitRoleApplication = async (requestedRole) => {
    const response = await api.post("/api/role-applications", {
        requestedRole
    });

    return response.data;
};

// Get the logged-in customer's application history.
export const getMyRoleApplications = async () => {
    const response = await api.get("/api/role-applications/me");

    return response.data;
};
