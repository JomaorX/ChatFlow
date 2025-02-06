// database.js
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conexión exitosa a MongoDB');
    } catch (err) {
        console.error('Error al conectar a MongoDB:', err);
        process.exit(1); // Salir del proceso en caso de error
    }
};

module.exports = connectDB;
