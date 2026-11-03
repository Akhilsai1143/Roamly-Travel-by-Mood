import { io } from "socket.io-client";

// Global singleton socket instance
let socketInstance = null;
let activeToken = null;

// Deduplicated event listeners registry to prevent repeated event handlers
const createdListeners = new Set();
const updatedListeners = new Set();
let masterListenersBound = false;

/**
 * Determine the appropriate Socket.IO server URL based on the runtime environment.
 * If running on a serverless host (such as Vercel) where persistent WebSockets are not supported,
 * and no dedicated external WebSocket URL is configured via VITE_SOCKET_URL, returns null.
 */
export function resolveSocketUrl() {
  const socketEnv = typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_WS_URL)
    : null;
  const apiEnv = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_API_URL
    : null;

  // 1. Explicitly configured dedicated WebSocket server (e.g. Railway, Render, VPS)
  if (socketEnv && socketEnv.trim()) {
    const clean = socketEnv.trim().replace(/\/+$/, "");
    if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      if (!clean.includes("localhost") && !clean.includes("127.0.0.1")) {
        return clean;
      }
    } else {
      return clean;
    }
  }

  // 2. Separately hosted backend API (not localhost and not *.vercel.app)
  if (apiEnv && apiEnv.trim() && !apiEnv.startsWith("/")) {
    const cleanApi = apiEnv.trim().replace(/\/api\/?$/, "").replace(/\/+$/, "");
    if (!cleanApi.includes("localhost") && !cleanApi.includes("127.0.0.1") && !cleanApi.includes(".vercel.app")) {
      return cleanApi;
    }
  }

  // 3. Local development: connect to local Node.js Express server on port 5000
  if (
    typeof window === "undefined" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000";
  }

  // 4. Remote/production deployment on Vercel without a separately hosted backend:
  // Vercel serverless functions terminate per request and cannot host persistent WebSockets.
  // Returning null prevents invalid WebSocket handshakes to *.vercel.app (unexpected response 200).
  return null;
}

/**
 * Bind master event listeners to the socket instance once to prevent duplicate handlers.
 */
function bindMasterListeners(socket) {
  if (masterListenersBound || !socket) return;

  socket.on("booking:created", (payload) => {
    createdListeners.forEach((callback) => {
      try {
        if (typeof callback === "function") callback(payload);
      } catch (err) {
        console.error("[Roamly Socket] Error in booking:created handler:", err);
      }
    });
  });

  socket.on("booking:status_updated", (payload) => {
    updatedListeners.forEach((callback) => {
      try {
        if (typeof callback === "function") callback(payload);
      } catch (err) {
        console.error("[Roamly Socket] Error in booking:status_updated handler:", err);
      }
    });
  });

  masterListenersBound = true;
}

/**
 * Get or create authenticated singleton socket connection
 */
export function getSocket() {
  const targetUrl = resolveSocketUrl();

  // If no persistent WebSocket server is available in this environment
  if (!targetUrl) {
    return null;
  }

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("roamly-token") : null;

  if (!token) {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      activeToken = null;
      masterListenersBound = false;
    }
    return null;
  }

  // Reuse existing connected or connecting socket if token has not changed
  if (socketInstance && activeToken === token) {
    if (socketInstance.connected || socketInstance.connecting) {
      return socketInstance;
    }
    // Reconnect disconnected instance
    socketInstance.auth = { token };
    socketInstance.connect();
    return socketInstance;
  }

  // If token changed or previous instance needs cleanup
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    masterListenersBound = false;
  }

  // Create new singleton socket connection
  try {
    socketInstance = io(targetUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      timeout: 10000
    });

    activeToken = token;

    socketInstance.on("connect_error", (err) => {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
        console.warn("[Roamly Socket] Real-time connection warning:", err.message);
      }
    });

    socketInstance.on("reconnect_failed", () => {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
        console.warn("[Roamly Socket] Reconnection attempts exhausted.");
      }
    });

    bindMasterListeners(socketInstance);

    return socketInstance;
  } catch (err) {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.warn("[Roamly Socket] Initialization error:", err.message);
    }
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
    activeToken = null;
    masterListenersBound = false;
  }
}

/**
 * Subscribe to booking updates with automatic listener registry & cleanup.
 * Prevents duplicate listeners and ensures clean unsubscribes.
 * @param {Function} callbacks.onBookingCreated Called when a booking is created
 * @param {Function} callbacks.onBookingUpdated Called when status is updated
 * @returns {Function} cleanup function to unsubscribe
 */
export function subscribeToBookingEvents({ onBookingCreated, onBookingUpdated } = {}) {
  const socket = getSocket();

  if (typeof onBookingCreated === "function") {
    createdListeners.add(onBookingCreated);
  }
  if (typeof onBookingUpdated === "function") {
    updatedListeners.add(onBookingUpdated);
  }

  if (socket) {
    bindMasterListeners(socket);
  }

  return () => {
    if (typeof onBookingCreated === "function") {
      createdListeners.delete(onBookingCreated);
    }
    if (typeof onBookingUpdated === "function") {
      updatedListeners.delete(onBookingUpdated);
    }
  };
}
