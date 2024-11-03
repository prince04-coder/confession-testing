const mongoose = require('mongoose');
const moment = require('moment-timezone');

const chatSchema = new mongoose.Schema({
    to: String,
    senderId: String,
    message: String,
    timestamp: {
        type: Date,
        default: () => moment().tz("Asia/Kolkata").toDate()  // Set timestamp in IST
    }
});

module.exports = mongoose.model('Chat', chatSchema);