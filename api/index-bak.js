import http from "http";
import express from "express";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const userSockets = new Map();

io.on("connection", (socket) => {
  console.log(`Connected : ${socket.io}`);

  socket.on("user-join", (data) => {
    userSockets.set(data, socket.id);

    io.to(socket.id).emit("session-join", "Your session has been Started");
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId == socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Server is Running.." });
});

app.get("/api/logout", (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  const socketId = userSockets.get(userId);

  if (socketId) {
    io.to(socketId).emit("session-expired", "Your session has been terminated");
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "No Active session found" });
  }
});

app.get("/api/login", (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  const socketId = userSockets.get(userId);

  if (socketId) {
    io.to(socketId).emit(
      "session-join",
      "Your session has been Started Again!"
    );
    return res
      .status(200)
      .json({ success: true, message: "Login successfully" });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "No Active session found" });
  }
});

server.listen(3000, () => {
  console.log("Server Started on Port 3000");
});
