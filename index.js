import app from "./app.js";
import connectDB from "./config/db.js";
import { v2 as cloudinary } from "cloudinary";
import http from "http";
import { Server } from "socket.io";  // ✅ Correct import
import apponitment from "./model/apponitment.js";

const PORT = process.env.PORT || 3000;

cloudinary.config({
    cloud_name: "jaymaurya",
    api_key: "985448536857411",
    api_secret: "n3dfwlazpHJyXkcrrbwhq9nH0Hk",
});

const server = http.createServer(app);

// ✅ Socket.io setup
const io = new Server(server, {
    cors: {
        origin: "https://hummarichikitsa.vercel.app",
        methods: ["GET", "POST"],
    },
});

// ✅ Listen for connections
io.on("connection", (socket) => {
    console.log("⚡ New client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
    });
});

server.listen(PORT, async () => {
    await connectDB();
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

export default io
