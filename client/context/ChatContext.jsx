import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { socket, axios } = useContext(AuthContext);

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) setMessages(data.messages);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const sendMessage = async (body) => {
        try {
            const { data } = await axios.post(
                `/api/messages/send/${selectedUser._id}`,
                body
            );
            if (data.success)
                setMessages((prev) => [...prev, data.newMessage]);
        } catch (err) {
            toast.error(err.message);
        }
    };

    useEffect(() => {
        if (!socket) return;

        socket.on("newMessage", (msg) => {
            if (selectedUser && msg.senderId === selectedUser._id) {
                setMessages((prev) => [...prev, msg]);
                axios.put(`/api/messages/mark/${msg._id}`);
            } else {
                setUnseenMessages((prev) => ({
                    ...prev,
                    [msg.senderId]: (prev[msg.senderId] || 0) + 1,
                }));
            }
        });

        return () => socket.off("newMessage");
    }, [socket, selectedUser]);

    return (
        <ChatContext.Provider
            value={{
                messages,
                users,
                selectedUser,
                setSelectedUser,
                unseenMessages,
                getUsers,
                getMessages,
                sendMessage,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
