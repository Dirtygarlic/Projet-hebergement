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

// 2 : LA BARRE DE RECHERCHE CONTINENT, PAYS, VILLES --------------------------------------------
    // Fonction pour gérer la barre de recherche avec suggestions
async function autoComplete(query) {
    // Vérifie si la saisie est inférieure à 3 caractères
    if (query.length < 3) {
        document.getElementById('suggestions').innerHTML = '';
        return;
    }

    try {
        // Appel à l'API Flask pour récupérer les suggestions
        const response = await fetch(`http://localhost:5001/api/search?query=${query}`);
        const suggestions = await response.json();

        // Génère le HTML pour les suggestions
        let suggestionHTML = '';
        suggestions.forEach(suggestion => {
            const typeClass = suggestion.type; // Récupère le type (continent, country, city)
            suggestionHTML += `<li class="${typeClass}" onclick="selectSuggestion('${suggestion.name}', '${typeClass}')">${suggestion.name}</li>`;
        });

        // Met à jour le menu déroulant avec les suggestions
        document.getElementById('suggestions').innerHTML = suggestionHTML;
    } catch (error) {
        console.error("Erreur lors de la récupération des suggestions :", error);
    }
}

    // Fonction pour gérer la sélection d'une suggestion
function selectSuggestion(name, type) {
    const inputField = document.getElementById('city');
    inputField.value = name; // Met à jour le champ de recherche avec la suggestion choisie
    document.getElementById('suggestions').innerHTML = ''; // Vide le menu déroulant après sélection

    // Affiche un message de debug facultatif
    console.log(`Vous avez sélectionné : ${name} (${type})`);
}

    // Gestionnaire d'événement pour fermer les suggestions lorsqu'on clique en dehors
document.addEventListener('click', (event) => {
    const suggestionsBox = document.getElementById('suggestions');
    const inputField = document.getElementById('city');
    
    if (!suggestionsBox.contains(event.target) && event.target !== inputField) {
        suggestionsBox.innerHTML = ''; // Vide les suggestions
    }
});

// 3 : Le calendrier de reservation------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    // Initialisation de flatpickr pour le champ de date
    flatpickr("#date-range", {
        mode: "range", // Permet de sélectionner une plage de dates
        dateFormat: "d-m-Y", // Format des dates (jour-mois-année)
        minDate: "today", // Ne pas pouvoir sélectionner de dates passées
        locale: "fr", // Langue française pour les mois et jours
        disableMobile: true, // Désactive la version mobile pour un meilleur affichage sur desktop
    });

    // Ajout de l'écouteur d'événement pour l'envoi du formulaire
    document.getElementById("search-form").addEventListener("submit", async function (e) {
        e.preventDefault();  // Empêcher l'envoi du formulaire classique
        
        // Validation de la plage de dates avant envoi
        const dateRangeInput = document.getElementById("date-range");
        if (!dateRangeInput.value) {
            alert("Veuillez sélectionner une plage de dates.");
            return;
        }

        const selectedDates = dateRangeInput.value; // Récupérer la plage de dates sélectionnée
        console.log("Plage de dates sélectionnée:", selectedDates);

        try {
            // Envoi des données au serveur Flask (date_range et autres éventuelles données)
            const response = await fetch(`http://localhost:5002/recherche`, {
                method: 'POST',
                body: new FormData(document.getElementById('search-form'))  // Envoi des données du formulaire
            });

            const result = await response.json();  // On attend la réponse JSON du serveur
            if (result.status === 'success') {
                alert(result.message);  // Affichage du message de succès
            } else {
                alert(result.message);  // Affichage du message d'erreur
            }
        } catch (error) {
            console.error("Erreur lors de l'appel à l'API:", error);
        }
    });
});


// 4 : LE CHOIX DES VOYAGEURS------------------------------------------------------------

// Récupérer les éléments
const openFormBtn = document.getElementById("openFormBtn");
const modal = document.getElementById("personnesForm");
const closeBtn = document.getElementsByClassName("closeBtn")[0];
const submitBtn = document.getElementById("submitBtn");

// Ouvrir le formulaire modal
openFormBtn.onclick = function() {
  modal.style.display = "block";
}

// Fermer le formulaire modal
closeBtn.onclick = function() {
  modal.style.display = "none";
}

// Fermer le formulaire modal si on clique en dehors de la modal
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// Action au clic sur le bouton "Valider"
submitBtn.onclick = function() {
  const personnes = document.getElementById("personnes").value;
  const enfants = document.getElementById("enfants").value;
  const animaux = document.getElementById("animaux").checked;

  alert(`Personnes : ${personnes}\nEnfants : ${enfants}\nAnimaux de compagnie : ${animaux ? "Oui" : "Non"}`);
  
  // Fermer la modal après validation
  modal.style.display = "none";
}






// script.js

// Fonction pour changer la langue
function toggleDropdown() {
    document.getElementById("languageDropdown").classList.toggle("show");
}
function changeLanguage(language) {
    // Sélectionner tous les éléments avec un attribut data-en ou data-fr
    const elements = document.querySelectorAll('[data-en], [data-fr], [data-es]');

    // Parcourir chaque élément et mettre à jour son contenu
    elements.forEach(element => {
        if (language === 'fr') {
            element.textContent = element.getAttribute('data-fr') || element.textContent;
        } else if (language === 'en') {
            element.textContent = element.getAttribute('data-en') || element.textContent;
        }
    });
}

/* Changer la langue (simplement un exemple pour changer l'URL ou le contenu)
function changeLanguage(lang) {
    if (lang === 'fr') {
        window.location.href = "/fr";
    } else if (lang === 'en') {
        window.location.href = "/en";
    } else if (lang === 'es') {
        window.location.href = "/es";
    } else if (lang === 'zh') {
        window.location.href = "/zh";
    } else if (lang === 'hi') {
        window.location.href = "/hi";
    } else if (lang === 'ar') {
        window.location.href = "/ar";
    } else if (lang === 'bn') {
        window.location.href = "/bn";
    } else if (lang === 'ru') {
        window.location.href = "/ru";
    } else if (lang === 'pt') {
        window.location.href = "/pt";
    } else if (lang === 'ur') {
        window.location.href = "/ur";
    }
}
*/

// Fermer le menu déroulant si on clique en dehors
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
