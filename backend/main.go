package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()

	// Routes API
	r.HandleFunc("/search", SearchHandler).Methods("GET")
	r.HandleFunc("/favorites", GetFavorites).Methods("GET")
	r.HandleFunc("/favorites", AddFavorite).Methods("POST")
	r.HandleFunc("/favorites/{id}", DeleteFavorite).Methods("DELETE")

	// Lancer le serveur
	port := "8080"
	fmt.Println("Serveur démarré sur http://localhost:" + port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
