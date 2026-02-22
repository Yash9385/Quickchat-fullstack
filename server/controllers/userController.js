import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// Signup a new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.json({ success: false, message: "Account already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio
        });

        const token = generateToken(newUser._id);

        res.json({
            success: true,
            userData: newUser,
            token,
            message: "Account created successfully"
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Controller to login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });

        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);

        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken(userData._id);

        res.json({
            success: true,
            userData,
            token,
            message: "Login successful"
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({ success: true, user: req.user });
};

// Controller to update user profile details (FINAL FIXED)
export const updateProfile = async (req, res) => {
    try {
        const { bio, fullName } = req.body;

        const userId = req.user._id;
        let profilePicUrl = req.user.profilePic;

        // agar new image upload hui hai
        if (req.file) {
            const upload = await new Promise((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream({ folder: "profiles" }, (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    })
                    .end(req.file.buffer);
            });

            profilePicUrl = upload.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fullName, bio, profilePic: profilePicUrl },
            { new: true }
        );

        res.json({ success: true, user: updatedUser });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};