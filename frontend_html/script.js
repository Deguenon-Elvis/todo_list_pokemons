// Configuration
const BASE_URL = 'http://localhost:8000';

// Éléments DOM
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const notification = document.getElementById('notification');

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = link.getAttribute('data-page');
        
        // Mettre à jour les classes actives
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`${targetPage}-page`).classList.add('active');
        
        // Charger les données si nécessaire
        if (targetPage === 'list') {
            loadAllPokemons();
        } else if (targetPage === 'search') {
            loadTypes();
        }
    });
});

// Afficher une notification
function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.classList.remove('hidden', 'error');
    if (isError) notification.classList.add('error');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Charger tous les Pokémons
async function loadAllPokemons() {
    const response = await fetch(`${BASE_URL}/pokemons`);
    const pokemons = await response.json();
    const tableBody = document.getElementById('pokemon-list-body');
    tableBody.innerHTML = '';
    pokemons.forEach(pokemon => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pokemon.id}</td>
            <td>${pokemon.name}</td>
            <td>${pokemon.types.join(', ')}</td>
            <td>${pokemon.total}</td>
            <td>${pokemon.hp}</td>
            <td>${pokemon.attack}</td>
            <td>${pokemon.defense}</td>
        `;
        tableBody.appendChild(row);
    });
    document.getElementById('total-count').textContent = `Total : ${pokemons.length}`;
}

// Charger les types de Pokémon
async function loadTypes() {
    try {
        const response = await fetch(`${BASE_URL}/types`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des types');
        
        const types = await response.json();
        const typesSelect = document.getElementById('types');
        typesSelect.innerHTML = '';
        
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typesSelect.appendChild(option);
        });
    } catch (error) {
        showNotification(error.message, true);
    }
}

// Recherche de Pokémons
document.getElementById('search-btn').addEventListener('click', async () => {
    try {
        // Récupérer les valeurs du formulaire
        const selectedTypes = Array.from(document.getElementById('types').selectedOptions).map(opt => opt.value);
        const evoOption = document.querySelector('input[name="evo"]:checked').value;
        const minTotal = document.getElementById('min-total').value;
        const maxTotal = document.getElementById('max-total').value;
        const sortBy = document.getElementById('sort-by').value;
        const sortOrder = document.querySelector('input[name="order"]:checked').value;
        
        // Construire les paramètres
        const params = new URLSearchParams();
        if (selectedTypes.length > 0) params.append('types', selectedTypes.join(','));
        if (evoOption !== 'all') params.append('evo', evoOption);
        if (minTotal > 0) params.append('totalgt', minTotal);
        if (maxTotal < 1000) params.append('totallt', maxTotal);
        params.append('sortby', sortBy);
        params.append('order', sortOrder);
        
        // Faire la requête
        const response = await fetch(`${BASE_URL}/pokemons/search/?${params.toString()}`);
        if (!response.ok) throw new Error('Erreur lors de la recherche');
        
        const results = await response.json();
        const resultsDiv = document.getElementById('search-results');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p>Aucun Pokémon ne correspond à ces critères</p>';
            return;
        }
        
        resultsDiv.innerHTML = `
            <h3>${results.length} Pokémons trouvés</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Types</th>
                        <th>Total</th>
                        <th>HP</th>
                        <th>Attaque</th>
                        <th>Défense</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(pokemon => `
                        <tr>
                            <td>${pokemon.id}</td>
                            <td>${pokemon.name}</td>
                            <td>${pokemon.types.join(', ')}</td>
                            <td>${pokemon.total}</td>
                            <td>${pokemon.hp}</td>
                            <td>${pokemon.attack}</td>
                            <td>${pokemon.defense}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        showNotification(error.message, true);
    }
});

// Afficher les détails d'un Pokémon
document.getElementById('show-details-btn').addEventListener('click', async () => {
    try {
        const pokemonId = document.getElementById('pokemon-id').value;
        const response = await fetch(`${BASE_URL}/pokemon/${pokemonId}`);
        
        if (!response.ok) throw new Error('Pokémon non trouvé');
        
        const pokemon = await response.json();
        const detailsDiv = document.getElementById('pokemon-details');
        detailsDiv.classList.remove('hidden');
        
        // Calculer le maximum pour les barres de statistiques
        const maxStat = Math.max(
            pokemon.hp, 
            pokemon.attack, 
            pokemon.defense, 
            pokemon.attack_special, 
            pokemon.defense_special, 
            pokemon.speed
        );
        
        detailsDiv.innerHTML = `
            <div class="pokemon-info">
                <h3>#${pokemon.id} - ${pokemon.name}</h3>
                <p><strong>Types:</strong> ${pokemon.types.join(', ')}</p>
                <p><strong>Total:</strong> ${pokemon.total}</p>
                ${pokemon.evolution_id ? `<p><strong>Évolue vers:</strong> #${pokemon.evolution_id}</p>` : ''}
            </div>
            
            <div class="stats-container">
                <h4>Statistiques</h4>
                
                <div class="stat-label">
                    <span>HP</span>
                    <span>${pokemon.hp}</span>
                </div>
                <div class="stat-bar" style="width: ${(pokemon.hp / maxStat) * 100}%"></div>
                
                <div class="stat-label">
                    <span>Attaque</span>
                    <span>${pokemon.attack}</span>
                </div>
                <div class="stat-bar" style="width: ${(pokemon.attack / maxStat) * 100}%"></div>
                
                <div class="stat-label">
                    <span>Défense</span>
                    <span>${pokemon.defense}</span>
                </div>
                <div class="stat-bar" style="width: ${(pokemon.defense / maxStat) * 100}%"></div>
                
                <div class="stat-label">
                    <span>Attaque Spéciale</span>
                    <span>${pokemon.attack_special}</span>
                </div>
                <div class="stat-bar" style="width: ${(pokemon.attack_special / maxStat) * 100}%"></div>
                
                <div class="stat-label">
                    <span>Défense Spéciale</span>
                    <span>${pokemon.defense_special}</span>
                </div>
                <div class="stat-bar" style="width: ${(pokemon.defense_special / maxStat) * 100}%"></div>
                
                <div class="stat-label">
                    <span>Vitesse</span>
                    <span>${pokemon.speed}</span>
                </div>
                <div class="stat-bar" style="width: ${(pokemon.speed / maxStat) * 100}%"></div>
            </div>
        `;
    } catch (error) {
        showNotification(error.message, true);
    }
});

// Gestion des onglets
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
});

// Ajouter un Pokémon
document.getElementById('add-form').innerHTML = `
    <div class="form-row">
        <div class="form-group">
            <label for="add-id">ID:</label>
            <input type="number" id="add-id" min="1" required>
        </div>
        <div class="form-group">
            <label for="add-name">Nom:</label>
            <input type="text" id="add-name" required>
        </div>
        <div class="form-group">
            <label for="add-types">Types (séparés par des virgules):</label>
            <input type="text" id="add-types" required>
        </div>
    </div>
    <div class="form-row">
        <div class="form-group">
            <label for="add-hp">HP:</label>
            <input type="number" id="add-hp" min="0" required>
        </div>
        <div class="form-group">
            <label for="add-attack">Attaque:</label>
            <input type="number" id="add-attack" min="0" required>
        </div>
        <div class="form-group">
            <label for="add-defense">Défense:</label>
            <input type="number" id="add-defense" min="0" required>
        </div>
    </div>
    <div class="form-row">
        <div class="form-group">
            <label for="add-attack-special">Attaque Spéciale:</label>
            <input type="number" id="add-attack-special" min="0" required>
        </div>
        <div class="form-group">
            <label for="add-defense-special">Défense Spéciale:</label>
            <input type="number" id="add-defense-special" min="0" required>
        </div>
        <div class="form-group">
            <label for="add-speed">Vitesse:</label>
            <input type="number" id="add-speed" min="0" required>
        </div>
    </div>
    <div class="form-row">
        <div class="form-group">
            <label for="add-evolution-id">ID d'évolution (0 pour aucun):</label>
            <input type="number" id="add-evolution-id" min="0" value="0">
        </div>
    </div>
    <button type="button" id="add-pokemon-btn">Ajouter</button>
`;

document.getElementById('add-pokemon-btn').addEventListener('click', async () => {
    try {
        // Récupérer les valeurs du formulaire
        const id = document.getElementById('add-id').value;
        const name = document.getElementById('add-name').value;
        const types = document.getElementById('add-types').value.split(',').map(t => t.trim());
        const hp = parseInt(document.getElementById('add-hp').value);
        const attack = parseInt(document.getElementById('add-attack').value);
        const defense = parseInt(document.getElementById('add-defense').value);
        const attackSpecial = parseInt(document.getElementById('add-attack-special').value);
        const defenseSpecial = parseInt(document.getElementById('add-defense-special').value);
        const speed = parseInt(document.getElementById('add-speed').value);
        const evolutionId = parseInt(document.getElementById('add-evolution-id').value);
        
        // Calculer le total
        const total = hp + attack + defense + attackSpecial + defenseSpecial + speed;
        
        // Créer l'objet Pokémon
        const pokemon = {
            id: parseInt(id),
            name,
            types,
            total,
            hp,
            attack,
            defense,
            attack_special: attackSpecial,
            defense_special: defenseSpecial,
            speed,
            evolution_id: evolutionId > 0 ? evolutionId : null
        };
        
        // Envoyer la requête
        const response = await fetch(`${BASE_URL}/pokemon/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pokemon)
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'ajout du Pokémon');
        
        showNotification('Pokémon ajouté avec succès');
        document.getElementById('add-form').reset();
    } catch (error) {
        showNotification(error.message, true);
    }
});

// Charger un Pokémon pour modification
document.getElementById('load-pokemon-btn').addEventListener('click', async () => {
    try {
        const pokemonId = document.getElementById('edit-pokemon-id').value;
        const response = await fetch(`${BASE_URL}/pokemon/${pokemonId}`);
        
        if (!response.ok) throw new Error('Pokémon non trouvé');
        
        const pokemon = await response.json();
        const editForm = document.getElementById('edit-form');
        editForm.classList.remove('hidden');
        
        editForm.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-name">Nom:</label>
                    <input type="text" id="edit-name" value="${pokemon.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-types">Types (séparés par des virgules):</label>
                    <input type="text" id="edit-types" value="${pokemon.types.join(', ')}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-hp">HP:</label>
                    <input type="number" id="edit-hp" value="${pokemon.hp}" min="0" required>
                </div>
                <div class="form-group">
                    <label for="edit-attack">Attaque:</label>
                    <input type="number" id="edit-attack" value="${pokemon.attack}" min="0" required>
                </div>
                <div class="form-group">
                    <label for="edit-defense">Défense:</label>
                    <input type="number" id="edit-defense" value="${pokemon.defense}" min="0" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-attack-special">Attaque Spéciale:</label>
                    <input type="number" id="edit-attack-special" value="${pokemon.attack_special}" min="0" required>
                </div>
                <div class="form-group">
                    <label for="edit-defense-special">Défense Spéciale:</label>
                    <input type="number" id="edit-defense-special" value="${pokemon.defense_special}" min="0" required>
                </div>
                <div class="form-group">
                    <label for="edit-speed">Vitesse:</label>
                    <input type="number" id="edit-speed" value="${pokemon.speed}" min="0" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-evolution-id">ID d'évolution (0 pour aucun):</label>
                    <input type="number" id="edit-evolution-id" value="${pokemon.evolution_id || 0}" min="0">
                </div>
            </div>
            <button type="button" id="update-pokemon-btn">Mettre à jour</button>
        `;
        
        // Ajouter l'événement pour la mise à jour
        document.getElementById('update-pokemon-btn').addEventListener('click', async () => {
            try {
                // Récupérer les valeurs du formulaire
                const name = document.getElementById('edit-name').value;
                const types = document.getElementById('edit-types').value.split(',').map(t => t.trim());
                const hp = parseInt(document.getElementById('edit-hp').value);
                const attack = parseInt(document.getElementById('edit-attack').value);
                const defense = parseInt(document.getElementById('edit-defense').value);
                const attackSpecial = parseInt(document.getElementById('edit-attack-special').value);
                const defenseSpecial = parseInt(document.getElementById('edit-defense-special').value);
                const speed = parseInt(document.getElementById('edit-speed').value);
                const evolutionId = parseInt(document.getElementById('edit-evolution-id').value);
                
                // Calculer le total
                const total = hp + attack + defense + attackSpecial + defenseSpecial + speed;
                
                // Créer l'objet Pokémon
                const updatedPokemon = {
                    id: parseInt(pokemonId),
                    name,
                    types,
                    total,
                    hp,
                    attack,
                    defense,
                    attack_special: attackSpecial,
                    defense_special: defenseSpecial,
                    speed,
                    evolution_id: evolutionId > 0 ? evolutionId : null
                };
                
                // Envoyer la requête
                const response = await fetch(`${BASE_URL}/pokemon/${pokemonId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedPokemon)
                });
                
                if (!response.ok) throw new Error('Erreur lors de la mise à jour du Pokémon');
                
                showNotification('Pokémon mis à jour avec succès');
            } catch (error) {
                showNotification(error.message, true);
            }
        });
    } catch (error) {
        showNotification(error.message, true);
    }
});

// Supprimer un Pokémon
document.getElementById('delete-pokemon-btn').addEventListener('click', async () => {
    try {
        const pokemonId = document.getElementById('delete-pokemon-id').value;
        const confirmDelete = document.getElementById('confirm-delete').checked;
        
        if (!confirmDelete) {
            showNotification('Veuillez confirmer la suppression', true);
            return;
        }
        
        const response = await fetch(`${BASE_URL}/pokemon/${pokemonId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            showNotification(errorData.detail || 'Erreur lors de la suppression', true);
            return;
        }
        
        showNotification('Pokémon supprimé avec succès');
    } catch (error) {
        showNotification(error.message, true);
    }
});

// Charger tous les Pokémons au chargement de la page
window.addEventListener('DOMContentLoaded', loadAllPokemons);
