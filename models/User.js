// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { 
        type: String, 
        required: true, 
        validate: {
            validator: function (value) {
                return /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(value);
            },
            message: 'La contraseña debe tener al menos una mayúscula, un número y 6 caracteres.'
        }
    },
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
