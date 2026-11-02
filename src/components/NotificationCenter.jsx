import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Check,
  Compass,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { subscribeToBookingEvents } from "../utils/socket.js";

const STORAGE_KEY = "roamly_user_notifications";

export default function NotificationCenter() {
  const { isLoggedIn, user } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Initialize notifications from localStorage
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Initial welcome concierge notification
    return [
      {
        id: "notif-welcome",
        title: "Welcome to Roamly Concierge",
        message: "Explore mood-tailored escapes and track trip approvals in real time.",
        type: "info",
        timestamp: new Date().toISOString(),
        read: false
      }
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 20)));
    } catch {}
  }, [notifications]);

  // Real-time socket event listener
  useEffect(() => {
    if (!isLoggedIn) return;

    const unsubscribe = subscribeToBookingEvents({
      onBookingCreated: (payload) => {
        const newNotif = {
          id: "notif-" + Date.now(),
          title: "Trip Request Submitted",
          message: payload?.message || `Your trip request (${payload?.booking?.bookingReference || "New"}) is pending concierge review.`,
          bookingRef: payload?.booking?.bookingReference,
          type: "pending",
          timestamp: new Date().toISOString(),
          read: false
        };
        setNotifications((prev) => [newNotif, ...prev]);
      },
      onBookingUpdated: (payload) => {
        const isApproved = payload?.status === "confirmed";
        const isDeclined = payload?.status === "rejected";
        const newNotif = {
          id: "notif-" + Date.now(),
          title: isApproved
            ? "Trip Confirmed! 🎉"
            : isDeclined
            ? "Trip Update: Declined"
            : "Trip Status Updated",
          message: payload?.message || `Booking status changed to ${payload?.status}.`,
          bookingRef: payload?.booking?.bookingReference,
          type: isApproved ? "confirmed" : isDeclined ? "rejected" : "info",
          timestamp: new Date().toISOString(),
          read: false
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isLoggedIn]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const timeAgo = (isoString) => {
    if (!isoString) return "Recently";
    const date = new Date(isoString);
    const sec = Math.floor((new Date() - date) / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="notif-center-wrapper" ref={dropdownRef}>
      {/* BELL TRIGGER BUTTON */}
      <button
        type="button"
        className={`notif-bell-btn ${open ? "active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="View notifications"
        title="Real-time trip notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="notif-badge-pill">
            {unreadCount > 9 ? "9+" : unreadCount}
            <span className="notif-ping-ring" />
          </span>
        )}
      </button>

      {/* NOTIFICATIONS DROPDOWN */}
      {open && (
        <div className="notif-dropdown-panel" role="region" aria-label="Notifications panel">
          {/* PANEL HEADER */}
          <div className="notif-panel-header">
            <div className="notif-header-title">
              <Sparkles size={16} color="#059669" />
              <strong>Trip Notifications</strong>
              {unreadCount > 0 && <span className="notif-unread-count">{unreadCount} new</span>}
            </div>

            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-action-text-btn"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <Check size={13} />
                  <span>Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="notif-action-text-btn"
                  onClick={clearAll}
                  title="Clear all notifications"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* NOTIFICATIONS LIST */}
          <div className="notif-items-list">
            {notifications.length === 0 ? (
              <div className="notif-empty-state">
                <Compass size={28} className="empty-compass" />
                <p>No notifications yet</p>
                <small>Trip reservations & concierge updates will appear here.</small>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notif-item ${item.read ? "read" : "unread"} type-${item.type}`}
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                    );
                  }}
                >
                  <div className="notif-item-icon-wrap">
                    {item.type === "confirmed" && <CheckCircle2 size={16} color="#10b981" />}
                    {item.type === "pending" && <Clock size={16} color="#f59e0b" />}
                    {item.type === "rejected" && <AlertCircle size={16} color="#ef4444" />}
                    {item.type === "info" && <Sparkles size={16} color="#10b981" />}
                  </div>

                  <div className="notif-item-content">
                    <div className="notif-item-top">
                      <strong>{item.title}</strong>
                      <span className="notif-timestamp">{timeAgo(item.timestamp)}</span>
                    </div>

                    <p className="notif-message-text">{item.message}</p>

                    {item.bookingRef && (
                      <span className="notif-ref-tag">
                        Ref: <code>{item.bookingRef}</code>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PANEL FOOTER LINK */}
          {isLoggedIn && (
            <div className="notif-panel-footer">
              <Link
                to="/user/dashboard"
                className="notif-footer-link"
                onClick={() => setOpen(false)}
              >
                <span>Go to My Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
