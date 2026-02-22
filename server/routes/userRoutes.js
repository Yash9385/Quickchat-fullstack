import express from "express";
import { checkAuth, login, signup, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js"; // 👈 add this

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);

// 🔥 FIXED ROUTE
userRouter.put("/update-profile", protectRoute, upload.single("image"), updateProfile);

userRouter.get("/check", protectRoute, checkAuth);

export default userRouter;