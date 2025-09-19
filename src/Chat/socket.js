// socket.js
import io from "socket.io-client";

// Prefer explicit API URL; fall back to current origin for local dev.
const API_URL =
	process.env.REACT_APP_API_URL_MAIN ||
	`${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ""}`;

const socket = io(API_URL, {
	path: "/socket.io", // keep default path (matches server.js)
	transports: ["websocket", "polling"],
	reconnection: true,
	reconnectionAttempts: 10,
	reconnectionDelay: 800,
	reconnectionDelayMax: 5000,
	timeout: 25000, // match server pingTimeout
	withCredentials: true,
	autoConnect: true,
	auth: {
		client: "web",
	},
});

socket.on("connect", () => {
	// On reconnect, attempt to re-join active room (if any)
	try {
		const saved = JSON.parse(localStorage.getItem("currentChat"));
		const caseId = saved?.caseId;
		if (caseId) socket.emit("joinRoom", { caseId });
	} catch (e) {}
});

socket.on("connect_error", (err) => {
	console.error("[socket] connect_error:", err?.message || err);
});

export default socket;
