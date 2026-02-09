import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import jwt from "jsonwebtoken";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import User from "./models/User.js";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Routes
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Socket.io
export const io = new Server(server, {
  cors: { origin: "*" },
});

export const userSocketMap = {};

// 🔐 SOCKET AUTH (JWT FIX)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.log("jwt must be provided");
      return next(new Error("jwt must be provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return next(new Error("User not found"));

    socket.user = user;
    next();
  } catch (err) {
    console.log("Socket Auth Error:", err.message);
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();

  console.log("User Connected", userId);
  userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// DB + Server start
await connectDB();

const PORT = process.env.PORT || 5001;
server.listen(PORT, () =>
  console.log("Server is running on PORT:", PORT)
);

export default server;
