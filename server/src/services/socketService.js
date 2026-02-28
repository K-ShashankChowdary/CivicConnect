import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join user-specific and role-specific rooms
    socket.on("join_user_room", (userId, role) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`Socket ${socket.id} joined user room ${userId}`);
      }
      if (role === "admin" || role === "worker") {
        socket.join("admin_events");
        console.log(`Socket ${socket.id} joined admin_events`);
      }
    });

    socket.on("join_complaint", (complaintId) => {
      if (complaintId) {
        socket.join(`complaint_${complaintId}`);
        console.log(`Socket ${socket.id} joined complaint_${complaintId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized");
  }
  return io;
};
