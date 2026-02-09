import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

// 🔥 ALWAYS ATTACH JWT TO EVERY REQUEST
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    // ✅ Check auth when token exists
    useEffect(() => {
        if (token) checkAuth();
    }, [token]);

    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (err) {}
    };

    // ✅ LOGIN
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);

            if (data.success) {
                localStorage.setItem("token", data.token);
                setToken(data.token);
                setAuthUser(data.userData);
                connectSocket(data.userData);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    // ✅ LOGOUT
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);

        if (socket) {
            socket.disconnect();
            setSocket(null);
        }

        toast.success("Logged out");
    };

    // ✅ UPDATE PROFILE
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        }
    };

    // 🔌 SOCKET CONNECT
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;

        const newSocket = io(backendUrl, {
            auth: { token: localStorage.getItem("token") },
            query: { userId: userData._id },
        });

        newSocket.on("getOnlineUsers", (ids) => setOnlineUsers(ids));

        setSocket(newSocket);
    };

    return (
        <AuthContext.Provider
            value={{
                axios,
                authUser,
                onlineUsers,
                socket,
                login,
                logout,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
