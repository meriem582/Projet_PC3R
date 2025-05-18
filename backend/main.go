package main

import (
	"log"
	"net/http"
	"os"
)

func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		enableCORS(&w)
		if r.Method == "OPTIONS" {
			return
		}
		next(w, r)
	}
}

func main() {
	db = InitDB()
	defer db.Close()

	http.HandleFunc("/search", corsMiddleware(SearchHandler))
	http.HandleFunc("/charts", corsMiddleware(GetAllChartsHandler))
	http.HandleFunc("/tracks", corsMiddleware(GetRandomTracksHandler))
	http.HandleFunc("/like", corsMiddleware(AddLikeHandler))
	http.HandleFunc("/unlike", corsMiddleware(RemoveLikeHandler))
	http.HandleFunc("/likes", corsMiddleware(GetLikesInfoHandler))
	http.HandleFunc("/comment", corsMiddleware(AddCommentHandler))
	http.HandleFunc("/comments", corsMiddleware(GetCommentsHandler))
	http.HandleFunc("/comment/delete", corsMiddleware(DeleteCommentHandler))
	http.HandleFunc("/comment/update", corsMiddleware(UpdateCommentHandler))
	http.HandleFunc("/response/add", corsMiddleware(AddResponseHandler))
	http.HandleFunc("/response/get", corsMiddleware(GetResponsesHandler))
	http.HandleFunc("/response/delete", corsMiddleware(DeleteResponseHandler))
	http.HandleFunc("/response/count", corsMiddleware(GetResponseCountHandler))
	http.HandleFunc("/response/update", corsMiddleware(UpdateResponseHandler))
	http.HandleFunc("/register", corsMiddleware(RegisterHandler))
	http.HandleFunc("/login0", corsMiddleware(LoginHandler))
	http.HandleFunc("/api/me", corsMiddleware(GetCurrentUserHandler))
	http.HandleFunc("/confirm-email", corsMiddleware(ConfirmEmailHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Serveur lancé sur le port 8080 🚀")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Erreur lors du démarrage du serveur : %v", err)
	}
}
