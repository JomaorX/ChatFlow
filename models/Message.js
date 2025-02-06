const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'private'
    sender: { type: String, required: true }, // Usuario que envió el mensaje
    recipient: { type: String, required: true }, // Usuario destinatario
    text: { type: String, required: true }, // Contenido del mensaje
    time: { type: String, required: true } // Hora del mensaje (HH:MM)
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);