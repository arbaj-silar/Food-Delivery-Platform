
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const registeredEmail = location.state?.email || "";
    const registeredSuccessfully = location.state?.registered || false;

    const [formData, setFormData] = useState({
        email: registeredEmail,
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getDashboardPath = (roles) => {
        if (roles.includes("ADMIN")) return "/admin-dashboard";
        if (roles.includes("RESTAURANT_OWNER")) return "/restaurant-dashboard";
        if (roles.includes("DELIVERY_PARTNER")) return "/delivery-dashboard";
        return "/customer";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.email.trim() || !formData.password) {
            setError("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            const response = await login(
                formData.email.trim(),
                formData.password
            );

            const payload = JSON.parse(
                atob(
                    response.accessToken
                        .split(".")[1]
                        .replace(/-/g, "+")
                        .replace(/_/g, "/")
                )
            );

            const roles = payload.realm_access?.roles || [];

            navigate(getDashboardPath(roles), {
                replace: true
            });

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                "Invalid email or password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-container">

                {/* LEFT BRANDING PANEL */}

                <div className="login-brand-panel">

                    <div className="login-brand-content">

                        <Link to="/" className="login-logo">
                            <span className="login-logo-icon">🍔</span>
                            <span>FoodieExpress</span>
                        </Link>

                        <div className="login-brand-message">

                            <span className="login-tagline">
                                DELICIOUSNESS IS JUST A CLICK AWAY
                            </span>

                            <h1>
                                Good food.
                                <br />
                                Great mood.
                                <br />
                                <span>Delivered.</span>
                            </h1>

                            <p>
                                Discover your favourite restaurants,
                                explore amazing meals and enjoy
                                delicious food delivered straight
                                to your doorstep.
                            </p>

                        </div>

                        <div className="login-food-visual">
                            <div className="food-circle">🍕</div>
                            <div className="food-small food-one">🍟</div>
                            <div className="food-small food-two">🥤</div>
                            <div className="food-small food-three">🍔</div>
                            <div className="food-small food-four">🍩</div>
                        </div>

                        <div className="login-brand-footer">
                            <span>✦</span>
                            Fresh meals. Happy moments. Every day.
                        </div>

                    </div>

                </div>

                {/* RIGHT LOGIN PANEL */}

                <div className="login-form-panel">

                    <div className="login-form-wrapper">

                        <div className="login-mobile-logo">
                            🍔 FoodieExpress
                        </div>

                        <div className="login-welcome-label">
                            WELCOME TO FOODIEEXPRESS
                        </div>

                        <h2>
                            Welcome back<span>!</span>
                        </h2>

                        <p className="login-subtitle">
                            Sign in to continue your delicious journey.
                        </p>

                        {/* REGISTRATION SUCCESS */}

                        {registeredSuccessfully && (
                            <div className="login-success-message">
                                <span className="success-icon">✓</span>

                                <div>
                                    <strong>Account created successfully!</strong>
                                    <p>Please sign in using your new account.</p>
                                </div>
                            </div>
                        )}

                        {/* LOGIN ERROR */}

                        {error && (
                            <div className="login-error">
                                <span>⚠</span>
                                {error}
                            </div>
                        )}

                        {/* LOGIN FORM */}

                        <form onSubmit={handleSubmit}>

                            <div className="login-field">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    required
                                />

                            </div>

                            <div className="login-field">

                                <label htmlFor="password">
                                    Password
                                </label>

                                <div className="password-wrapper">

                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>

                                </div>

                            </div>

                            <button
                                type="submit"
                                className="login-submit-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    "Signing in..."
                                ) : (
                                    <>Sign In <span>→</span></>
                                )}
                            </button>

                        </form>

                        {/* DIVIDER */}

                        <div className="login-divider">
                            <span>NEW TO FOODIEEXPRESS?</span>
                        </div>

                        {/* REGISTRATION OPTION */}

                        <div className="login-create-account">

                            <div className="create-account-icon">
                                ✨
                            </div>

                            <div className="create-account-content">
                                <strong>Create your account</strong>
                                <p>
                                    Join us and discover delicious food
                                    from your favourite restaurants.
                                </p>
                            </div>

                            <Link
                                to="/register"
                                className="create-account-link"
                            >
                                Register <span>→</span>
                            </Link>

                        </div>

                        <div className="login-security-note">
                            <span>🔒</span>
                            Secure authentication powered by Keycloak.
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}
