from fastapi import FastAPI, Path, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from dataclasses import dataclass, asdict
from typing import Union
import json

#===== Structure de données : Dictionnaire indexé par pokemon id =====#
with open("pokemon.json", "r") as f:
    pokemons_list = json.load(f)

list_pokemons = {k+1:v for k, v in enumerate(pokemons_list)}
#======================================================================
@dataclass
class Pokemon() :
    id: int
    name: str
    types: list[str]
    total: int
    hp: int
    attack: int
    defense: int
    attack_special: int
    defense_special: int
    speed: int
    evolution_id: Union[int, None] = None
#======================================================================*
app = FastAPI()

# Ajout du middleware CORS - ESSENTIEL pour que le frontend HTML puisse communiquer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, limitez aux domaines spécifiques
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monter les fichiers statiques
app.mount("/static", StaticFiles(directory="frontend_html", html=True), name="static")

@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html", status_code=302)

@app.get("/total_pokemons")
def get_total_pokemons()->dict: 
    return {"total_pokemons": len(list_pokemons)}
@app.get("/pokemons")
def get_all_pokemons () -> list[Pokemon]:
    res = []
    for id in list_pokemons:
        res.append(Pokemon(**list_pokemons[id]))
    return res
@app.get("/pokemon/{id}")
def get_pokemon(id: int = Path(ge=1)) -> Pokemon:
    if id not in list_pokemons:
        raise HTTPException(status_code=404, detail=f"Le pokemon d'id {id} n'existe pas")
    return Pokemon(**list_pokemons[id])

@app.post("/pokemon/")
def create_pokemon(pokemon:Pokemon) -> Pokemon:
    if pokemon.id in list_pokemons:
        raise HTTPException(status_code=400, detail=f"Le pokemon d'id {pokemon.id} existe déjà")
    list_pokemons[pokemon.id] = asdict(pokemon)
    return pokemon

@app.delete("/pokemon/{id}")
def delete_pokemon(id: int = Path(ge=1)) -> Pokemon:
    if id in list_pokemons:
        pokemon = Pokemon(**list_pokemons[id])
        del list_pokemons[id]
        return pokemon
    raise HTTPException(status_code=404, detail=f"Le pokemon d'id {id} n'existe pas")

@app.get("/types")    
def get_all_types()-> list[str]:
    types = []
    for pokemon in pokemons_list:
        for type in pokemon["types"]:
            if type not in types:
                types.append(type)
    return types




@app.get("/pokemons/search/")
def search_pokemons(
    types: Union[str, None] = None,
    evo : Union[str, None] = None,
    totalgt : Union[int, None] = None,
    totallt : Union[int, None] = None,
    sortby : Union[str, None] = None,
    order : Union[str, None] = None,
)->Union[list[Pokemon], None] :
    
    filtered_list = []
    res = []

    #On filtre les types
    if types is not None :
        for pokemon in pokemons_list :
            if set(types.split(",")).issubset(pokemon["types"]) :
                filtered_list.append(pokemon)

    #On filtre les evolutions
    if evo is not None :
        tmp = filtered_list if filtered_list else pokemons_list
        new = []

        for pokemon in tmp :
            if evo == "true" and "evolution_id" in pokemon:
                new.append(pokemon)
            if evo == "false" and "evolution_id" not in pokemon:
                new.append(pokemon)

        filtered_list = new

    #On filtre sur greater than total
    if totalgt is not None :
        tmp = filtered_list if filtered_list else pokemons_list
        new = []

        for pokemon in tmp :
            if pokemon["total"] > totalgt:
                new.append(pokemon)

        filtered_list = new

    #On filtre sur less than total
    if totallt is not None :
        tmp = filtered_list if filtered_list else pokemons_list
        new = []

        for pokemon in tmp :
            if pokemon["total"] < totallt:
                new.append(pokemon)

        filtered_list = new

    #On gére le tri
    if sortby is not None and sortby in ["id","name","total"] :
        filtered_list = filtered_list if filtered_list else pokemons_list
        sorting_order = False
        if order == "asc" : sorting_order = False
        if order == "desc" : sorting_order = True

        filtered_list = sorted(filtered_list, key=lambda d: d[sortby], reverse=sorting_order)

        
    #Réponse           
    if filtered_list :
        for pokemon in filtered_list :
            res.append(Pokemon(**pokemon))
        return res
    
    raise DeprecationWarning (f"Le pokemon n'existe pas")

@app.put("/pokemon/{id}")
def update_pokemon(id: int, pokemon: dict = Body(...)):
    if id not in list_pokemons:
        raise HTTPException(status_code=404, detail="Pokémon non trouvé")
    list_pokemons[id] = pokemon
    return {"message": "Pokémon mis à jour"}


