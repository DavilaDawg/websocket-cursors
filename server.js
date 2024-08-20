import express from "express";
import * as http from "node:http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://hop-sand.vercel.app"],
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Welcome to the WebSocket Cursors Server!");
});

const cursors = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.emit("allCursors", Array.from(cursors.entries()));

  socket.on("cursorMove", (data) => {
    const x = Math.max(0, Math.min(1, data.x));
    const y = Math.max(0, Math.min(1, data.y));

    cursors.set(socket.id, { x, y });

    socket.broadcast.emit("cursorUpdate", {
      id: socket.id,
      x,
      y,
    });
    console.log("Cursor moved:", socket.id, { x, y });
  });
  socket.on("click", (data) => {
    console.log(
      `Click from user ${socket.id} at position (${data.x}, ${data.y})`
    );
    io.emit("userClicked", { userId: socket.id, x: data.x, y: data.y });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    io.emit("cursorRemove", socket.id);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
