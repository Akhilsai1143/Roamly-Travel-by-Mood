import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

import { clearSessionFeaturedDestination } from "../utils/featuredDestination.js";
import { getCurrentUser } from "../api/auth.js";

function readSavedUser() {
    try {
        return JSON.parse(
            localStorage.getItem("roamly-user") || "null"
        );
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(readSavedUser);

    const [token, setToken] = useState(
        () => localStorage.getItem("roamly-token")
    );

    // Validate active session on initial app load without kicking user out on network drops
    useEffect(() => {
        const savedToken = localStorage.getItem("roamly-token");
        if (savedToken) {
            getCurrentUser()
                .then((freshUser) => {
                    if (freshUser) {
                        setUser(freshUser);
                        localStorage.setItem("roamly-user", JSON.stringify(freshUser));
                    }
                })
                .catch((err) => {
                    // Only log out if backend explicitly confirms the token is invalid (HTTP 401/403)
                    if (
                        err?.status === 401 ||
                        err?.status === 403 ||
                        err?.response?.status === 401 ||
                        err?.response?.status === 403 ||
                        err?.message?.includes("unauthorized")
                    ) {
                        logout();
                    } else {
                        // Keeps cached session intact during offline browsing, mobile network drops, or cloud cold starts
                        console.warn("Unable to refresh user profile from backend, maintaining cached session:", err?.message);
                    }
                });
        }
    }, []);

    // Listen for global unauthorized events from client interceptor
    useEffect(() => {
        function handleUnauthorized() {
            logout();
        }
        window.addEventListener("roamly:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("roamly:unauthorized", handleUnauthorized);
    }, []);

    function saveSession(result) {
        if (!result?.token || !result?.user) {
            throw new Error(
                "The server did not return a valid login session."
            );
        }

        localStorage.setItem("roamly-token", result.token);
        localStorage.setItem(
            "roamly-user",
            JSON.stringify(result.user)
        );

        clearSessionFeaturedDestination();

        setToken(result.token);
        setUser(result.user);
    }

    function updateUser(updatedUser) {
        if (!updatedUser) return;
        const merged = { ...user, ...updatedUser };
        localStorage.setItem("roamly-user", JSON.stringify(merged));
        setUser(merged);
    }

    function logout() {
        localStorage.removeItem("roamly-token");
        localStorage.removeItem("roamly-user");

        clearSessionFeaturedDestination();

        setToken(null);
        setUser(null);
    }

    const value = {
        user,
        token,
        isLoggedIn: Boolean(token && user),
        isAdmin: Boolean(token && user?.role === "admin"),
        saveSession,
        updateUser,
        logout
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
