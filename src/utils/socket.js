import { io } from "socket.io-client";

let socketInstance = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

/**
 * Get or create authenticated socket connection
 */
export function getSocket() {
  const token = localStorage.getItem("roamly-token");

  if (!token) {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
    return null;
  }

  // If already connected with same token
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  // If instance exists but disconnected or needs re-auth
  if (socketInstance) {
    socketInstance.auth = { token };
    socketInstance.connect();
    return socketInstance;
  }

  // Create new socket connection
  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000
  });

  socketInstance.on("connect_error", (err) => {
    console.warn("Roamly real-time socket connection warning:", err.message);
  });

  return socketInstance;
}

/**
 * Disconnect socket when user logs out
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Subscribe to booking updates with auto cleanup
 * @param {Function} callbacks.onBookingCreated Called when a booking is created
 * @param {Function} callbacks.onBookingUpdated Called when status is updated
 * @returns {Function} cleanup function to unsubscribe
 */
export function subscribeToBookingEvents({ onBookingCreated, onBookingUpdated }) {
  const socket = getSocket();
  if (!socket) return () => {};

  const handleCreated = (payload) => {
    if (typeof onBookingCreated === "function") {
      onBookingCreated(payload);
    }
  };

  const handleUpdated = (payload) => {
    if (typeof onBookingUpdated === "function") {
      onBookingUpdated(payload);
    }
  };

  socket.on("booking:created", handleCreated);
  socket.on("booking:status_updated", handleUpdated);

  return () => {
    socket.off("booking:created", handleCreated);
    socket.off("booking:status_updated", handleUpdated);
  };
}
