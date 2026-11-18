
import { useEffect, useMemo, useState } from "react";

import {
    getPendingRoleApplications,
    getAllRoleApplications,
    approveRoleApplication,
    rejectRoleApplication
} from "../../services/adminService";

import "../../styles/admin/AdminRoleApplications.css";

export default function AdminRoleApplications() {

    const [pendingApplications, setPendingApplications] = useState([]);
    const [allApplications, setAllApplications] = useState([]);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadApplications = async () => {
        try {
            setError("");

            const [pendingData, historyData] = await Promise.all([
                getPendingRoleApplications(),
                getAllRoleApplications()
            ]);

            setPendingApplications(
                Array.isArray(pendingData) ? pendingData : []
            );

            setAllApplications(
                Array.isArray(historyData) ? historyData : []
            );

        } catch (err) {
            console.error("Failed to load role applications:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load role applications."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
    }, []);

    const handleApprove = async (application) => {

        const confirmed = window.confirm(
            `Are you sure you want to approve the application from ${application.fullName}?`
        );

        if (!confirmed) return;

        try {
            setProcessingId(application.id);
            setError("");
            setMessage("");

            await approveRoleApplication(application.id);

            setMessage(
                `${application.fullName}'s application was approved successfully.`
            );

            await loadApplications();

        } catch (err) {
            console.error("Application approval error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to approve application."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (application) => {

        const reason = window.prompt(
            `Enter the rejection reason for ${application.fullName}'s application:`
        );

        if (reason === null) return;

        if (!reason.trim()) {
            setError("A rejection reason is required.");
            return;
        }

        try {
            setProcessingId(application.id);
            setError("");
            setMessage("");

            await rejectRoleApplication(
                application.id,
                reason.trim()
            );

            setMessage(
                `${application.fullName}'s application was rejected successfully.`
            );

            await loadApplications();

        } catch (err) {
            console.error("Application rejection error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to reject application."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const filteredPending = useMemo(() => {
        const keyword = search.toLowerCase();

        return pendingApplications.filter(application => {

            const matchesSearch =
                (application.fullName || "").toLowerCase().includes(keyword) ||
                (application.email || "").toLowerCase().includes(keyword) ||
                String(application.id).includes(keyword);

            const matchesRole =
                roleFilter === "ALL" ||
                application.requestedRole === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [pendingApplications, search, roleFilter]);

    const filteredHistory = useMemo(() => {
        const keyword = search.toLowerCase();

        return allApplications.filter(application => {

            const matchesSearch =
                (application.fullName || "").toLowerCase().includes(keyword) ||
                (application.email || "").toLowerCase().includes(keyword) ||
                String(application.id).includes(keyword);

            const matchesRole =
                roleFilter === "ALL" ||
                application.requestedRole === roleFilter;

            const matchesStatus =
                statusFilter === "ALL" ||
                application.applicationStatus === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [allApplications, search, roleFilter, statusFilter]);

    const approvedCount = allApplications.filter(
        application => application.applicationStatus === "APPROVED"
    ).length;

    const rejectedCount = allApplications.filter(
        application => application.applicationStatus === "REJECTED"
    ).length;

    const formatDate = (date) => {
        if (!date) return "N/A";

        const parsedDate = new Date(date);

        return Number.isNaN(parsedDate.getTime())
            ? "N/A"
            : parsedDate.toLocaleString();
    };

    const formatRole = (role) => {
        if (!role) return "Unknown";

        return role.replaceAll("_", " ");
    };

    if (loading) {
        return (
            <div className="role-applications-page">
                <div className="role-applications-loading">
                    Loading role applications...
                </div>
            </div>
        );
    }

    return (
        <div className="role-applications-page">

            <header className="role-page-header">
                <div>
                    <span className="role-page-eyebrow">
                        ACCESS MANAGEMENT
                    </span>

                    <h1>Role Applications</h1>

                    <p>
                        Review and manage requests for Restaurant Owner
                        and Delivery Partner access.
                    </p>
                </div>

                <button
                    type="button"
                    className="role-refresh-btn"
                    onClick={loadApplications}
                >
                    Refresh Applications
                </button>
            </header>

            {error && (
                <div className="role-alert role-alert-error">
                    {error}
                </div>
            )}

            {message && (
                <div className="role-alert role-alert-success">
                    {message}
                </div>
            )}

            <section className="role-summary-grid">

                <article className="role-summary-card">
                    <span>Pending Applications</span>
                    <strong>{pendingApplications.length}</strong>
                </article>

                <article className="role-summary-card">
                    <span>Total Applications</span>
                    <strong>{allApplications.length}</strong>
                </article>

                <article className="role-summary-card">
                    <span>Approved</span>
                    <strong>{approvedCount}</strong>
                </article>

                <article className="role-summary-card">
                    <span>Rejected</span>
                    <strong>{rejectedCount}</strong>
                </article>

            </section>

            <section className="role-management-section">

                <div className="role-section-heading">
                    <div>
                        <h2>Pending Applications</h2>
                        <p>
                            Review applicants before granting additional roles.
                        </p>
                    </div>

                    <span className="role-record-count">
                        {filteredPending.length} Applications
                    </span>
                </div>

                <div className="role-filter-toolbar">

                    <input
                        type="text"
                        placeholder="Search name, email or application ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />

                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                    >
                        <option value="ALL">All Roles</option>
                        <option value="RESTAURANT_OWNER">
                            Restaurant Owners
                        </option>
                        <option value="DELIVERY_PARTNER">
                            Delivery Partners
                        </option>
                    </select>

                </div>

                {filteredPending.length === 0 ? (

                    <div className="role-empty-state">
                        <span>📋</span>
                        <h3>
                            {pendingApplications.length === 0
                                ? "No pending applications"
                                : "No matching applications"}
                        </h3>
                        <p>
                            {pendingApplications.length === 0
                                ? "There are currently no applications waiting for review."
                                : "Try changing your search or role filter."}
                        </p>
                    </div>

                ) : (

                    <div className="role-application-grid">

                        {filteredPending.map(application => (

                            <article
                                className="role-application-card"
                                key={application.id}
                            >

                                <div className="role-card-top">
                                    <div className="role-applicant-avatar">
                                        {application.fullName
                                            ?.charAt(0)
                                            ?.toUpperCase() || "U"}
                                    </div>

                                    <span className="role-status pending">
                                        PENDING
                                    </span>
                                </div>

                                <h3>
                                    {application.fullName || "Unnamed Applicant"}
                                </h3>

                                <p className="role-applicant-email">
                                    {application.email || "Email not provided"}
                                </p>

                                <div className="role-applicant-details">

                                    <div>
                                        <span>Application ID</span>
                                        <strong>#{application.id}</strong>
                                    </div>

                                    <div>
                                        <span>Phone</span>
                                        <strong>
                                            {application.phone || "Not provided"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Requested Role</span>
                                        <strong>
                                            {formatRole(application.requestedRole)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Submitted</span>
                                        <strong>
                                            {formatDate(application.submittedAt)}
                                        </strong>
                                    </div>

                                </div>

                                <div className="role-application-actions">

                                    <button
                                        type="button"
                                        className="role-approve-btn"
                                        disabled={processingId !== null}
                                        onClick={() => handleApprove(application)}
                                    >
                                        {processingId === application.id
                                            ? "Processing..."
                                            : "Approve"}
                                    </button>

                                    <button
                                        type="button"
                                        className="role-reject-btn"
                                        disabled={processingId !== null}
                                        onClick={() => handleReject(application)}
                                    >
                                        Reject
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </section>

            <section className="role-management-section role-history-section">

                <div className="role-section-heading">
                    <div>
                        <h2>Application History</h2>
                        <p>
                            Review previous applications and admin decisions.
                        </p>
                    </div>

                    <span className="role-record-count">
                        {filteredHistory.length} Records
                    </span>
                </div>

                <div className="role-filter-toolbar">

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>

                </div>

                {filteredHistory.length === 0 ? (

                    <div className="role-empty-state">
                        <span>📚</span>
                        <h3>No application history found</h3>
                        <p>
                            No applications match the selected filters.
                        </p>
                    </div>

                ) : (

                    <div className="role-history-list">

                        {filteredHistory.map(application => (

                            <article
                                className="role-history-card"
                                key={application.id}
                            >

                                <div className="role-history-header">

                                    <div>
                                        <h3>
                                            {application.fullName || "Unnamed Applicant"}
                                        </h3>

                                        <p>
                                            {application.email || "Email not provided"}
                                        </p>
                                    </div>

                                    <span
                                        className={`role-status ${
                                            application.applicationStatus?.toLowerCase() || "pending"
                                        }`}
                                    >
                                        {application.applicationStatus || "UNKNOWN"}
                                    </span>

                                </div>

                                <div className="role-history-details">

                                    <div>
                                        <span>Application ID</span>
                                        <strong>#{application.id}</strong>
                                    </div>

                                    <div>
                                        <span>Requested Role</span>
                                        <strong>
                                            {formatRole(application.requestedRole)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Phone</span>
                                        <strong>
                                            {application.phone || "Not provided"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Submitted</span>
                                        <strong>
                                            {formatDate(application.submittedAt)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Reviewed</span>
                                        <strong>
                                            {formatDate(application.reviewedAt)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Reviewed By</span>
                                        <strong>
                                            {application.reviewedByName
                                                ? `${application.reviewedByName} (ID: ${application.reviewedById})`
                                                : "Not reviewed"}
                                        </strong>
                                    </div>

                                </div>

                                {application.applicationStatus === "REJECTED" && (
                                    <div className="role-rejection-reason">
                                        <span>Rejection Reason</span>
                                        <p>
                                            {application.rejectionReason ||
                                                "No reason provided"}
                                        </p>
                                    </div>
                                )}

                            </article>

                        ))}

                    </div>

                )}

            </section>

        </div>
    );
}
