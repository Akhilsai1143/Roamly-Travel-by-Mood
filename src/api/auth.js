const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_URL = `${API_BASE}/auth`;

async function sendRequest(endpoint, data) {
    const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
    }

    return result;
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

    const response = await fetch(`${API_URL}/me`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Unable to load your profile");
    }

    return result.user;
}

export async function updateProfile(data) {
    const token = localStorage.getItem("roamly-token");

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
        throw new Error(result.message || "Failed to update profile");
    }

    return result.user;
}

export async function changePassword({ currentPassword, newPassword }) {
    const token = localStorage.getItem("roamly-token");

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
        throw new Error(result.message || "Failed to change password");
    }

    return result;
}
