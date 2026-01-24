import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "4mb" }));

/* ---------- ROUTES ---------- */
app.get("/api/status", (req, res) => {
  res.status(200).send("Server is live");
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

/* ---------- DATABASE ---------- */
await connectDB();


export default app;
