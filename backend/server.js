import path from "path";
import { Server } from "socket.io";
import io from "socket.io-client";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

dotenv.config();

app.use(express.json()); // to parse the incoming requests with JSON payloads (from req.body)
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.use(express.static(path.join(__dirname, "/frontend/dist")));

const ioz = new Server(server, {
  cors: {
    origin: ["https://d03a-14-232-113-238.ngrok-free.app"],
    methods: ["GET", "POST"],
  },
});

const socket = io("https://d03a-14-232-113-238.ngrok-free.app"); // Thay đổi URL nếu cần thiết

// Xử lý sự kiện khi kết nối thành công
socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("message", (message) => {
  console.log("Received message:", message);
  // Xử lý tin nhắn nhận được, ví dụ: hiển thị trên giao diện người dùng
});

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const userSocketMap = {}; // {userId: socketId}

ioz.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId != "undefined") userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  ioz.emit("getOnlineUsers", Object.keys(userSocketMap));

  // socket.on() is used to listen to the events. can be used both on client and server side
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    delete userSocketMap[userId];
    ioz.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

ioz.on("connect", () => {
  console.log("Connected to server");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server Running on port ${PORT}`);
});
