import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "../../layouts/AdminLayout";
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminRestaurants from "./AdminRestaurants";
import AdminDelivery from "./AdminDelivery";
import AdminNotifications from "./AdminNotifications";
import AdminPayments from "./AdminPayments";
import AdminRoleApplications from "./AdminRoleApplications";

export default function AdminDashboard() {
    return (
        <Routes>
            <Route element={<AdminLayout />}>

                <Route index element={<AdminOverview />} />

                <Route
                    path="users"
                    element={<AdminUsers />}
                />

                <Route
                    path="restaurants"
                    element={<AdminRestaurants />}
                />

                <Route
                    path="delivery"
                    element={<AdminDelivery />}
                />

                <Route
                    path="notifications"
                    element={<AdminNotifications />}
                />

                <Route
                    path="payments"
                    element={<AdminPayments />}
                />

                <Route
                    path="role-applications"
                    element={<AdminRoleApplications />}
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/admin-dashboard"
                            replace
                        />
                    }
                />

            </Route>
        </Routes>
    );
}
