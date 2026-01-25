import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import "dotenv/config";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

const app = express();
const server = http.createServer(app);

/* ---------- SOCKET.IO ---------- */
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

export const userSocketMap = {}; // userId -> socketId

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

/* ---------- MIDDLEWARE ---------- */
app.use(cors());
app.use(express.json({ limit: "5mb" }));

/* ---------- ROUTES ---------- */
app.get("/api/status", (req, res) => {
  res.status(200).send("Server is live");
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

/* ---------- DB CONNECT ---------- */
await connectDB();

/* ---------- LOCAL ONLY ---------- */
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log("Server running on PORT:", PORT);
  });
}

/* ---------- EXPORT FOR VERCEL ---------- */
export default server;
