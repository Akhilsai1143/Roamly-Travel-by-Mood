import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Compass,
    Eye,
    EyeOff,
    ArrowRight,
    Mountain,
    Waves,
    TentTree,
    Landmark,
    Trees,
    Building2,
    Check,
    Sparkles
} from "lucide-react";

import { registerUser } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Register.css";

// Curated high-resolution destination photography across India with place names
// Categorized into 3 distinct vertical columns for alternating continuous scroll
const galleryColumns = [
    // Column 1 (Scrolls Up): Ladakh, Munnar, Udaipur, Goa, Meghalaya, Varanasi
    [
        {
            id: "reg-c1-ladakh",
            name: "Ladakh, India",
            alt: "Pangong Tso high-altitude lake and panoramic peaks in Ladakh",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=85",
            height: 250
        },
        {
            id: "reg-c1-munnar",
            name: "Kerala, India",
            alt: "Misty rolling green tea plantations in Munnar, Kerala",
            image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=85",
            height: 310
        },
        {
            id: "reg-c1-udaipur",
            name: "Udaipur, India",
            alt: "Lake Pichola and historic City Palace in Udaipur",
            image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=85",
            height: 230
        },
        {
            id: "reg-c1-goa",
            name: "Goa, India",
            alt: "Sunset over golden palm shores in South Goa",
            image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=85",
            height: 280
        },
        {
            id: "reg-c1-meghalaya",
            name: "Meghalaya, India",
            alt: "Lush tropical waterfalls and living root bridges in Meghalaya",
            image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=85",
            height: 240
        },
        {
            id: "reg-c1-varanasi",
            name: "Varanasi, India",
            alt: "Atmospheric dawn light over the ancient river ghats of Varanasi",
            image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=85",
            height: 290
        }
    ],
    // Column 2 (Scrolls Down): Spiti Valley, Varkala, Jaipur, Manali, Andaman, Coorg
    [
        {
            id: "reg-c2-spiti",
            name: "Spiti Valley, India",
            alt: "Rugged Himalayan terrain and snow ridges in Spiti Valley",
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=85",
            height: 290
        },
        {
            id: "reg-c2-varkala",
            name: "Varkala, India",
            alt: "Red sea cliffs and azure Arabian sea in Varkala, Kerala",
            image: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=800&q=85",
            height: 240
        },
        {
            id: "reg-c2-jaipur",
            name: "Jaipur, India",
            alt: "Ornate pink architecture and royal courtyards in Jaipur",
            image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=85",
            height: 300
        },
        {
            id: "reg-c2-manali",
            name: "Manali, India",
            alt: "Evergreen pine forests and snowline in Solang, Manali",
            image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=85",
            height: 230
        },
        {
            id: "reg-c2-andaman",
            name: "Andaman, India",
            alt: "Turquoise lagoons and untouched sandbars in Andaman Islands",
            image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=85",
            height: 270
        },
        {
            id: "reg-c2-coorg",
            name: "Coorg, India",
            alt: "Misty Western Ghats and dense coffee hills in Coorg",
            image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=85",
            height: 250
        }
    ],
    // Column 3 (Scrolls Up): Alleppey Backwaters, Rishikesh, Gokarna, Darjeeling, Ooty, Jaisalmer
    [
        {
            id: "reg-c3-kerala",
            name: "Alleppey, India",
            alt: "Tranquil backwater canals and houseboats in Alleppey, Kerala",
            image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=85",
            height: 240
        },
        {
            id: "reg-c3-rishikesh",
            name: "Rishikesh, India",
            alt: "Scenic river gorge and Himalayan foothills in Rishikesh",
            image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=85",
            height: 290
        },
        {
            id: "reg-c3-gokarna",
            name: "Gokarna, India",
            alt: "Cliffside trails and secluded cove beaches in Gokarna",
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=85",
            height: 230
        },
        {
            id: "reg-c3-darjeeling",
            name: "Darjeeling, India",
            alt: "Tea garden slopes facing Himalayan peaks in Darjeeling",
            image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=85",
            height: 300
        },
        {
            id: "reg-c3-ooty",
            name: "Ooty, India",
            alt: "Verdant Nilgiri hill ranges and eucalyptus mist in Ooty",
            image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=85",
            height: 250
        },
        {
            id: "reg-c3-jaisalmer",
            name: "Jaisalmer, India",
            alt: "Golden desert dunes and sandstone heritage in Thar Desert",
            image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=85",
            height: 280
        }
    ]
];

const travelOptions = [
    { label: "Nature & Mountains", icon: Mountain },
    { label: "Beaches", icon: Waves },
    { label: "Adventure", icon: TentTree },
    { label: "Historical Places", icon: Landmark },
    { label: "Wildlife", icon: Trees },
    { label: "City Exploration", icon: Building2 }
];

export default function Register() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });

    const [preferences, setPreferences] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { saveSession } = useAuth();
    const navigate = useNavigate();

    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    }

    function togglePreference(label) {
        setPreferences((current) =>
            current.includes(label)
                ? current.filter((item) => item !== label)
                : [...current, label]
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (form.password.length < 8) {
            setError("Your password must contain at least 8 characters.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Your passwords do not match. Please check again.");
            return;
        }

        setLoading(true);

        try {
            const result = await registerUser({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim()
                    ? `+91 ${form.phone.trim()}`
                    : "",
                password: form.password,
                confirmPassword: form.confirmPassword,
                travelPreferences: preferences
            });

            saveSession(result);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message || "We couldn't create your account.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="roamly-register">
            {/* LEFT: INFINITE MULTI-COLUMN DESTINATION GALLERY WITH ANIMATIONS */}
            <section
                className="register-journey"
                aria-label="Infinite destination image gallery"
            >
                {/* Floating Brand Badge */}
                <Link
                    to="/"
                    className="register-journey-brand"
                    title="Return to Roamly Home"
                >
                    <Compass size={22} strokeWidth={2.4} />
                    <span>
                        roamly<span className="register-brand-dot">.</span>
                    </span>
                </Link>

                <div className="register-gallery-wrapper">
                    {galleryColumns.map((column, colIdx) => {
                        const isDown = colIdx % 2 === 1;
                        const directionClass = isDown
                            ? "register-track-down"
                            : "register-track-up";
                        const colClass = `register-col-${colIdx + 1}`;

                        return (
                            <div
                                className={`register-gallery-column ${colClass}`}
                                key={`reg-gallery-col-${colIdx}`}
                            >
                                <div className={`register-gallery-track ${directionClass}`}>
                                    {/* Primary Image Sequence */}
                                    <div className="register-gallery-group">
                                        {column.map((item) => (
                                            <div
                                                className="register-gallery-card"
                                                key={item.id}
                                                style={{ height: `${item.height}px` }}
                                            >
                                                <img
                                                    src={item.image}
                                                    alt={item.alt}
                                                    loading="eager"
                                                />
                                                <span className="register-card-name">
                                                    {item.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Duplicated Image Sequence for Seamless Infinite Looping */}
                                    <div className="register-gallery-group" aria-hidden="true">
                                        {column.map((item) => (
                                            <div
                                                className="register-gallery-card"
                                                key={`${item.id}-loop`}
                                                style={{ height: `${item.height}px` }}
                                            >
                                                <img
                                                    src={item.image}
                                                    alt=""
                                                    loading="lazy"
                                                />
                                                <span className="register-card-name">
                                                    {item.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Floating Community Explorer Card */}
                <div className="register-journey-badge">
                    <div className="journey-badge-info">
                        <div className="journey-badge-header">
                            <span className="journey-live-dot" />
                            <span>15,000+ Mindful Travellers</span>
                        </div>
                        <span className="journey-badge-sub">
                            Handpicked escapes curated by mood across India
                        </span>
                    </div>

                    <div className="journey-badge-perks">
                        <Sparkles size={14} />
                        <span>Curated Trips</span>
                    </div>
                </div>
            </section>

            {/* RIGHT: BALANCED REGISTRATION FORM PANEL */}
            <aside className="register-panel">
                <div className="register-panel-top">
                    <span className="register-panel-caption">
                        START YOUR ROAMLY ESCAPE
                    </span>

                    <span className="register-panel-sparkle">
                        <Sparkles size={17} />
                    </span>
                </div>

                <div className="register-panel-content">
                    <Link to="/" className="register-mobile-brand">
                        <Compass size={24} />
                        <span>
                            roamly<span className="register-brand-dot">.</span>
                        </span>
                    </Link>

                    <div className="register-welcome">
                        <span className="register-kicker">
                            JOIN THE COMMUNITY
                        </span>

                        <h1>
                            The world is waiting for
                            <br />
                            <em>your kind of escape.</em>
                        </h1>

                        <p>
                            Create your personal account to save dream destinations,
                            build mindful itineraries, and travel by mood.
                        </p>
                    </div>

                    {error && (
                        <div className="register-error" role="alert">
                            <span>!</span>
                            {error}
                        </div>
                    )}

                    <form className="register-form" onSubmit={handleSubmit}>
                        {/* SECTION 01: PERSONAL DETAILS */}
                        <div className="register-section-header">
                            <span className="register-step-num">01</span>
                            <h2>Personal details</h2>
                            <div className="register-section-line" />
                        </div>

                        <div className="register-fields-grid">
                            <div className="register-field">
                                <label htmlFor="regFirstName">
                                    First name <span>*</span>
                                </label>
                                <input
                                    id="regFirstName"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={updateField}
                                    placeholder="Enter first name"
                                    autoComplete="given-name"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="register-field">
                                <label htmlFor="regLastName">
                                    Last name
                                </label>
                                <input
                                    id="regLastName"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={updateField}
                                    placeholder="Enter last name"
                                    autoComplete="family-name"
                                    maxLength={100}
                                />
                            </div>

                            <div className="register-field register-field-full">
                                <label htmlFor="regEmail">
                                    Email address <span>*</span>
                                </label>
                                <input
                                    id="regEmail"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={updateField}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    maxLength={150}
                                    required
                                />
                            </div>

                            <div className="register-field register-field-full">
                                <label htmlFor="regPhone">
                                    Mobile number
                                </label>
                                <div className="register-phone-box">
                                    <span className="register-flag-badge">
                                        🇮🇳 +91
                                    </span>
                                    <input
                                        id="regPhone"
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={updateField}
                                        placeholder="Enter 10-digit mobile number"
                                        autoComplete="tel-national"
                                        inputMode="tel"
                                        maxLength={15}
                                    />
                                </div>
                            </div>

                            <div className="register-field">
                                <label htmlFor="regPassword">
                                    Password <span>*</span>
                                </label>
                                <div className="register-pass-wrap">
                                    <input
                                        id="regPassword"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={updateField}
                                        placeholder="At least 8 characters"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="register-pass-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="register-field">
                                <label htmlFor="regConfirmPassword">
                                    Confirm password <span>*</span>
                                </label>
                                <div className="register-pass-wrap">
                                    <input
                                        id="regConfirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={form.confirmPassword}
                                        onChange={updateField}
                                        placeholder="Re-enter password"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="register-pass-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 02: TRAVEL PREFERENCES */}
                        <div className="register-section-header">
                            <span className="register-step-num">02</span>
                            <h2>Travel preferences</h2>
                            <div className="register-section-line" />
                            <span className="register-optional-tag">OPTIONAL</span>
                        </div>

                        <p className="register-preferences-prompt">
                            What kind of trips do you enjoy the most?
                        </p>

                        <div className="register-prefs-grid">
                            {travelOptions.map(({ label, icon: Icon }) => {
                                const selected = preferences.includes(label);

                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        className={`register-pref-chip ${selected ? "selected" : ""}`}
                                        onClick={() => togglePreference(label)}
                                        aria-pressed={selected}
                                    >
                                        <Icon size={18} />
                                        <span>{label}</span>
                                        <span className="register-chip-check">
                                            {selected && <Check size={12} strokeWidth={2.8} />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <p className="register-help-note">
                            <Compass size={14} />
                            <span>
                                Select all that inspire you. You can adjust your travel preferences anytime in your dashboard.
                            </span>
                        </p>

                        <button
                            type="submit"
                            className="register-submit-btn"
                            disabled={loading}
                        >
                            <span>{loading ? "Creating your account..." : "Create account"}</span>
                            {!loading && <ArrowRight size={17} />}
                        </button>

                        <p className="register-signin-link">
                            Already have a Roamly account?{" "}
                            <Link to="/login">Sign in</Link>
                        </p>

                        <p className="register-terms-copy">
                            By joining Roamly, you agree to our Terms of Travel and Privacy Policy. Your credentials and wishlist are kept safe.
                        </p>
                    </form>
                </div>
            </aside>
        </main>
    );
}
