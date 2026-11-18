import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/userService";
import "../styles/Register.css";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [registeredEmail, setRegisteredEmail] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await registerUser(formData);

            setRegisteredEmail(formData.email);

            setSuccess(
                "Your account has been created successfully! Welcome aboard."
            );

            setFormData({
                fullName: "",
                email: "",
                phone: "",
                password: ""
            });

        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLoginRedirect = () => {
        navigate("/login", {
            state: {
                registered: true,
                email: registeredEmail
            }
        });
    };

    return (
        <div className="register-page">

            <div className="register-container">

                {/* LEFT HERO SECTION */}
                <div className="register-hero">

                    <div className="hero-content">

                        <div className="hero-brand">
                            <span className="brand-icon">🍽️</span>
                            <span>FoodieExpress</span>
                        </div>

                        <div className="hero-main">
                            <span className="hero-tag">
                                GOOD FOOD. GOOD MOOD.
                            </span>

                            <h1>
                                Your cravings,
                                <br />
                                <span>our priority.</span>
                            </h1>

                            <p>
                                Discover amazing restaurants, explore delicious
                                meals and get your favourite food delivered
                                right to your doorstep.
                            </p>

                            <div className="hero-features">

                                <div className="hero-feature">
                                    <span>🚀</span>
                                    <div>
                                        <strong>Fast Delivery</strong>
                                        <small>Food at your doorstep</small>
                                    </div>
                                </div>

                                <div className="hero-feature">
                                    <span>🍔</span>
                                    <div>
                                        <strong>Endless Choices</strong>
                                        <small>Explore delicious food</small>
                                    </div>
                                </div>

                                <div className="hero-feature">
                                    <span>❤️</span>
                                    <div>
                                        <strong>Made for You</strong>
                                        <small>Your favourites, anytime</small>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="hero-footer">
                            Fresh food. Happy moments. Every day.
                        </div>

                    </div>

                    <div className="hero-decoration hero-circle-one"></div>
                    <div className="hero-decoration hero-circle-two"></div>

                </div>

                {/* RIGHT REGISTRATION SECTION */}
                <div className="register-form-section">

                    <div className="register-card">

                        <div className="register-heading">
                            <span className="register-eyebrow">
                                JOIN OUR FOOD COMMUNITY
                            </span>

                            <h2>Create your account<span>.</span></h2>

                            <p>
                                Sign up and start your delicious journey with us.
                            </p>
                        </div>

                        {error && (
                            <div className="register-message register-error">
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="register-message register-success">
                                <span>✓</span>
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            <div className="register-input-group">
                                <label htmlFor="fullName">Full Name</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    name="fullName"
                                    placeholder="Enter your full name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    maxLength="100"
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div className="register-input-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    maxLength="150"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="register-input-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    placeholder="Enter your phone number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    pattern="[0-9+() -]{7,20}"
                                    title="Enter a valid phone number"
                                    autoComplete="tel"
                                    required
                                />
                            </div>

                            <div className="register-input-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    minLength="8"
                                    maxLength="72"
                                    autoComplete="new-password"
                                    required
                                />
                                <small className="password-hint">
                                    Minimum 8 characters
                                </small>
                            </div>

                            <button
                                type="submit"
                                className="register-submit"
                                disabled={loading || !!success}
                            >
                                {loading
                                    ? "Creating your account..."
                                    : success
                                        ? "Account Created ✓"
                                        : "Create Account →"}
                            </button>

                        </form>

                        {success && (
                            <button
                                type="button"
                                className="register-login-button"
                                onClick={handleLoginRedirect}
                            >
                                Sign In →
                            </button>
                        )}

                        <div className="register-bottom">
                            <span>🔒</span>
                            Your account is protected with secure authentication.
                        </div>

                        <div className="register-bottom">
                            Already have an account?{" "}
                            <Link to="/login">Sign In</Link>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Register;