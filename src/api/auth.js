import { API_BASE, formatApiError } from "./client.js";

const API_URL = `${API_BASE}/auth`;

async function sendRequest(endpoint, data) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            const error = new Error(result.message || "Something went wrong");
            error.status = response.status;
            error.response = { status: response.status, data: result };
            throw error;
        }

        return result;
    } catch (err) {
        if (err.status) {
            // Error already shaped with status
            throw err;
        }
        const friendlyMsg = formatApiError(err);
        const wrappedError = new Error(friendlyMsg);
        wrappedError.originalError = err;
        throw wrappedError;
    }
}

export function registerUser(data) {
    return sendRequest("register", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        travelPreferences: data.travelPreferences || []
    });
}

export function welcomeRegisterUser({ fullName, email, phone, travelInterest }) {
    return sendRequest("welcome-register", {
        fullName,
        email,
        phone,
        travelInterest
    });
}

export function loginUser({ email, password }) {
    return sendRequest("login", {
        email,
        password
    });
}

export async function getCurrentUser() {
    const token = localStorage.getItem("roamly-token");
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            const error = new Error(result.message || "Unable to load your profile");
            error.status = response.status;
            error.response = { status: response.status, data: result };
            throw error;
        }

        return result.user;
    } catch (err) {
        if (err.status) {
            throw err;
        }
        const friendlyMsg = formatApiError(err);
        const wrappedError = new Error(friendlyMsg);
        wrappedError.originalError = err;
        throw wrappedError;
    }
}

export async function updateProfile(data) {
    const token = localStorage.getItem("roamly-token");

    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            const error = new Error(result.message || "Failed to update profile");
            error.status = response.status;
            throw error;
        }

        return result.user;
    } catch (err) {
        if (err.status) throw err;
        throw new Error(formatApiError(err));
    }
}

export async function changePassword({ currentPassword, newPassword }) {
    const token = localStorage.getItem("roamly-token");

    try {
        const response = await fetch(`${API_URL}/password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            const error = new Error(result.message || "Failed to change password");
            error.status = response.status;
            throw error;
        }

        return result;
    } catch (err) {
        if (err.status) throw err;
        throw new Error(formatApiError(err));
    }
}
