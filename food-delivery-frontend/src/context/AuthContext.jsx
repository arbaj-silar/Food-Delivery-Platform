
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef
} from "react";

import {
    loginUser,
    refreshSession,
    logoutUser
} from "../services/authService";

const AuthContext = createContext(null);

const decodeToken = (token) => {
    try {
        const payload = token.split(".")[1];

        const base64 = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decoded = atob(
            base64.padEnd(
                base64.length + (4 - base64.length % 4) % 4,
                "="
            )
        );

        return JSON.parse(
            decodeURIComponent(
                Array.from(decoded)
                    .map(char =>
                        "%" +
                        char.charCodeAt(0)
                            .toString(16)
                            .padStart(2, "0")
                    )
                    .join("")
            )
        );

    } catch (error) {
        console.error("Unable to decode access token:", error);
        return null;
    }
};

export function AuthProvider({ children }) {

    const [token, setToken] = useState(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState([]);
    const [initialized, setInitialized] = useState(false);

    const refreshStarted = useRef(false);

    const applyToken = (accessToken) => {

        const decoded = decodeToken(accessToken);

        if (!decoded) {
            logoutUser();
            throw new Error("Invalid authentication token.");
        }

        const userRoles = decoded.realm_access?.roles || [];

        setToken(accessToken);
        setAuthenticated(true);
        setRoles(userRoles);

        setUser({
            id: decoded.sub,
            username: decoded.preferred_username,
            email: decoded.email,
            name: decoded.name,
            firstName: decoded.given_name,
            lastName: decoded.family_name
        });
    };

    // Restore the session when the application starts.
    useEffect(() => {

        if (refreshStarted.current) {
            return;
        }

        refreshStarted.current = true;

        const restoreSession = async () => {

            try {
                const response = await refreshSession();

                applyToken(response.accessToken);

            } catch (error) {

                try {
                    await logoutUser();
                } catch (logoutError) {
                    console.error("Session cleanup error:", logoutError);
                }

                setToken(null);
                setAuthenticated(false);
                setUser(null);
                setRoles([]);
            } finally {
                setInitialized(true);
            }
        };

        restoreSession();

    }, []);

    const login = async (email, password) => {

        const response = await loginUser(email, password);

        applyToken(response.accessToken);

        return response;
    };

    // Update user information without changing authentication.
    const updateUserProfile = (profileData) => {

        setUser(currentUser => {

            if (!currentUser) {
                return currentUser;
            }

            return {
                ...currentUser,
                name: profileData.fullName,
                firstName: profileData.fullName,
                lastName: "",
                phone: profileData.phone
            };
        });
    };

    const logout = async () => {

        try {
            await logoutUser();
        } catch (error) {
            console.error("Backend logout error:", error);
        } finally {
            setToken(null);
            setAuthenticated(false);
            setUser(null);
            setRoles([]);
        }
    };

    const getToken = async () => token;

    const hasRole = (role) => roles.includes(role);

    const value = {
        token,
        authenticated,
        initialized,
        user,
        roles,
        login,
        logout,
        getToken,
        hasRole,
        updateUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}
