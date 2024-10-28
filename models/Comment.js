const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    chatId: String,
    commenterId: String,
    comment: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);