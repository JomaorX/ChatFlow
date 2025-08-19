document.addEventListener("DOMContentLoaded", () => {
    const usernameSpan = document.getElementById("username");
    const usersList = document.getElementById("users-list");
    const messagesContainer = document.getElementById("messages");
    const messageForm = document.getElementById("message-form");
    const messageInput = document.getElementById("message-input");
    const chatTitle = document.getElementById("chat-title");
    const toggleSidebarBtn = document.getElementById("toggle-sidebar"); // Nuevo botón
    const sidebar = document.getElementById("sidebar"); // Nuevo elemento del sidebar

    // Leer el token de localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Token no encontrado. Redirigiendo al login...");
        window.location.href = "/login";
        return;
    }

    // Conectar a Socket.IO con el token
    const socket = io('/', { auth: { token } });

    // Mostrar nombre del usuario
    const user = JSON.parse(atob(token.split(".")[1]));
    usernameSpan.textContent = user.username;

    let selectedUser = null; // Usuario seleccionado para chat privado
    const conversations = {};

    // Función para renderizar los mensajes de una conversación
    const renderMessages = (conversationKey) => {
        messagesContainer.innerHTML = '';
        conversations[conversationKey]?.forEach(msg => addMessage(msg));
        // Desplazar al final de los mensajes después de renderizar
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // Función para agregar un mensaje al contenedor
    const addMessage = (data) => {
        const p = document.createElement('p');
        let messageText;

        if (data.type === 'private') {
            if (data.sender === user.username) {
                messageText = `${data.text}`;
                p.className = 'message-sent';
            } else {
                messageText = `${data.text}`;
                p.className = 'message-received';
            }
        } else if (data.type === 'public') {
            if (data.user === user.username) {
                messageText = `${data.text}`;
                p.className = 'message-sent';
            } else {
                messageText = `${data.user}: ${data.text}`;
                p.className = 'message-received';
            }
        }

        const timeSpan = document.createElement('span');
        timeSpan.className = 'time';
        timeSpan.textContent = `${data.time}`;

        p.textContent = messageText;
        p.appendChild(timeSpan);
        messagesContainer.prepend(p);
    };

    // Escuchar lista de usuarios
    socket.on('user list', (users) => {
        const filteredUsers = ["Chat Global"].concat(users.filter(u => u !== user.username));
        usersList.innerHTML = filteredUsers.map(user => `<li>${user}</li>`).join('');
    });

    // Escuchar mensajes
    socket.on('message', (data) => {
        let conversationKey;
        if (data.type === 'private') {
            conversationKey = `${data.sender}-${data.recipient}`;
        } else {
            conversationKey = "Chat Global";
        }

        if (!conversations[conversationKey]) {
            conversations[conversationKey] = [];
        }

        conversations[conversationKey].push(data);

        if (
            (conversationKey === "Chat Global" && !selectedUser) ||
            (conversationKey.includes(selectedUser) || conversationKey.includes(user.username))
        ) {
            addMessage(data);
        }

        // Si la conversación actual es la activa, desplaza hacia abajo
        if (messagesContainer.scrollHeight - messagesContainer.scrollTop < 1000) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    });

    // Cargar historial de mensajes privados
    socket.on('private messages history', (messages) => {
        const conversationKey = `${user.username}-${selectedUser}`;
        conversations[conversationKey] = messages;
        renderMessages(conversationKey);
    });

    // Enviar mensaje público o privado
    messageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message) {
            alert("El mensaje no puede estar vacío.");
            return;
        }

        if (selectedUser && selectedUser !== "Chat Global") {
            socket.emit('private message', { recipient: selectedUser, text: message });
        } else {
            socket.emit('public message', message);
        }
        messageInput.value = '';
    });

    // Seleccionar usuario para chat privado
    usersList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const clickedUser = e.target.textContent;

            if (clickedUser === "Chat Global") {
                selectedUser = null;
                chatTitle.textContent = "🚀Chat Global🌍";
                const conversationKey = "Chat Global";
                renderMessages(conversationKey);
            } else {
                selectedUser = clickedUser;
                chatTitle.textContent = `🗣️${selectedUser}`;

                const conversationKey = `${user.username}-${selectedUser}`;
                if (!conversations[conversationKey]) {
                    conversations[conversationKey] = [];
                    socket.emit('load private messages', { recipient: selectedUser });
                } else {
                    renderMessages(conversationKey);
                }
            }
            // Oculta el sidebar después de seleccionar un chat
            sidebar.classList.remove('active');
        }
    });

    // Funcionalidad para el botón de alternar el sidebar
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });


    // Cierra el sidebar al hacer clic fuera de él
    document.addEventListener('click', (e) => {
        // Comprueba si el clic fue fuera del sidebar y no en el botón de alternar
        if (!sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target)) {
            // Asegúrate de que el sidebar esté activo antes de intentar cerrarlo
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Cerrar sesión
    window.logout = () => {
        localStorage.removeItem('token');
        alert("Sesión cerrada");
        window.location.href = "/login";
    };
});