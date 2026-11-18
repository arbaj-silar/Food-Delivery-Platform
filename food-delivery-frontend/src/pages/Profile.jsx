
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyProfile, updateMyProfile } from "../services/userService";
import {
    User, Mail, Phone, ShieldCheck, Edit3,
    Save, X, LoaderCircle, RefreshCw
} from "lucide-react";
import "../styles/Profile.css";

export default function Profile() {
    const { user, updateUserProfile } = useAuth();

    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: "",
        phone: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getMyProfile();

            setProfile(data);
            setFormData({
                fullName: data.fullName || "",
                phone: data.phone || ""
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your profile."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCancel = () => {
        setFormData({
            fullName: profile.fullName || "",
            phone: profile.phone || ""
        });

        setEditing(false);
        setError("");
        setSuccess("");
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const fullName = formData.fullName.trim();
        const phone = formData.phone.trim();

        if (!fullName) {
            setError("Full name is required.");
            return;
        }

        if (fullName.length > 100) {
            setError("Full name must not exceed 100 characters.");
            return;
        }

        if (!phone || !/^[0-9+()\-\s]{7,20}$/.test(phone)) {
            setError("Please enter a valid phone number.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const updated = await updateMyProfile(profile.id, {
                fullName,
                phone
            });

            updateUserProfile({
                fullName: updated.fullName,
                phone: updated.phone
            });

            setFormData({
                fullName: updated.fullName || "",
                phone: updated.phone || ""
            });

            setEditing(false);
            setSuccess("Your profile has been updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update your profile."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <LoaderCircle className="spin" size={35} />
                <p>Loading your profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-error">
                <p>{error || "Profile not found."}</p>
                <button onClick={loadProfile}>
                    <RefreshCw size={16} /> Try Again
                </button>
            </div>
        );
    }

    const displayName =
        profile.fullName || user?.username || "Customer";

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div>
                    <h1>My Profile</h1>
                    <p>Manage your personal information and account.</p>
                </div>

                {!editing && (
                    <button
                        className="edit-profile-btn"
                        onClick={() => {
                            setEditing(true);
                            setError("");
                            setSuccess("");
                        }}
                    >
                        <Edit3 size={17} />
                        Edit Profile
                    </button>
                )}
            </div>

            {success && (
                <div className="profile-success">{success}</div>
            )}

            {error && (
                <div className="profile-error-message">{error}</div>
            )}

            <div className="profile-layout">
                <section className="profile-main-card">
                    <div className="profile-cover"></div>

                    <div className="profile-avatar">
                        {displayName.charAt(0).toUpperCase()}
                    </div>

                    <div className="profile-main-info">
                        <h2>{displayName}</h2>
                        <p>{profile.email}</p>
                        <span className="profile-status">
                            <ShieldCheck size={15} />
                            {profile.status || "ACTIVE"}
                        </span>
                    </div>

                    <div className="profile-details">
                        <h3>Personal Information</h3>

                        {editing ? (
                            <form onSubmit={handleSave}>
                                <div className="profile-form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        maxLength={100}
                                        required
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="profile-form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        maxLength={20}
                                        required
                                        placeholder="Enter your phone number"
                                    />
                                </div>

                                <div className="profile-form-actions">
                                    <button
                                        type="submit"
                                        className="save-profile-btn"
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <LoaderCircle className="spin" size={17} />
                                        ) : (
                                            <Save size={17} />
                                        )}
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-profile-btn"
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        <X size={17} />
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-info-grid">
                                <div className="profile-info-item">
                                    <User size={19} />
                                    <div>
                                        <small>Full Name</small>
                                        <strong>{profile.fullName || "Not provided"}</strong>
                                    </div>
                                </div>

                                <div className="profile-info-item">
                                    <Mail size={19} />
                                    <div>
                                        <small>Email Address</small>
                                        <strong>{profile.email || "Not provided"}</strong>
                                    </div>
                                </div>

                                <div className="profile-info-item">
                                    <Phone size={19} />
                                    <div>
                                        <small>Phone Number</small>
                                        <strong>{profile.phone || "Not provided"}</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="profile-sidebar-card">
                    <ShieldCheck size={35} />
                    <h3>Account Security</h3>
                    <p>
                        Your account is protected with secure Keycloak
                        authentication.
                    </p>

                    <div className="security-status">
                        <span></span>
                        Account Protected
                    </div>

                    <div className="profile-account-info">
                        <small>Account ID</small>
                        <strong>{profile.id}</strong>
                    </div>
                </aside>
            </div>
        </div>
    );
}
