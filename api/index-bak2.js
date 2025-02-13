import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// cors for socket io
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
});
// cors for web method post
app.use(cors({ origin: "*" }));

const userSockets = new Map();

io.on("connection", (socket) => {
  // console.log(userSockets);
  // console.log(`Connected : ${socket.id}`);

  // menampilkan user yang terkoneksi secara realtime ke website react
  io.emit("connectedUser", Object.fromEntries(userSockets));
  
  socket.on("user-join", (data) => {
    userSockets.set(data, socket.id);
    console.log(userSockets);
    
    io.emit("connectedUser", Object.fromEntries(userSockets));
    io.to(socket.id).emit("session-join", "Your are connected");
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId == socket.id) {
        userSockets.delete(userId);
        io.emit("connectedUser", Object.fromEntries(userSockets));
        break;
      }
    }
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Server is Running.. aman men.." });
});

app.post("/getLocation", (req, res) => {
  // const userId = req.query.userId;
  const { userId } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  const socketId = userSockets.get(userId);

  if (socketId) {
    io.to(socketId).emit("get-location", "Your location has been send");
    return res
      .status(200)
      .json({ success: true, message: "Getting Location.." });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "No Active session found" });
  }
});

app.post("/location", (req, res) => {
  const { latitude, longitude, imei } = req.body;
  if (!longitude && !latitude && !imei) return;
  console.log(latitude, longitude);
  const query =
    "INSERT INTO location (latitude, longitude, gmapsLink, imei) VALUES (?, ?, ?, ?)";
  const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  console.log("already sent location");
  io.emit("newLocation", { latitude, longitude, gmapsLink, imei });
  res.status(200).json({ success: true, message: "Message sent!" });
  // db.query(query, [latitude, longitude, gmapsLink, imei], (err, result) => {
  //   if (err) {
  //     console.log(err);
  //     res.status(500).json({ error: "Database error" });
  //   } else {
  //     io.emit("newLocation", { latitude, longitude, gmapsLink, imei });
  //     res.status(200).json({ success: true, message: "Message sent!" });
  //   }
  // });
});

server.listen(3000, () => {
  console.log("Server Started on Port 3000");
});
