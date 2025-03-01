// 1 : LA FENETRE MODALE------------------------------------------------------------

// Validation du numéro de téléphone
document.getElementById("register-phone").addEventListener("input", function () {
    const phoneInput = this;
    const phoneError = document.getElementById("phone-error");
    const regex = /^\d*$/; // Autorise uniquement les chiffres

    if (!regex.test(phoneInput.value)) {
        phoneError.style.display = "block";
    } else {
        phoneError.style.display = "none";
    }
});

// Fonction pour afficher/masquer les mots de passe
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    field.type = field.type === "password" ? "text" : "password";
}

// Fonction pour afficher/masquer la modale de connexion
function toggleLoginForm() {
    const form = document.getElementById("loginForm");
    const overlay = document.getElementById("overlay");

    if (form.style.display === "block") {
        form.style.display = "none";
        overlay.style.display = "none";
    } else {
        form.style.display = "block";
        overlay.style.display = "block";

        // Réinitialiser les champs de connexion
        resetLoginFields();

        // Par défaut, afficher les champs de connexion (au lieu de création de compte)
        switchToLogin();
    }
}

// Fonction pour réinitialiser les champs de connexion
function resetLoginFields() {
    document.getElementById("login-email").value = "";
    document.getElementById("login-password").value = "";

    // Remet le focus sur le champ email
    document.getElementById("login-email").focus();
}

// Fonction pour passer à la création de compte
function switchToCreateAccount() {
    document.getElementById("form-title").textContent = "Créer un compte";
    document.getElementById("loginFields").style.display = "none";
    document.getElementById("registerFields").style.display = "block";

    // Réinitialiser les champs du formulaire d'inscription
    document.getElementById("register-name").value = "";
    document.getElementById("register-firstname").value = "";
    document.getElementById("register-phone").value = "";
    document.getElementById("register-email").value = "";
    document.getElementById("register-password").value = "";
    document.getElementById("confirm-password").value = "";

     // Réinitialiser les messages d'erreur éventuels
     document.getElementById("phone-error").style.display = "none";
}

// Fonction pour revenir à l'écran de connexion
function switchToLogin() {
    document.getElementById("form-title").textContent = "Se connecter / S'inscrire";
    document.getElementById("loginFields").style.display = "block";
    document.getElementById("registerFields").style.display = "none";
}

// Fonction pour soumettre les données du formulaire d'inscription
async function submitRegister(event) {
    event.preventDefault(); // Empêche la soumission par défaut du formulaire

    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const phoneError = document.getElementById("phone-error");

    if (password !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas !");
        return;
    }

    // Valider que le champ téléphone ne contient que des chiffres
    const phoneInput = document.getElementById("register-phone").value;
    if (!/^\d+$/.test(phoneInput)) {
        phoneError.style.display = "block";
        return;
    }

     // Récupérer les données d'inscription
    const formData = {
        name: document.getElementById('register-name').value,
        firstname: document.getElementById('register-firstname').value,
        email: document.getElementById('register-email').value,
        password: password,
        phone: document.getElementById('register-phone-indicative').value + phoneInput,
    };

    // Vérification simple pour s'assurer que tous les champs sont remplis
    if (!formData.name || !formData.firstname || !formData.email || !formData.password) {
        alert("Tous les champs sont obligatoires !");
        return; // Empêche l'envoi si un champ est vide
    }

    // Envoi des données au serveur via Fetch
    try {
        const response = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            const userData = await response.json();
            alert('Inscription réussie ! Un e-mail de bienvenue a été envoyé à ' + formData.email)
            if (userData.first_name && userData.name) {
                showUserInfo(userData.first_name, userData.name);
            } else {
                alert("Erreur lors de l'inscription, nom non trouvé.");
            }
        } else {
            const error = await response.json();
            alert('Erreur : ' + error.message);
        }
    } catch (error) {
        console.error("Erreur lors de l’inscription :", error);
        alert('Une erreur est survenue.');
    }
}

// Fonction pour soumettre le formulaire de connexion
async function submitLogin(event) {
    event.preventDefault(); // Empêche la soumission du formulaire par défaut

    const formData = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
    };

    if (!formData.email || !formData.password) {
        alert("Email et mot de passe sont obligatoires !");
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData),
        });

        console.log('Réponse du serveur :', response);

        if (response.ok) {
            const userData = await response.json();
            alert('Connexion réussie !');
            if (userData.first_name && userData.name) {
                // Appelle la fonction pour afficher le prénom et le nom
                showUserInfo(userData.first_name, userData.name);
            } else {
                    alert("Erreur : Informations utilisateur incomplètes.");
            }
        } else {
            const error = await response.json();
            alert('Erreur : ' + error.message);
        }
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        alert('Une erreur est survenue.');
    }
}

// Affiche le nom de l'utilisateur après inscription/connexion
function showUserInfo(firstName, name) {
    if (!firstName || !name) {
        console.error("Données utilisateur manquantes :", { firstName, name });
        return;
    }

    const loginButton = document.getElementById('loginButton');
    loginButton.textContent = `Bonjour ${firstName} ${name}`;
    loginButton.onclick = null; // Désactiver le bouton
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';

       // Ajouter un bouton de déconnexion
       const logoutButton = document.createElement('button');
       logoutButton.textContent = "Déconnexion";
       logoutButton.onclick = logoutUser;
       loginButton.parentNode.appendChild(logoutButton);
   }

   // Fonction de déconnexion
function logoutUser() {
    document.getElementById('loginButton').textContent = "Se connecter / S'inscrire";
    document.getElementById('loginButton').onclick = toggleLoginForm;
    this.remove(); // Supprime le bouton de déconnexion
}
        
// Ajout de l'écouteur d'événement pour soumettre le formulaire d'inscription ou se connecter
document.querySelector('#userForm').addEventListener('submit', submitRegister);
document.querySelector('#loginForm').addEventListener('submit', submitLogin);

// Fonction pour rediriger vers la page de réinitialisation du mot de passe
function resetPassword() {
    alert("Redirection vers la page de réinitialisation de mot de passe.");
    // Exemple de redirection :
    window.location.href = "reset-password.html";
}

// Fonction de simulation de la connexion
document.querySelector("form").addEventListener("submit", function(event) {
    event.preventDefault(); // Empêche le rechargement de la page

    const loginButton = document.getElementById("search-button1");

    /*
    // Simule une vérification de connexion réussie
    const isLoginSuccessful = true; // Remplacez par la logique de connexion réelle

    if (isLoginSuccessful) {
        loginButton.textContent = "Connecté";
        loginButton.disabled = true;
        loginButton.style.backgroundColor = "green";
    } else {
        loginButton.textContent = "Erreur de connexion";
        loginButton.style.backgroundColor = "red";
    }
*/
});

