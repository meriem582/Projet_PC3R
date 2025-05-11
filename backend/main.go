package main

import (
	"log"
	"net/http"
)

func main() {
	// Connexion à la base de données
	db = InitDB()
	defer db.Close()

	// les handlers pour les différentes routes de l'API REST 
	http.HandleFunc("/search", SearchHandler)
	http.HandleFunc("/charts", GetAllChartsHandler)
	http.HandleFunc("/tracks", GetRandomTracksHandler)
	http.HandleFunc("/like", AddLikeHandler)                 
	http.HandleFunc("/unlike", RemoveLikeHandler)            
	http.HandleFunc("/likes", GetLikesInfoHandler)           
	http.HandleFunc("/comment", AddCommentHandler)           
	http.HandleFunc("/comments", GetCommentsHandler)         
	http.HandleFunc("/comment/delete", DeleteCommentHandler) 
	http.HandleFunc("/comment/update", UpdateCommentHandler) 
	http.HandleFunc("/response/add", AddResponseHandler)
	http.HandleFunc("/response/get", GetResponsesHandler)
	http.HandleFunc("/response/delete", DeleteResponseHandler)
	http.HandleFunc("/response/count", GetResponseCountHandler)
	http.HandleFunc("/response/update", UpdateResponseHandler)

	log.Println("Serveur lancé sur le port 8080 🚀")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Erreur lors du démarrage du serveur : %v", err)
	}
}
