const mongoose = require('mongoose');
const moment = require('moment-timezone');

const commentSchema = new mongoose.Schema({
    chatId: String,
    commenterId: String,
    comment: String,
    timestamp: {
        type: Date,
        default: () => moment().tz("Asia/Kolkata").toDate()  // Set timestamp in IST
    }
});

module.exports = mongoose.model('Comment', commentSchema);