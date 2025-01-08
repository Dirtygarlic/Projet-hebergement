// Affiche le menu déroulant au clic
document.querySelector('.dropbtn').addEventListener('click', function () {
    document.getElementById("dropdownMenu").classList.toggle("show");
});

// Change la langue sélectionnée
function changeLanguage(language) {
    document.querySelector('.dropbtn').textContent = `Langue : ${language} | Devise : ${getCurrentCurrency()}`;
}

// Change la devise sélectionnée
function changeCurrency(currency) {
    document.querySelector('.dropbtn').textContent = `Langue : ${getCurrentLanguage()} | Devise : ${currency}`;
}

// Récupère la langue actuelle
function getCurrentLanguage() {
    return document.querySelector('.dropbtn').textContent.split(' | ')[0].split(' : ')[1];
}

// Récupère la devise actuelle
function getCurrentCurrency() {
    return document.querySelector('.dropbtn').textContent.split(' | ')[1].split(' : ')[1];
}

// Ferme le menu déroulant si on clique ailleurs
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
