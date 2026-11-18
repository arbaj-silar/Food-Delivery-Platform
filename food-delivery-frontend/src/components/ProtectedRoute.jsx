import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {

    const { authenticated, roles, initialized } = useAuth();

    if (!initialized) {
        return <div className="auth-loading">Restoring your session...</div>;
    }

    // Redirect unauthenticated users to custom login
    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check whether the user has the required role
    if (
        allowedRoles.length > 0 &&
        !allowedRoles.some(role => roles.includes(role))
    ) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}