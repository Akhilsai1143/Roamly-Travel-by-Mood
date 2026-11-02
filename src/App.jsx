import React, { Component, useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Compass, RefreshCw } from "lucide-react";

import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AIChat from "./components/AIChat.jsx";
import WelcomePopup from "./components/WelcomePopup.jsx";


// Core routes loaded immediately
import Home from "./pages/Home.jsx";
import Discover from "./pages/Discover.jsx";
import Destination from "./pages/Destination.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

// Secondary & heavy routes lazy-loaded to cut initial bundle size
const Planner = lazy(() => import("./pages/Planner.jsx"));
const Surprise = lazy(() => import("./pages/Surprise.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.jsx"));
const Stories = lazy(() => import("./pages/Stories.jsx"));
const Reviews = lazy(() => import("./pages/Reviews.jsx"));
const Hotels = lazy(() => import("./pages/Hotels.jsx"));
const HotelDetail = lazy(() => import("./pages/HotelDetail.jsx"));
const AdminDestinations = lazy(() => import("./pages/AdminDestinations.jsx"));
const AdminBookings = lazy(() => import("./pages/AdminBookings.jsx"));
const AdminPackages = lazy(() => import("./pages/AdminPackages.jsx"));
const AdminPartners = lazy(() => import("./pages/AdminPartners.jsx"));
const AdminProfitAnalysis = lazy(() => import("./pages/AdminProfitAnalysis.jsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.jsx"));
const AdminPayments = lazy(() => import("./pages/AdminPayments.jsx"));
const UserDashboard = lazy(() => import("./pages/UserDashboard.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

// Elegant lightweight spinner for page transitions
function PageLoader() {
    return (
        <div style={{
            minHeight: "55vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            color: "#1b4332"
        }}>
            <Compass size={38} className="spinning-icon" color="#1b4332" />
            <span style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "1.2px",
                color: "#64748b",
                textTransform: "uppercase"
            }}>
                Loading Roamly...
            </span>
        </div>
    );
}

// Global React Error Boundary to catch any unexpected runtime issues safely
class RootErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Roamly RootErrorBoundary caught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-screen">
                    <div className="error-boundary-box">
                        <div className="error-compass-wrap">
                            <Compass size={44} className="spinning-icon" />
                        </div>
                        <h2>An unexpected detour occurred</h2>
                        <p>
                            Don't worry, your travel notes and wishlist are safe.
                            Click below to return safely to the road.
                        </p>
                        {this.state.error?.message && (
                            <div style={{ margin: "14px 0", textAlign: "left" }}>
                                <details style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
                                    <summary style={{ cursor: "pointer", fontWeight: 600 }}>Technical details</summary>
                                    <pre style={{ marginTop: "8px", whiteSpace: "pre-wrap", color: "#dc2626", fontFamily: "monospace", fontSize: "11px" }}>
                                        {this.state.error.toString()}
                                    </pre>
                                </details>
                            </div>
                        )}
                        <div className="error-actions">
                            <button
                                type="button"
                                className="button button-dark"
                                onClick={() => {
                                    this.setState({ hasError: false });
                                    window.location.href = "/";
                                }}
                            >
                                Return to Home
                            </button>
                            <button
                                type="button"
                                className="button button-outline"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw size={15} /> Reload page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    const location = useLocation();

    const [savedIds, setSavedIds] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem("roamly-wishlist") || "[]"
            );
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(
            "roamly-wishlist",
            JSON.stringify(savedIds)
        );
    }, [savedIds]);

    // Dynamic document title update based on active route
    useEffect(() => {
        const path = location.pathname;
        if (path === "/") {
            document.title = "Roamly — Travel by Mood | Handpicked Indian & Global Escapes";
        } else if (path === "/discover") {
            document.title = "Roamly | Discover Escapes Across India & Beyond";
        } else if (path === "/hotels" || path === "/stays") {
            document.title = "Roamly | Verified Boutique Stays, Havelis & Mountain Chalets";
        } else if (path.startsWith("/hotel/") || path.startsWith("/stays/")) {
            document.title = "Roamly | Handpicked Boutique Stay Details";
        } else if (path === "/planner") {
            document.title = "Roamly | Mindful Trip Planner & Itinerary Builder";
        } else if (path === "/surprise") {
            document.title = "Roamly | The Serendipity Machine";
        } else if (path === "/wishlist") {
            document.title = "Roamly | Your Saved Escapes";
        } else if (path === "/reviews") {
            document.title = "Roamly | Community Stories & Reviews";
        } else if (path === "/stories") {
            document.title = "Roamly | Travel Notes & Field Stories";
        } else if (path.startsWith("/user/dashboard")) {
            document.title = "Roamly | User Dashboard";
        } else if (path.startsWith("/admin")) {
            document.title = "Roamly | Admin Portal";
        }
    }, [location.pathname]);

    function toggleSaved(id) {
        if (!id) return;
        setSavedIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    }

    const hideLayout = [
        "/login",
        "/register",
        "/admin/destinations",
        "/admin/bookings",
        "/admin/users",
        "/user/dashboard"
    ].includes(location.pathname) || location.pathname.startsWith("/admin");

    return (
        <RootErrorBoundary>
            <div className="app-shell">
                {!hideLayout && (
                    <Header wishlistCount={savedIds.length} />
                )}

                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Home
                                    savedIds={savedIds}
                                    onToggleSave={toggleSaved}
                                />
                            }
                        />

                        <Route
                            path="/discover"
                            element={
                                <Discover
                                    savedIds={savedIds}
                                    onToggleSave={toggleSaved}
                                />
                            }
                        />

                        <Route
                            path="/destination/:id"
                            element={
                                <Destination
                                    savedIds={savedIds}
                                    onToggleSave={toggleSaved}
                                />
                            }
                        />

                        <Route
                            path="/hotels"
                            element={
                                <Hotels
                                    savedIds={savedIds}
                                    onToggleSave={toggleSaved}
                                />
                            }
                        />

                        <Route
                            path="/stays"
                            element={
                                <Hotels
                                    savedIds={savedIds}
                                    onToggleSave={toggleSaved}
                                />
                            }
                        />

                        <Route
                            path="/hotel/:id"
                            element={
                                <HotelDetail
                                    savedIds={savedIds}
                                    onToggleSave={toggleSaved}
                                />
                            }
                        />

                        <Route
                            path="/stays/:id"
                            element={
                                <HotelDetail
                                    savedIds={savedIds}
                                    onToggleSave={toggleSaved}
                                />
                            }
                        />

                        <Route path="/planner" element={<Planner />} />

                        <Route
                            path="/surprise"
                            element={
                                <Surprise
                                    savedIds={savedIds}
                                    onToggleSave={toggleSaved}
                                />
                            }
                        />

                        <Route
                            path="/wishlist"
                            element={
                                <Wishlist
                                    savedIds={savedIds}
                                    toggleSaved={toggleSaved}
                                    onToggleSave={toggleSaved}
                                />
                            }
                        />

                        <Route path="/stories" element={<Stories />} />

                        <Route path="/reviews" element={<Reviews />} />

                        <Route path="/login" element={<Login />} />

                        <Route path="/register" element={<Register />} />

                        <Route element={<ProtectedRoute adminOnly />}>
                            <Route
                                path="/admin"
                                element={<AdminBookings />}
                            />
                            <Route
                                path="/admin/bookings"
                                element={<AdminBookings />}
                            />
                            <Route
                                path="/admin/packages"
                                element={<AdminPackages />}
                            />
                            <Route
                                path="/admin/partners"
                                element={<AdminPartners />}
                            />
                            <Route
                                path="/admin/profit-analysis"
                                element={<AdminProfitAnalysis />}
                            />
                            <Route
                                path="/admin/destinations"
                                element={<AdminDestinations />}
                            />
                            <Route
                                path="/admin/users"
                                element={<AdminUsers />}
                            />
                            <Route
                                path="/admin/payments"
                                element={<AdminPayments />}
                            />
                        </Route>

                        <Route element={<ProtectedRoute />}>
                            <Route
                                path="/user/dashboard"
                                element={
                                    <UserDashboard
                                        savedCount={savedIds.length}
                                        savedIds={savedIds}
                                        onToggleSave={toggleSaved}
                                    />
                                }
                            />
                        </Route>

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>

                {/* Floating AI Travel Assistant */}
                <AIChat />

                {/* Premium Welcome & Registration Promotional Popup */}
                <WelcomePopup />

                {!hideLayout && <Footer />}
            </div>
        </RootErrorBoundary>

    );
}
