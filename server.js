const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const moment = require('moment-timezone'); // Import moment-timezone

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

app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
require('dotenv').config();
console.log(process.env.MONGO_URI);

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

    // Fetch chat history with comment counts
    socket.on('getHistory', async () => {
        try {
            const chatHistory = await Chat.find().sort({ timestamp: 1 });

            // Fetch comment counts for each chat
            const chatHistoryWithComments = await Promise.all(chatHistory.map(async (chat) => {
                const commentCount = await Comment.countDocuments({ chatId: chat._id.toString() });
                return {
                    ...chat.toObject(),
                    timestamp: moment(chat.timestamp).tz("Asia/Kolkata").format(),
                    commentCount  // Include comment count
                };
            }));

            socket.emit('chatHistory', chatHistoryWithComments);
        } catch (err) {
            console.error('Error retrieving chat history:', err);
        }
    });

    // Handle incoming messages
    socket.on('message', async (msgData) => {
        const { to, senderId, message } = msgData;
        try {
            const chatMessage = new Chat({
                to,
                senderId,
                message,
                timestamp: moment().tz("Asia/Kolkata").toDate()
            });
            await chatMessage.save();

            const messageIST = {
                ...chatMessage.toObject(),
                timestamp: moment(chatMessage.timestamp).tz("Asia/Kolkata").format()
            };
            io.emit('message', messageIST);
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    // Handle comments on messages
    socket.on('comment', async (commentData) => {
        const { chatId, commenterId, comment } = commentData;
        try {
            const newComment = new Comment({
                chatId,
                commenterId,
                comment,
                timestamp: moment().tz("Asia/Kolkata").toDate()
            });
            await newComment.save();

            const commentIST = {
                ...newComment.toObject(),
                timestamp: moment(newComment.timestamp).tz("Asia/Kolkata").format()
            };
            io.emit('comment', commentIST);
        } catch (err) {
            console.error('Error saving comment:', err);
        }
    });

    // Fetch comment history for a specific chatId
    socket.on('getHistoryComment', async (chatId) => {
        try {
            const commentHistory = await Comment.find({ chatId }).sort({ timestamp: 1 });
            const commentHistoryIST = commentHistory.map(comment => ({
                ...comment.toObject(),
                timestamp: moment(comment.timestamp).tz("Asia/Kolkata").format()
            }));
            socket.emit('commentHistory', commentHistoryIST);
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