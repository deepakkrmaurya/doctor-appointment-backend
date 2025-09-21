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
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

// ✅ Listen for connections
io.on("connection", (socket) => {
    console.log("⚡ New client connected:", socket.id);
    //update appointment
    // socket.on("update_appointmaet", async (data) => {
    //     try {
    //         const { appointment_id } = data
    //         const i = await apponitment.findByIdAndUpdate(appointment_id, { status: "completed" });
    //         const appointment = await apponitment.find({ patientId: i.patientId });
    //         console.log(appointment.length)
    //         io.emit("update_appointmaet", appointment);
    //         // completed
    //     } catch (error) {
    //         socket.emit("update_error", error.message);
    //     }
    // });

    socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
    });
});

server.listen(PORT, async () => {
    await connectDB();
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

export default io
