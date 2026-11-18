
import { useCallback, useEffect, useState } from "react";
import {
    Search,
    RefreshCw,
    Users,
    UserRound,
    Mail,
    Phone,
    ShieldCheck,
    CalendarDays,
    Eye,
    Ban,
    CheckCircle,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import {
    getAllUsers,
    getUserById,
    activateUser,
    deactivateUser,
    deleteUser
} from "../../services/userService";

import "../../styles/admin/AdminUsers.css";

function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getStatusClass(status) {
    return String(status || "").toLowerCase() === "active"
        ? "active"
        : "inactive";
}

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(0);

    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    const [selectedUser, setSelectedUser] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const PAGE_SIZE = 10;

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getAllUsers({
                page,
                size: PAGE_SIZE,
                keyword,
                status
            });

            // Spring Page response
            const records = Array.isArray(response)
                ? response
                : response?.content || [];

            setUsers(records);
            setTotalPages(response?.totalPages ?? 1);
            setTotalElements(response?.totalElements ?? records.length);
        } catch (err) {
            console.error("Failed to load users:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load users. Please check the user service."
            );
        } finally {
            setLoading(false);
        }
    }, [page, keyword, status]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleSearch = (value) => {
        setKeyword(value);
        setPage(0);
    };

    const handleStatusChange = (value) => {
        setStatus(value);
        setPage(0);
    };

    const handleViewDetails = async (userId) => {
        try {
            setDetailsLoading(true);
            setSelectedUser(null);

            const response = await getUserById(userId);
            setSelectedUser(response);
        } catch (err) {
            console.error("Failed to load user details:", err);
            alert(
                err.response?.data?.message ||
                "Unable to load user details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleAccountStatus = async (user) => {
        const isActive =
            String(user.status || "").toUpperCase() === "ACTIVE";

        const action = isActive ? "deactivate" : "activate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${user.fullName}'s account?`
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);

            if (isActive) {
                await deactivateUser(user.id);
            } else {
                await activateUser(user.id);
            }

            await loadUsers();

            if (selectedUser?.id === user.id) {
                const updatedUser = await getUserById(user.id);
                setSelectedUser(updatedUser);
            }
        } catch (err) {
            console.error("Account status update failed:", err);
            alert(
                err.response?.data?.message ||
                `Unable to ${action} this account.`
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (user) => {
        const confirmed = window.confirm(
            `Delete ${user.fullName}'s account permanently? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);

            await deleteUser(user.id);

            if (selectedUser?.id === user.id) {
                setSelectedUser(null);
            }

            await loadUsers();
        } catch (err) {
            console.error("User deletion failed:", err);
            alert(
                err.response?.data?.message ||
                "Unable to delete this user."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const getRoleClass = (role) => {
        return String(role || "")
            .toLowerCase()
            .replaceAll("_", "-");
    };

    return (
        <div className="admin-users-page">

            {/* PAGE HEADER */}
            <div className="admin-users-header">
                <div>
                    <span className="admin-users-eyebrow">
                        ACCOUNT MANAGEMENT
                    </span>

                    <h2>User Management</h2>

                    <p>
                        View, search and manage registered platform users.
                    </p>
                </div>

                <button
                    className="admin-users-refresh"
                    onClick={loadUsers}
                    disabled={loading}
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>
            </div>

            {/* USER STATISTICS */}
            <div className="admin-users-summary">
                <div className="admin-users-summary-card">
                    <div className="admin-users-summary-icon">
                        <Users size={21} />
                    </div>

                    <div>
                        <span>Total Users</span>
                        <strong>{totalElements}</strong>
                    </div>
                </div>

                <div className="admin-users-summary-card">
                    <div className="admin-users-summary-icon">
                        <UserRound size={21} />
                    </div>

                    <div>
                        <span>Current Page</span>
                        <strong>{users.length}</strong>
                    </div>
                </div>
            </div>

            {/* SEARCH AND FILTER */}
            <div className="admin-users-toolbar">

                <div className="admin-users-search">
                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={keyword}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    aria-label="Filter users by status"
                >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
            </div>

            {/* ERROR */}
            {error && (
                <div className="admin-users-error">
                    {error}
                    <button onClick={loadUsers}>Try again</button>
                </div>
            )}

            {/* USERS TABLE */}
            <div className="admin-users-table-card">

                <div className="admin-users-table-heading">
                    <div>
                        <h3>Registered Users</h3>
                        <p>
                            {totalElements} account(s) found
                        </p>
                    </div>

                    <span className="admin-users-count">
                        {users.length} shown
                    </span>
                </div>

                {loading ? (
                    <div className="admin-users-loading">
                        <RefreshCw className="admin-users-spinner" size={25} />
                        <p>Loading user accounts...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="admin-users-empty">
                        <Users size={35} />
                        <h3>No users found</h3>
                        <p>Try changing your search or status filter.</p>
                    </div>
                ) : (
                    <div className="admin-users-table-wrapper">
                        <table className="admin-users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Contact</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.map((user) => {
                                    const isActive =
                                        String(user.status || "").toUpperCase()
                                        === "ACTIVE";

                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="admin-users-identity">
                                                    <div className="admin-users-avatar">
                                                        {(user.fullName || "U")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {user.fullName || "Unnamed User"}
                                                        </strong>
                                                        <span>#{user.id}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="admin-users-contact">
                                                    <span>
                                                        <Mail size={13} />
                                                        {user.email}
                                                    </span>

                                                    <span>
                                                        <Phone size={13} />
                                                        {user.phone || "Not provided"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <span className={`admin-users-role ${getRoleClass(user.role)}`}>
                                                    {user.role || "—"}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`admin-users-status ${getStatusClass(user.status)}`}>
                                                    {user.status || "UNKNOWN"}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(user.createdAt)}
                                            </td>

                                            <td>
                                                <div className="admin-users-actions">
                                                    <button
                                                        title="View details"
                                                        onClick={() => handleViewDetails(user.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    <button
                                                        title={isActive ? "Deactivate user" : "Activate user"}
                                                        className={isActive ? "deactivate" : "activate"}
                                                        onClick={() => handleAccountStatus(user)}
                                                        disabled={actionLoading}
                                                    >
                                                        {isActive
                                                            ? <Ban size={16} />
                                                            : <CheckCircle size={16} />
                                                        }
                                                    </button>

                                                    <button
                                                        title="Delete user"
                                                        className="delete"
                                                        onClick={() => handleDeleteUser(user)}
                                                        disabled={actionLoading}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {!loading && users.length > 0 && (
                    <div className="admin-users-pagination">
                        <span>
                            Page {page + 1} of {Math.max(totalPages, 1)}
                        </span>

                        <div>
                            <button
                                onClick={() => setPage((current) => Math.max(0, current - 1))}
                                disabled={page === 0}
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>

                            <button
                                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                                disabled={page >= totalPages - 1 || totalPages === 0}
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* USER DETAILS MODAL */}
            {(selectedUser || detailsLoading) && (
                <div
                    className="admin-users-modal-overlay"
                    onClick={() => {
                        if (!detailsLoading) setSelectedUser(null);
                    }}
                >
                    <div
                        className="admin-users-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="admin-users-modal-header">
                            <div>
                                <span>ACCOUNT INFORMATION</span>
                                <h3>User Profile</h3>
                            </div>

                            <button
                                onClick={() => setSelectedUser(null)}
                                disabled={detailsLoading}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {detailsLoading ? (
                            <div className="admin-users-loading">
                                <RefreshCw className="admin-users-spinner" />
                                <p>Loading profile...</p>
                            </div>
                        ) : selectedUser && (
                            <>
                                <div className="admin-users-profile">
                                    <div className="admin-users-profile-avatar">
                                        {(selectedUser.fullName || "U")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <h3>{selectedUser.fullName}</h3>
                                    <p>{selectedUser.email}</p>

                                    <span className={`admin-users-status ${getStatusClass(selectedUser.status)}`}>
                                        {selectedUser.status}
                                    </span>
                                </div>

                                <div className="admin-users-profile-details">
                                    <div>
                                        <UserRound size={17} />
                                        <span>
                                            <small>Full Name</small>
                                            <strong>{selectedUser.fullName || "—"}</strong>
                                        </span>
                                    </div>

                                    <div>
                                        <Mail size={17} />
                                        <span>
                                            <small>Email Address</small>
                                            <strong>{selectedUser.email || "—"}</strong>
                                        </span>
                                    </div>

                                    <div>
                                        <Phone size={17} />
                                        <span>
                                            <small>Phone Number</small>
                                            <strong>{selectedUser.phone || "Not provided"}</strong>
                                        </span>
                                    </div>

                                    <div>
                                        <ShieldCheck size={17} />
                                        <span>
                                            <small>Account Role</small>
                                            <strong>{selectedUser.role || "—"}</strong>
                                        </span>
                                    </div>

                                    <div>
                                        <CalendarDays size={17} />
                                        <span>
                                            <small>Registration Date</small>
                                            <strong>{formatDate(selectedUser.createdAt)}</strong>
                                        </span>
                                    </div>

                                    <div>
                                        <UserRound size={17} />
                                        <span>
                                            <small>User ID</small>
                                            <strong>#{selectedUser.id}</strong>
                                        </span>
                                    </div>
                                </div>

                                <div className="admin-users-modal-actions">
                                    <button
                                        className={String(selectedUser.status).toUpperCase() === "ACTIVE"
                                            ? "deactivate"
                                            : "activate"}
                                        onClick={() => handleAccountStatus(selectedUser)}
                                        disabled={actionLoading}
                                    >
                                        {String(selectedUser.status).toUpperCase() === "ACTIVE"
                                            ? "Deactivate Account"
                                            : "Activate Account"}
                                    </button>

                                    <button
                                        className="close"
                                        onClick={() => setSelectedUser(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
