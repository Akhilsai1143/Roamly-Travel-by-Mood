import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
    X,
    Compass,
    User,
    Mail,
    Phone,
    ArrowRight,
    Sparkles,
    Check,
    CheckCircle2,
    Mountain,
    Waves,
    TentTree,
    Landmark,
    Trees,
    Building2,
    AlertCircle,
    Loader2
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { welcomeRegisterUser } from "../api/auth.js";
import "./WelcomePopup.css";

const STORAGE_KEY = "roamly_welcome_popup_dismissed";

const TRAVEL_INTERESTS = [
    { id: "Nature", label: "Nature", icon: Mountain },
    { id: "Beaches", label: "Beaches", icon: Waves },
    { id: "Adventure", label: "Adventure", icon: TentTree },
    { id: "Historical Places", label: "Historical Places", icon: Landmark },
    { id: "Wildlife", label: "Wildlife", icon: Trees },
    { id: "City Exploration", label: "City Exploration", icon: Building2 }
];

export default function WelcomePopup() {
    const location = useLocation();
    const { isLoggedIn, saveSession } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        travelInterest: "Adventure"
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const timerRef = useRef(null);
    const hasTriggeredRef = useRef(false);
    const autoCloseTimerRef = useRef(null);

    // Permanently dismiss the popup for this browser
    const dismissPopup = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, "true");
        } catch (e) {
            console.warn("Unable to save to localStorage:", e);
        }
        setIsOpen(false);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
            autoCloseTimerRef.current = null;
        }
    }, []);

    // 1. SCROLL DETECTOR & 2-SECOND DELAY LISTENER
    useEffect(() => {
        // Check if already dismissed in localStorage
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (dismissed === "true") {
            return;
        }

        // Do not display if user is already logged in
        if (isLoggedIn) {
            return;
        }

        // Avoid showing on dedicated auth or admin routes
        const path = location.pathname;
        if (
            path === "/login" ||
            path === "/register" ||
            path.startsWith("/admin")
        ) {
            return;
        }

        const handleScroll = () => {
            // Wait until user scrolls down (threshold > 30px)
            if (window.scrollY > 30 && !hasTriggeredRef.current) {
                hasTriggeredRef.current = true;
                window.removeEventListener("scroll", handleScroll);

                // Wait approximately 2 seconds after scrolling begins
                timerRef.current = setTimeout(() => {
                    const isStillDismissed = localStorage.getItem(STORAGE_KEY);
                    if (!isStillDismissed) {
                        setIsOpen(true);
                    }
                }, 2000);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isLoggedIn, location.pathname]);

    // 2. PREVENT BACKGROUND SCROLLING WHILE OPEN
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    // 3. CLOSE ON ESCAPE KEY
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                dismissPopup();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, dismissPopup]);

    // Clean up auto-close timer on unmount
    useEffect(() => {
        return () => {
            if (autoCloseTimerRef.current) {
                clearTimeout(autoCloseTimerRef.current);
            }
        };
    }, []);

    if (!isOpen) {
        return null;
    }

    // Input handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        if (error) setError("");
    };

    const handleSelectInterest = (interestId) => {
        setFormData((prev) => ({
            ...prev,
            travelInterest: interestId
        }));
        if (error) setError("");
    };

    // Outside click handler on the backdrop overlay
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            dismissPopup();
        }
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const fullName = formData.fullName.trim();
        const email = formData.email.trim();
        const phone = formData.phone.trim();
        const travelInterest = formData.travelInterest;

        // Validation
        if (!fullName) {
            setError("Please enter your full name.");
            return;
        }

        if (fullName.length < 2) {
            setError("Please enter a valid full name.");
            return;
        }

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please provide a valid email address (e.g. name@domain.com).");
            return;
        }

        if (!phone) {
            setError("Please enter your mobile number.");
            return;
        }

        const digitsOnly = phone.replace(/\D/g, "");
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        if (!travelInterest) {
            setError("Please select your preferred travel interest.");
            return;
        }

        setLoading(true);

        try {
            const result = await welcomeRegisterUser({
                fullName,
                email,
                phone,
                travelInterest
            });

            // Mark popup permanently dismissed
            try {
                localStorage.setItem(STORAGE_KEY, "true");
            } catch (err) {
                console.warn("Storage write failed", err);
            }

            // If a valid login session was returned and session saving is available
            if (result?.token && result?.user && saveSession) {
                try {
                    saveSession(result);
                } catch (sessErr) {
                    console.warn("Session save note:", sessErr);
                }
            }

            setSuccess(true);
            setSuccessMessage(
                result?.message ||
                "Welcome to Roamly! Your travel adventure starts now."
            );

            // Auto-close after 3 seconds
            autoCloseTimerRef.current = setTimeout(() => {
                dismissPopup();
            }, 3000);
        } catch (err) {
            console.error("Welcome popup registration error:", err);
            setError(
                err.message ||
                "We were unable to complete your registration. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="welcome-popup-overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-popup-title"
        >
            <div className="welcome-popup-container">
                {/* Close Button (X) */}
                <button
                    type="button"
                    className="welcome-popup-close-btn"
                    onClick={dismissPopup}
                    aria-label="Close welcome popup"
                    title="Close (Esc)"
                >
                    <X size={20} strokeWidth={2.4} />
                </button>

                {/* LEFT HERO IMAGE SECTION */}
                <div className="welcome-popup-visual">
                    <div className="welcome-visual-overlay" />
                    <img
                        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=85"
                        alt="Serene mountain panoramic view"
                        className="welcome-visual-img"
                    />

                    <div className="welcome-visual-content">
                        {/* Roamly Brand Header */}
                        <div className="welcome-visual-brand">
                            <span className="welcome-brand-mark">
                                <Compass size={22} strokeWidth={2.4} />
                            </span>
                            <div className="welcome-brand-text-wrap">
                                <span className="welcome-brand-text">
                                    roamly<span className="welcome-brand-dot">.</span>
                                </span>
                                <small className="welcome-brand-tag">TRAVEL BY MOOD</small>
                            </div>
                        </div>

                        {/* Visual Center Copy */}
                        <div className="welcome-visual-copy">
                            <span className="welcome-visual-badge">
                                <Sparkles size={13} />
                                <span>Curated Travel Membership</span>
                            </span>
                            <h2 id="welcome-popup-title" className="welcome-visual-title">
                                Your next adventure starts here<span className="welcome-dot">.</span>
                            </h2>
                            <p className="welcome-visual-desc">
                                Join Roamly and discover destinations, exclusive travel experiences, and personalized journeys.
                            </p>
                        </div>

                        {/* Visual Trust Badges */}
                        <div className="welcome-visual-perks">
                            <div className="welcome-perk-item">
                                <span className="welcome-perk-dot" />
                                <span>15,000+ Travellers</span>
                            </div>
                            <div className="welcome-perk-item">
                                <span className="welcome-perk-dot" />
                                <span>Handcrafted Escapes</span>
                            </div>
                            <div className="welcome-perk-item">
                                <span className="welcome-perk-dot" />
                                <span>Travel by Mood</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT FORM SECTION */}
                <div className="welcome-popup-form-panel">
                    {success ? (
                        /* SUCCESS STATE */
                        <div className="welcome-success-state">
                            <div className="welcome-success-icon-wrap">
                                <CheckCircle2 size={54} strokeWidth={2.2} />
                            </div>
                            <span className="welcome-success-kicker">WELCOME TO THE COMMUNITY</span>
                            <h3 className="welcome-success-title">
                                You are ready to roam, {formData.fullName.split(" ")[0]}!
                            </h3>
                            <p className="welcome-success-desc">
                                {successMessage}
                            </p>
                            <div className="welcome-success-perk-box">
                                <div className="welcome-success-perk">
                                    <Sparkles size={16} />
                                    <span>Personalized Mood Recommendations</span>
                                </div>
                                <div className="welcome-success-perk">
                                    <Check size={16} />
                                    <span>Wishlist & Trip Planner Unlocked</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="welcome-btn-primary welcome-success-cta"
                                onClick={dismissPopup}
                            >
                                <span>Explore Roamly Escapes</span>
                                <ArrowRight size={17} />
                            </button>
                        </div>
                    ) : (
                        /* REGISTRATION FORM */
                        <div className="welcome-form-inner">
                            <div className="welcome-form-header">
                                <span className="welcome-form-kicker">
                                    <Sparkles size={14} /> EXCLUSIVE INVITATION
                                </span>
                                <h3 className="welcome-form-title">
                                    Join the Roamly Escape
                                </h3>
                                <p className="welcome-form-subtitle">
                                    Sign up in seconds to unlock personalized mood-based destinations.
                                </p>
                            </div>

                            {/* ERROR MESSAGE ALERT */}
                            {error && (
                                <div className="welcome-error-box" role="alert">
                                    <AlertCircle size={17} className="welcome-error-icon" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="welcome-form" noValidate>
                                {/* FIELD 1: FULL NAME */}
                                <div className="welcome-form-group">
                                    <label htmlFor="welcome-fullName" className="welcome-label">
                                        Full name <span className="required-star">*</span>
                                    </label>
                                    <div className="welcome-input-wrap">
                                        <User size={17} className="welcome-input-icon" />
                                        <input
                                            type="text"
                                            id="welcome-fullName"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            placeholder="e.g. Arjun Sharma"
                                            autoComplete="name"
                                            disabled={loading}
                                            className="welcome-input"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* FIELD 2: EMAIL ADDRESS */}
                                <div className="welcome-form-group">
                                    <label htmlFor="welcome-email" className="welcome-label">
                                        Email address <span className="required-star">*</span>
                                    </label>
                                    <div className="welcome-input-wrap">
                                        <Mail size={17} className="welcome-input-icon" />
                                        <input
                                            type="email"
                                            id="welcome-email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            disabled={loading}
                                            className="welcome-input"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* FIELD 3: MOBILE NUMBER */}
                                <div className="welcome-form-group">
                                    <label htmlFor="welcome-phone" className="welcome-label">
                                        Mobile number <span className="required-star">*</span>
                                    </label>
                                    <div className="welcome-phone-row">
                                        <div className="welcome-flag-badge">
                                            <span>🇮🇳 +91</span>
                                        </div>
                                        <div className="welcome-input-wrap welcome-phone-input-wrap">
                                            <Phone size={17} className="welcome-input-icon" />
                                            <input
                                                type="tel"
                                                id="welcome-phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="98765 43210"
                                                autoComplete="tel"
                                                inputMode="tel"
                                                disabled={loading}
                                                className="welcome-input"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* FIELD 4: TRAVEL INTEREST */}
                                <div className="welcome-form-group">
                                    <label className="welcome-label">
                                        Travel interest <span className="required-star">*</span>
                                    </label>
                                    <div className="welcome-interests-grid">
                                        {TRAVEL_INTERESTS.map(({ id, label, icon: Icon }) => {
                                            const isSelected = formData.travelInterest === id;
                                            return (
                                                <button
                                                    type="button"
                                                    key={id}
                                                    className={`welcome-interest-chip ${isSelected ? "selected" : ""}`}
                                                    onClick={() => handleSelectInterest(id)}
                                                    disabled={loading}
                                                    aria-pressed={isSelected}
                                                >
                                                    <Icon size={14} className="interest-icon" />
                                                    <span className="interest-label">{label}</span>
                                                    {isSelected && (
                                                        <Check size={13} className="interest-check" strokeWidth={2.8} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* PRIMARY ACTION BUTTON: JOIN ROAMLY */}
                                <button
                                    type="submit"
                                    className="welcome-btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="welcome-spin" />
                                            <span>Joining Roamly...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Join Roamly</span>
                                            <ArrowRight size={17} />
                                        </>
                                    )}
                                </button>

                                <p className="welcome-terms-note">
                                    By joining Roamly, you agree to receive curated travel ideas. No spam, ever. Unsubscribe anytime.
                                </p>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

