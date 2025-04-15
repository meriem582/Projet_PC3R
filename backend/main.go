package main

import (
	"log"
	"net/http"
)

func main() {
	// Initialise la variable globale db
	db = InitDB()
	defer db.Close()

	// Ici, on passe la fonction SearchHandler directement (sans l'appeler)
	http.HandleFunc("/search", SearchHandler)
	http.HandleFunc("/charts", GetAllChartsHandler)
	http.HandleFunc("/tracks", GetRandomTracksHandler)
	http.HandleFunc("/like", AddLikeHandler)                 // POST
	http.HandleFunc("/unlike", RemoveLikeHandler)            // DELETE
	http.HandleFunc("/likes", GetLikesInfoHandler)           // GET avec
	http.HandleFunc("/comment", AddCommentHandler)           // POST
	http.HandleFunc("/comments", GetCommentsHandler)         // GET
	http.HandleFunc("/comment/delete", DeleteCommentHandler) // DELETE

	log.Println("Serveur lancé sur le port 8080 🚀")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Erreur lors du démarrage du serveur : %v", err)
	}
}
