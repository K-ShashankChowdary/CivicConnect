import { io } from "socket.io-client";

// Connect to the base server (stripping /api if it's there)
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true
});
