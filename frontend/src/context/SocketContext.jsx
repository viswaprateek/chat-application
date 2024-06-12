// src/context/SocketContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";

// Create the context
const SocketContext = createContext();

// Custom hook for easy access to the context
export const useSocketContext = () => useContext(SocketContext);

// Provider component
export const SocketContextProvider = ({ children }) => {
	const { authUser } = useAuthContext();
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);

	useEffect(() => {
		if (authUser) {
			// Establish the Socket.IO connection
			const newSocket = io("http://localhost:5000", { // Use http:// for local development
				query: {
					userId: authUser._id,
				},
				transports: ["websocket", "polling"], // Fallback to polling if WebSocket fails
			});

			setSocket(newSocket);

			// Handle events
			newSocket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

			// Error handling
			newSocket.on("connect_error", (err) => {
				console.error("Connection error:", err);
			});

			newSocket.on("reconnect_attempt", () => {
				console.log("Attempting to reconnect...");
			});

			// Clean up on unmount or user change
			return () => {
				newSocket.close();
				setSocket(null);
			};
		} else {
			// Close socket if no authenticated user
			if (socket) {
				socket.close();
				setSocket(null);
			}
		}
	}, [authUser]);

	return (
		<SocketContext.Provider value={{ socket, onlineUsers }}>
			{children}
		</SocketContext.Provider>
	);
};
