 const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function formatUser(row) {
    let travelPreferences = row.travel_preferences || [];

    if (typeof travelPreferences === "string") {
        try {
            travelPreferences = JSON.parse(travelPreferences);
        } catch {
            travelPreferences = [];
        }
    }

    return {
        id: row.id,
        name: row.name,
        firstName: row.first_name || "",
        lastName: row.last_name || "",
        email: row.email,
        phone: row.phone || "",
        travelPreferences,
        role: row.role,
        isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
        lastLogin: row.last_login || null,
        createdAt: row.created_at || null
    };
}

// REGISTER
exports.register = async (req, res) => {
    try {
        const firstName = String(req.body.firstName || "").trim();
        const lastName = String(req.body.lastName || "").trim();
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();
        const phone = String(req.body.phone || "").trim();
        const password = String(req.body.password || "");
        const confirmPassword = String(
            req.body.confirmPassword || ""
        );

        const allowedPreferences = [
            "Nature & Mountains",
            "Beaches",
            "Adventure",
            "Historical Places",
            "Wildlife",
            "City Exploration"
        ];

        const submittedPreferences = req.body.travelPreferences;

        const travelPreferences = Array.isArray(submittedPreferences)
            ? [
                ...new Set(
                    submittedPreferences.filter(item =>
                        allowedPreferences.includes(item)
                    )
                )
            ]
            : [];

        if (!firstName || !email || !password) {
            return res.status(400).json({
                message: "First name, email, and password are required"
            });
        }

        if (firstName.length > 100 || lastName.length > 100) {
            return res.status(400).json({
                message: "Names cannot exceed 100 characters"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match"
            });
        }

        if (phone.length > 20) {
            return res.status(400).json({
                message: "Phone number cannot exceed 20 characters"
            });
        }

        if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
            return res.status(400).json({
                message: "Please enter a valid mobile number"
            });
        }

        const [existingUsers] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const name = `${firstName} ${lastName}`.trim();

        const [result] = await pool.query(
            `INSERT INTO users
                (
                    name,
                    first_name,
                    last_name,
                    email,
                    phone,
                    travel_preferences,
                    password,
                    role
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'user')`,
            [
                name,
                firstName,
                lastName || null,
                email,
                phone || null,
                JSON.stringify(travelPreferences),
                hashedPassword
            ]
        );

        const user = {
            id: result.insertId,
            name,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            travel_preferences: travelPreferences,
            role: "user"
        };

        const token = createToken(user);

        return res.status(201).json({
            message: "Registration successful",
            token,
            user: formatUser(user)
        });
    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        return res.status(500).json({
            message: "Registration failed. Please try again."
        });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();
        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                id,
                name,
                first_name,
                last_name,
                email,
                phone,
                travel_preferences,
                password,
                role,
                is_active,
                last_login,
                deleted_at,
                created_at
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        if (rows.length === 0 || rows[0].deleted_at) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const databaseUser = rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            databaseUser.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Account activation check
        if (databaseUser.is_active === 0 || databaseUser.is_active === false) {
            return res.status(403).json({
                message: "Your account has been deactivated. Please contact an administrator."
            });
        }

        // Update last_login timestamp upon successful login
        const now = new Date();
        await pool.query(
            "UPDATE users SET last_login = ? WHERE id = ?",
            [now, databaseUser.id]
        );
        databaseUser.last_login = now;

        const user = formatUser(databaseUser);
        const token = createToken(user);

        return res.status(200).json({
            message: "Login successful",
            token,
            user
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed. Please try again."
        });
    }
};

// GET CURRENT LOGGED-IN USER
exports.getMe = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                id,
                name,
                first_name,
                last_name,
                email,
                phone,
                travel_preferences,
                role,
                is_active,
                last_login,
                created_at
             FROM users
             WHERE id = ? AND deleted_at IS NULL
             LIMIT 1`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "User account not found"
            });
        }

        if (rows[0].is_active === 0 || rows[0].is_active === false) {
            return res.status(403).json({
                message: "Your account has been deactivated. Please contact an administrator."
            });
        }

        return res.status(200).json({
            user: formatUser(rows[0])
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            message: "Unable to load your profile"
        });
    }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const firstName = String(req.body.firstName || "").trim();
        const lastName = String(req.body.lastName || "").trim();
        const phone = String(req.body.phone || "").trim();
        const travelPreferences = Array.isArray(req.body.travelPreferences)
            ? JSON.stringify(req.body.travelPreferences)
            : null;

        const fullName = [firstName, lastName].filter(Boolean).join(" ") || req.user.name;

        await pool.query(
            `UPDATE users 
             SET name = ?, first_name = ?, last_name = ?, phone = ?, 
                 travel_preferences = COALESCE(?, travel_preferences)
             WHERE id = ?`,
            [fullName, firstName || null, lastName || null, phone || null, travelPreferences, userId]
        );

        const [rows] = await pool.query(
            `SELECT id, name, first_name, last_name, email, phone, travel_preferences, role, is_active, last_login, created_at 
             FROM users WHERE id = ? LIMIT 1`,
            [userId]
        );

        return res.status(200).json({
            message: "Profile updated successfully",
            user: formatUser(rows[0])
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Unable to update profile" });
    }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentPassword = String(req.body.currentPassword || "");
        const newPassword = String(req.body.newPassword || "");

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters" });
        }

        const [rows] = await pool.query("SELECT password FROM users WHERE id = ? LIMIT 1", [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValid = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isValid) {
            return res.status(400).json({ message: "Incorrect current password" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashed, userId]);

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ message: "Unable to update password" });
    }
};

// WELCOME POPUP QUICK REGISTRATION
exports.welcomeRegister = async (req, res) => {
    try {
        const rawName = String(req.body.fullName || req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        let phone = String(req.body.phone || "").trim();
        const travelInterest = req.body.travelInterest || req.body.travelPreferences;

        if (!rawName) {
            return res.status(400).json({
                message: "Please enter your full name"
            });
        }

        if (!email) {
            return res.status(400).json({
                message: "Please enter your email address"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        if (!phone) {
            return res.status(400).json({
                message: "Please enter your mobile number"
            });
        }

        const digitsOnly = phone.replace(/\D/g, "");
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            return res.status(400).json({
                message: "Please enter a valid 10-digit mobile number"
            });
        }

        if (!phone.startsWith("+")) {
            phone = "+91 " + phone.replace(/^91/, "").trim();
        }

        const nameParts = rawName.split(/\s+/);
        const firstName = nameParts[0] || rawName;
        const lastName = nameParts.slice(1).join(" ") || "";

        const allowedPreferences = [
            "Nature & Mountains",
            "Beaches",
            "Adventure",
            "Historical Places",
            "Wildlife",
            "City Exploration"
        ];

        const interestMap = {
            "Nature": "Nature & Mountains",
            "Nature & Mountains": "Nature & Mountains",
            "Beaches": "Beaches",
            "Adventure": "Adventure",
            "Historical Places": "Historical Places",
            "Wildlife": "Wildlife",
            "City Exploration": "City Exploration"
        };

        let selectedPreferences = [];
        if (Array.isArray(travelInterest)) {
            selectedPreferences = travelInterest
                .map(i => interestMap[i] || i)
                .filter(i => allowedPreferences.includes(i));
        } else if (typeof travelInterest === "string" && travelInterest.trim()) {
            const mapped = interestMap[travelInterest] || travelInterest;
            if (allowedPreferences.includes(mapped)) {
                selectedPreferences = [mapped];
            }
        }

        const [existingUsers] = await pool.query(
            "SELECT id, name, first_name, last_name, email, phone, travel_preferences, role, is_active FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            let existingPrefs = [];
            try {
                existingPrefs = typeof existingUser.travel_preferences === "string"
                    ? JSON.parse(existingUser.travel_preferences)
                    : (existingUser.travel_preferences || []);
            } catch {
                existingPrefs = [];
            }

            const mergedPrefs = Array.from(new Set([...existingPrefs, ...selectedPreferences]));

            await pool.query(
                "UPDATE users SET travel_preferences = ?, phone = COALESCE(NULLIF(phone, ''), ?) WHERE id = ?",
                [JSON.stringify(mergedPrefs), phone, existingUser.id]
            );

            const token = createToken(existingUser);

            return res.status(200).json({
                message: "Welcome back! Your travel preferences have been updated.",
                token,
                user: formatUser({
                    ...existingUser,
                    phone: existingUser.phone || phone,
                    travel_preferences: mergedPrefs
                })
            });
        }

        const randomSecret = crypto.randomBytes(24).toString("base64");
        const hashedPassword = await bcrypt.hash(randomSecret, 12);

        const [result] = await pool.query(
            `INSERT INTO users
                (
                    name,
                    first_name,
                    last_name,
                    email,
                    phone,
                    travel_preferences,
                    password,
                    role,
                    is_active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 1)`,
            [
                rawName,
                firstName,
                lastName || null,
                email,
                phone,
                JSON.stringify(selectedPreferences),
                hashedPassword
            ]
        );

        const newUser = {
            id: result.insertId,
            name: rawName,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            travel_preferences: selectedPreferences,
            role: "user",
            is_active: 1
        };

        const token = createToken(newUser);

        return res.status(201).json({
            message: "Welcome to Roamly! Your adventure begins now.",
            token,
            user: formatUser(newUser)
        });
    } catch (error) {
        console.error("Welcome register error:", error);
        return res.status(500).json({
            message: "Unable to complete registration. Please try again."
        });
    }
};
