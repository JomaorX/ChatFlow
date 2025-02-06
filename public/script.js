document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            const response = await fetch('/api/auth/login', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                // Guardar el token en localStorage
                localStorage.setItem('token', data.token);
                alert("Inicio de sesión exitoso");
                window.location.href = "/chat";
            } else {
                alert(data.message);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            const response = await fetch('/api/auth/register', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                // Guardar el token en localStorage
                localStorage.setItem('token', data.token);
                alert("Inicio de sesión exitoso");
                window.location.href = "/chat";
            } else {
                alert(data.message);
            }
        });
    }

    // Función para cerrar sesión
    function logout() {
        // Eliminar el token de localStorage
        localStorage.removeItem('token');
        alert("Sesión cerrada");
        window.location.href = "/login";
    }
});