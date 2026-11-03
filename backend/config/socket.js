const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow all incoming origins for real-time mobile and web clients
        callback(null, true);
      },
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true
    },
    transports: ["websocket", "polling"]
  });

  // Authenticate socket connections using JWT
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const handshakeToken = socket.handshake.auth?.token;
      let token = handshakeToken;

      if (!token && authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, role }
      next();
    } catch (err) {
      return next(new Error("Authentication failed: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    if (!user) return;

    // Join room for this specific user
    socket.join(`user:${user.id}`);

    // If user is admin, join admin room
    if (user.role === "admin") {
      socket.join("admins");
    }

    socket.on("disconnect", () => {
      // Disconnect handled cleanly
    });
  });

  return io;
}

function getIo() {
  return io;
}

// Helper to notify admins and user of a new booking
function notifyBookingCreated(booking) {
  if (!io) return;
  // Notify admin room
  io.to("admins").emit("booking:created", {
    booking,
    message: `New booking request received for ${booking.destinationName || "destination"}`
  });

  // Notify the user who created it
  if (booking.userId) {
    io.to(`user:${booking.userId}`).emit("booking:created", {
      booking,
      message: "Your booking request has been submitted"
    });
  }
}

// Helper to notify user and admins of a status change (confirm, reject, cancel)
function notifyBookingStatusUpdated(booking) {
  if (!io) return;
  // Notify admin room
  io.to("admins").emit("booking:status_updated", {
    booking,
    message: `Booking ${booking.bookingReference} status changed to ${booking.status}`
  });

  // Notify the affected user
  if (booking.userId) {
    io.to(`user:${booking.userId}`).emit("booking:status_updated", {
      booking,
      message: `Your booking for ${booking.destinationName || "trip"} is now ${booking.status}`
    });
  }
}

module.exports = {
  initSocket,
  getIo,
  notifyBookingCreated,
  notifyBookingStatusUpdated
};
