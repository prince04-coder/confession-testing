const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();  // Load environment variables

const Chat = require('./models/Chat');
const Comment = require('./models/Comment');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: "*",  // Allow any origin for simplicity
      methods: ["GET", "POST"]
    }
  });

// Middleware setup
app.use(cors());  // Use CORS middleware correctly
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('MongoDB connection successful');
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Socket.IO logic
io.on('connection', (socket) => {
    console.log('A user connected');

    // Fetch chat history when a user connects
    socket.on('getHistory', async () => {
        try {
            const chatHistory = await Chat.find().sort({ timestamp: 1 });
            socket.emit('chatHistory', chatHistory);
        } catch (err) {
            console.error('Error retrieving chat history:', err);
        }
    });

    // Handle incoming messages
    socket.on('message', async (msgData) => {
        const { senderId, message } = msgData;

        try {
            const chatMessage = new Chat({ senderId, message });
            await chatMessage.save();

            io.emit('message', chatMessage);
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    // Handle comments on messages
    socket.on('comment', async (commentData) => {
        const { chatId, commenterId, comment } = commentData;

        try {
            const newComment = new Comment({ chatId, commenterId, comment });
            await newComment.save();

            io.emit('comment', { chatId, commenterId, comment });
        } catch (err) {
            console.error('Error saving comment:', err);
        }
    });

    // Fetch comment history for a specific chatId
    socket.on('getHistoryComment', async (chatId) => {
        try {
            const commentHistory = await Comment.find({ chatId }).sort({ timestamp: 1 });
            socket.emit('commentHistory', commentHistory);
        } catch (err) {
            console.error('Error retrieving comment history:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});