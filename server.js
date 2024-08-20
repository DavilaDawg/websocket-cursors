import express from 'express';
import * as http from 'node:http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});
const cursors = new Map();

io.on('connection', socket => {
  console.log('A user connected:', socket.id);

  // Send all existing cursors to the new client
  socket.emit('allCursors', Array.from(cursors.entries()));

  socket.on('cursorMove', data => {
    // Ensure x and y are between 0 and 1
    const x = Math.max(0, Math.min(1, data.x));
    const y = Math.max(0, Math.min(1, data.y));

    cursors.set(socket.id, { x, y });
    // Broadcast to all clients except the sender
    socket.broadcast.emit('cursorUpdate', {
      id: socket.id,
      x,
      y
    });
    console.log('Cursor moved:', socket.id, { x, y });
  });
  socket.on('click', data => {
    console.log(
      `Click from user ${socket.id} at position (${data.x}, ${data.y})`
    );
    io.emit('userClicked', { userId: socket.id, x: data.x, y: data.y });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    io.emit('cursorRemove', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(4000, () => {
  console.log('Socket.IO server running on port 4000');
});
