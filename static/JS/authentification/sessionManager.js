// ============================
// ♻️ Connexion persistante au rechargement
// ============================

// ✅ Connexion persistante au rechargement
function checkLoginOnLoad() {
    console.log("✅ checkLoginOnLoad() lancé");
    const userId = localStorage.getItem("user_id");
    const firstName = localStorage.getItem("first_name");
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const phone = localStorage.getItem("phone");

    if (firstName && name) {
        showUserInfo(firstName, name, email, phone, userId);
    }
}

// ✅ Affichage des infos utilisateur après connexion
function showUserInfo(firstName, name, email, phone, userId = null) {
    if (userId) localStorage.setItem("user_id", userId);
    localStorage.setItem("first_name", firstName);
    localStorage.setItem("name", name);
    localStorage.setItem("email", email);
    localStorage.setItem("phone", phone);

    // Masquer bouton login
    const loginBtn = document.getElementById("loginButton");
    if (loginBtn) loginBtn.style.display = "none";

    // Afficher le menu utilisateur
    const userMenu = document.getElementById("user-menu-container");
    const fullNameElement = document.getElementById("user-fullname");
    if (userMenu && fullNameElement) {
        fullNameElement.textContent = `${firstName} ${name}`;
        userMenu.style.display = "inline-block";
    }

    // ✅ Avatar personnalisé
    const avatarPath = "/static/Image/avatars/remy.png"; // 🔁 pourra devenir dynamique plus tard
    const menuButton = document.getElementById("user-menu-button");
    if (menuButton) {
        menuButton.innerHTML = `
            <img src="${avatarPath}" alt="Avatar" class="avatar-icon" />
            ${firstName} ▼
        `;
    }

    // Bascule du dropdown
    const dropdown = document.getElementById("user-dropdown");
    if (menuButton && dropdown) {
        menuButton.onclick = () => {
            dropdown.classList.toggle("hidden");
        };
    }

    // Déconnexion
    const logoutLink = document.getElementById("logout-link");
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();
            logoutUser(); // ta fonction existante
        });
    }

    // 🧠 Ferme le menu utilisateur si clic en dehors
    document.addEventListener("click", function (event) {
        const isClickInsideMenu = userMenu.contains(event.target);
        const isClickOnButton = menuButton.contains(event.target);

        if (!isClickInsideMenu && !isClickOnButton) {
            dropdown.classList.add("hidden");
        }
    });
}

// ✅ Déconnexion de l'utilisateur
function logoutUser() {
    localStorage.clear();

    // Réaffiche le bouton login
    const loginBtn = document.getElementById("loginButton");
    if (loginBtn) loginBtn.style.display = "inline-block";

    // Cache le menu utilisateur
    const userMenu = document.getElementById("user-menu-container");
    if (userMenu) userMenu.style.display = "none";

    // 🔐 Vide les champs de login
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    if (loginEmail) loginEmail.value = "";
    if (loginPassword) loginPassword.value = "";
}


export { checkLoginOnLoad, showUserInfo, logoutUser };