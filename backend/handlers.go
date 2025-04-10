package main

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

// Structure pour stocker les favoris en mémoire
var favorites = []map[string]string{}

// Gestion de la recherche via l'API Deezer
func SearchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Paramètre 'q' manquant", http.StatusBadRequest)
		return
	}

	// Appel API Deezer
	data, err := FetchDeezerSearch(query)
	if err != nil {
		http.Error(w, "Erreur API Deezer", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// Récupérer les favoris
func GetFavorites(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(favorites)
}

// Ajouter un favori
func AddFavorite(w http.ResponseWriter, r *http.Request) {
	var fav map[string]string
	if err := json.NewDecoder(r.Body).Decode(&fav); err != nil {
		http.Error(w, "Format JSON invalide", http.StatusBadRequest)
		return
	}

	favorites = append(favorites, fav)
	w.WriteHeader(http.StatusCreated)
}

// Supprimer un favori
func DeleteFavorite(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	for i, fav := range favorites {
		if fav["id"] == id {
			favorites = append(favorites[:i], favorites[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "Favori non trouvé", http.StatusNotFound)
}
