import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ adminOnly = false }) {
    const { isLoggedIn, isAdmin } = useAuth();
    const location = useLocation();

    if (!isLoggedIn) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/user/dashboard" replace />;
    }

    if (!adminOnly && isAdmin) {
        return <Navigate to="/admin/bookings" replace />;
    }

    return <Outlet />;
}
