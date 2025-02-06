const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./database');
const authRoutes = require('./routes/auth');
const Message = require('./models/Message'); // Importar el modelo Message
require('dotenv').config();

// Conectar a MongoDB
connectDB();

const app = express();

// Middleware CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para leer JSON
app.use(express.json());

// Usar rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas personalizadas
app.get('/', (req, res) => {
    res.redirect('/login'); // Redirige al login por defecto
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST']
    }
});

// Lista de usuarios conectados
let connectedUsers = {};

// Función para obtener la hora formateada (HH:MM)
const getFormattedTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Middleware de autenticación de sockets
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        console.error("Conexión rechazada: Token no proporcionado");
        return next(new Error("No autorizado"));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.username = decoded.username;
        next();
    } catch (err) {
        console.error("Conexión rechazada: Token inválido", err);
        return next(new Error("Token inválido"));
    }
});

// Gestión de conexiones de sockets
io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.username}`);

    // Guardar usuario en la lista
    connectedUsers[socket.username] = socket.id;

    // Emitir lista actualizada de usuarios
    io.emit('user list', Object.keys(connectedUsers));

    // Escuchar mensajes públicos
    socket.on('public message', (text) => {
        io.emit('message', {
            type: 'public',
            user: socket.username, // Incluir la propiedad "user"
            text,
            time: getFormattedTime() // Añadir hora del mensaje
        });
    });

    // Escuchar mensajes privados
    socket.on('private message', async ({ recipient, text }) => {
        const recipientSocketId = connectedUsers[recipient];
        if (recipientSocketId) {
            const time = getFormattedTime();
            const message = {
                type: 'private',
                sender: socket.username,
                recipient,
                text,
                time
            };

            // Guardar el mensaje privado en la base de datos
            await Message.create(message);

            // Enviar mensaje al destinatario
            io.to(recipientSocketId).emit('message', message);

            // Notificar al remitente que el mensaje fue enviado
            socket.emit('message', message);

            console.log(`Mensaje privado de ${socket.username} para ${recipient}: ${text}`);
        }
    });

    // Cargar historial de mensajes privados
    socket.on('load private messages', async ({ recipient }) => {
        try {
            const messages = await Message.find({
                $or: [
                    { sender: socket.username, recipient },
                    { sender: recipient, recipient: socket.username }
                ]
            }).sort({ createdAt: 1 }); // Ordenar por fecha de creación

            // Emitir el historial al cliente
            socket.emit('private messages history', messages);
        } catch (error) {
            console.error("Error al cargar historial de mensajes privados:", error);
        }
    });

    // Manejo de desconexión
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.username}`);
        delete connectedUsers[socket.username];
        io.emit('user list', Object.keys(connectedUsers));
    });
});

// Puerto dinámico
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});