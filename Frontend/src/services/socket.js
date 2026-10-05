import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
    if (socket?.connected) return socket;

    const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
        console.warn("[socket] no token, skipping connection");
        return null;
    }

    socket = io("http://localhost:5000", {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
    });

    socket.on("connect", () => {
        // eslint-disable-next-line no-console
        console.log("[socket] connected", socket.id);
    });

    socket.on("connect_error", (err) => {
        // eslint-disable-next-line no-console
        console.warn("[socket] connect_error:", err.message);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};