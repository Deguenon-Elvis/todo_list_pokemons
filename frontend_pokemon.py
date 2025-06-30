import streamlit as st
import requests
import pandas as pd

st.set_page_config(page_title="Pokédex API", layout="wide")
st.title("Pokédex API")

# URL de base de l'API
BASE_URL = "http://localhost:8000"

# Sidebar pour la navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio("Choisir une page", ["Tous les Pokémons", "Recherche", "Détails", "Gestion"])

if page == "Tous les Pokémons":
    st.header("Liste des Pokémons")
    
    # Récupération des données
    response = requests.get(f"{BASE_URL}/pokemons")
    if response.status_code == 200:
        pokemons = response.json()
        
        # Conversion en DataFrame pour affichage
        df = pd.DataFrame(pokemons)
        st.dataframe(df[["id", "name", "types", "total", "hp", "attack", "defense"]])
        
        st.text(f"Total: {len(pokemons)} Pokémons")
    else:
        st.error("Erreur lors de la récupération des données")

elif page == "Recherche":
    st.header("Recherche de Pokémons")
    
    # Récupération des types
    types_response = requests.get(f"{BASE_URL}/types")
    if types_response.status_code == 200:
        all_types = types_response.json()
        
        # Formulaire de recherche
        col1, col2 = st.columns(2)
        
        with col1:
            selected_types = st.multiselect("Types", all_types)
            evo_option = st.radio("Évolution", ["Tous", "Avec évolution", "Sans évolution"], index=0)
            
        with col2:
            min_total = st.number_input("Total minimum", min_value=0, value=0)
            max_total = st.number_input("Total maximum", min_value=0, value=1000)
            sort_by = st.selectbox("Trier par", ["id", "name", "total"])
            sort_order = st.radio("Ordre", ["asc", "desc"])
        
        if st.button("Rechercher"):
            # Construction des paramètres
            params = {}
            if selected_types:
                params["types"] = ",".join(selected_types)
            if evo_option == "Avec évolution":
                params["evo"] = "true"
            elif evo_option == "Sans évolution":
                params["evo"] = "false"
            if min_total > 0:
                params["totalgt"] = min_total
            if max_total < 1000:
                params["totallt"] = max_total
            params["sortby"] = sort_by
            params["order"] = sort_order
            
            # Requête API
            search_response = requests.get(f"{BASE_URL}/pokemons/search/", params=params)
            if search_response.status_code == 200:
                results = search_response.json()
                if results:
                    st.success(f"{len(results)} Pokémons trouvés")
                    df = pd.DataFrame(results)
                    st.dataframe(df[["id", "name", "types", "total", "hp", "attack", "defense"]])
                else:
                    st.info("Aucun Pokémon ne correspond à ces critères")
            else:
                st.error("Erreur lors de la recherche")
    else:
        st.error("Impossible de récupérer les types de Pokémon")

elif page == "Détails":
    st.header("Détails d'un Pokémon")
    
    pokemon_id = st.number_input("ID du Pokémon", min_value=1, step=1)
    
    if st.button("Afficher"):
        response = requests.get(f"{BASE_URL}/pokemon/{pokemon_id}")
        if response.status_code == 200:
            pokemon = response.json()
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader(f"#{pokemon['id']} - {pokemon['name']}")
                st.write(f"Types: {', '.join(pokemon['types'])}")
                st.write(f"Total: {pokemon['total']}")
                
                if pokemon.get('evolution_id'):
                    st.write(f"Évolue vers: #{pokemon['evolution_id']}")
            
            with col2:
                # Affichage des stats
                stats = {
                    "HP": pokemon["hp"],
                    "Attaque": pokemon["attack"],
                    "Défense": pokemon["defense"],
                    "Attaque Spéciale": pokemon["attack_special"],
                    "Défense Spéciale": pokemon["defense_special"],
                    "Vitesse": pokemon["speed"]
                }
                
                st.bar_chart(stats)
        else:
            st.error("Pokémon non trouvé")

elif page == "Gestion":
    st.header("Gestion des Pokémons")
    
    action = st.radio("Action", ["Ajouter", "Modifier", "Supprimer"])
    
    if action == "Ajouter":
        st.subheader("Ajouter un Pokémon")
        
        # Formulaire d'ajout
        with st.form("add_form"):
            id = st.number_input("ID", min_value=1)
            name = st.text_input("Nom")
            types = st.text_input("Types (séparés par des virgules)")
            total = st.number_input("Total", min_value=0)
            hp = st.number_input("HP", min_value=0)
            attack = st.number_input("Attaque", min_value=0)
            defense = st.number_input("Défense", min_value=0)
            attack_special = st.number_input("Attaque Spéciale", min_value=0)
            defense_special = st.number_input("Défense Spéciale", min_value=0)
            speed = st.number_input("Vitesse", min_value=0)
            evolution_id = st.number_input("ID d'évolution (0 pour aucun)", min_value=0)
            
            submit = st.form_submit_button("Ajouter")
            
            if submit:
                pokemon_data = {
                    "id": id,
                    "name": name,
                    "types": [t.strip() for t in types.split(",")],
                    "total": total,
                    "hp": hp,
                    "attack": attack,
                    "defense": defense,
                    "attack_special": attack_special,
                    "defense_special": defense_special,
                    "speed": speed,
                    "evolution_id": evolution_id if evolution_id > 0 else None
                }
                
                response = requests.post(f"{BASE_URL}/pokemon/", json=pokemon_data)
                if response.status_code == 200:
                    st.success("Pokémon ajouté avec succès")
                else:
                    st.error("Erreur lors de l'ajout du Pokémon")
    
    elif action == "Modifier":
        st.subheader("Modifier un Pokémon")
        
        pokemon_id = st.number_input("ID du Pokémon à modifier", min_value=1)
        
        if st.button("Charger"):
            response = requests.get(f"{BASE_URL}/pokemon/{pokemon_id}")
            if response.status_code == 200:
                pokemon = response.json()
                
                with st.form("edit_form"):
                    name = st.text_input("Nom", value=pokemon["name"])
                    types = st.text_input("Types", value=",".join(pokemon["types"]))
                    total = st.number_input("Total", value=pokemon["total"])
                    hp = st.number_input("HP", value=pokemon["hp"])
                    attack = st.number_input("Attaque", value=pokemon["attack"])
                    defense = st.number_input("Défense", value=pokemon["defense"])
                    attack_special = st.number_input("Attaque Spéciale", value=pokemon["attack_special"])
                    defense_special = st.number_input("Défense Spéciale", value=pokemon["defense_special"])
                    speed = st.number_input("Vitesse", value=pokemon["speed"])
                    evolution_id = st.number_input("ID d'évolution", value=pokemon.get("evolution_id", 0))
                    
                    submit = st.form_submit_button("Mettre à jour")
                    
                    if submit:
                        pokemon_data = {
                            "id": pokemon_id,
                            "name": name,
                            "types": [t.strip() for t in types.split(",")],
                            "total": total,
                            "hp": hp,
                            "attack": attack,
                            "defense": defense,
                            "attack_special": attack_special,
                            "defense_special": defense_special,
                            "speed": speed,
                            "evolution_id": evolution_id if evolution_id > 0 else None
                        }
                        
                        response = requests.put(f"{BASE_URL}/pokemon/{pokemon_id}", json=pokemon_data)
                        if response.status_code == 200:
                            st.success("Pokémon mis à jour avec succès")
                        else:
                            st.error("Erreur lors de la mise à jour")
            else:
                st.error("Pokémon non trouvé")
    
    elif action == "Supprimer":
        st.subheader("Supprimer un Pokémon")
        
        pokemon_id = st.number_input("ID du Pokémon à supprimer", min_value=1)
        
        if st.button("Supprimer"):
            if st.checkbox("Je confirme la suppression"):
                response = requests.delete(f"{BASE_URL}/pokemon/{pokemon_id}")
                if response.status_code == 200:
                    st.success("Pokémon supprimé avec succès")
                else:
                    st.error("Erreur lors de la suppression")
            else:
                st.warning("Veuillez confirmer la suppression")