import { io } from "socket.io-client";
import { API_BASE } from "../api/client.js";

let socketInstance = null;

function resolveSocketUrl() {
  const socketEnv = import.meta.env.VITE_SOCKET_URL;
  const apiEnv = import.meta.env.VITE_API_URL;

  // On remote/production domain
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    // If a dedicated WebSocket server is explicitly specified via VITE_SOCKET_URL
    if (socketEnv && !socketEnv.includes("localhost") && !socketEnv.includes("127.0.0.1")) {
      return socketEnv;
    }

    // If an external backend server is specified that is not hosted on Vercel serverless
    if (
      apiEnv &&
      !apiEnv.includes("localhost") &&
      !apiEnv.includes("127.0.0.1") &&
      !apiEnv.includes(".vercel.app") &&
      !apiEnv.startsWith("/")
    ) {
      return apiEnv.replace(/\/api\/?$/, "");
    }

    // Vercel serverless functions do not host persistent WebSocket servers.
    // Returning null prevents unsupported WebSocket handshakes to *.vercel.app.
    // Dashboards automatically use periodic REST polling for live data updates.
    return null;
  }

  // In local development: connect to local Socket.IO server
  return socketEnv || (apiEnv && !apiEnv.startsWith("/") ? apiEnv.replace(/\/api\/?$/, "") : "http://localhost:5000");
}

const SOCKET_URL = resolveSocketUrl();

/**
 * Get or create authenticated socket connection
 */
export function getSocket() {
  // If no dedicated WebSocket server is available in this environment
  if (!SOCKET_URL) {
    return null;
  }

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
  try {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      timeout: 10000
    });

    let warnedOnce = false;
    socketInstance.on("connect_error", (err) => {
      if (!warnedOnce) {
        warnedOnce = true;
        if (import.meta.env.DEV) {
          console.warn("Roamly real-time socket connection warning:", err.message);
        }
      }
    });

    socketInstance.on("reconnect_failed", () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    });

    return socketInstance;
  } catch (e) {
    return null;
  }
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
