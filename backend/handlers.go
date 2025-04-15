package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// db est accessible globalement
var db *sql.DB

func SearchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Paramètre de recherche manquant (?q=...)", http.StatusBadRequest)
		return
	}

	query = "%" + strings.ToLower(query) + "%"

	rows, err := db.Query(`
		SELECT a.id_artist, a.name AS artist_name, a.link AS artist_link,a.picture AS artist_picture,a.nb_album AS artist_nb_album,a.nb_fans AS artist_nb_fans,
		t.title AS track_title, t.link AS track_link, t.preview AS track_preview 
		FROM artists AS a JOIN tracks AS t ON t.id_artist = a.id_artist WHERE LOWER(a.name) LIKE $1`, query)
	if err != nil {
		http.Error(w, "Erreur lors de la recherche", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []map[string]interface{}

	for rows.Next() {
		var id, nb_album, nb_fans int
		var name, picture, link, title, track_link, preview string
		if err := rows.Scan(&id, &name, &link, &picture, &nb_album, &nb_fans, &title, &track_link, &preview); err != nil {
			http.Error(w, "Erreur lecture résultat", http.StatusInternalServerError)
			return
		}
		results = append(results, map[string]interface{}{
			"id":       id,
			"name":     name,
			"picture":  picture,
			"link":     link,
			"nb_album": nb_album,
			"nb_fans":  nb_fans,
			"track": map[string]interface{}{
				"title":   title,
				"link":    track_link,
				"preview": preview,
			},
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func GetAllChartsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
        SELECT id_chart, title, link, preview, explicit_lyrics, 
               id_artist, id_album, nom_artist, picture_artist, 
               link_artist, nom_album FROM Charts
    `)
	if err != nil {
		http.Error(w, "Erreur lors de la récupération des charts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var charts []map[string]interface{}

	for rows.Next() {
		var (
			title, link, preview          string
			explicit_lyrics               bool
			id_artist, id_album, id_chart int
			nom_artist, picture_artist    string
			link_artist, nom_album        string
		)

		if err := rows.Scan(
			&id_chart, &title, &link, &preview, &explicit_lyrics,
			&id_artist, &id_album, &nom_artist, &picture_artist,
			&link_artist, &nom_album,
		); err != nil {
			// En cas d'erreur, renvoyer un tableau vide plutôt que d'échouer
			charts = []map[string]interface{}{}
			break
		}

		charts = append(charts, map[string]interface{}{
			"id_chart":        id_chart,
			"title":           title,
			"link":            link,
			"preview":         preview,
			"explicit_lyrics": explicit_lyrics,
			"id_artist":       id_artist,
			"id_album":        id_album,
			"nom_artist":      nom_artist,
			"picture_artist":  picture_artist,
			"link_artist":     link_artist,
			"nom_album":       nom_album,
		})
	}

	// S'assurer qu'on renvoie toujours un tableau (même vide)
	if charts == nil {
		charts = []map[string]interface{}{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(charts)
}

func GetRandomTracksHandler(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}
	var pageNumber int
	fmt.Sscanf(page, "%d", &pageNumber)
	limit := 10
	offset := (pageNumber - 1) * limit

	rows, err := db.Query(`
		SELECT a.id_artist, a.name, a.link, a.picture, a.nb_album, a.nb_fans,
		       t.title, t.link, t.preview
		FROM artists AS a
		JOIN tracks AS t ON t.id_artist = a.id_artist
		ORDER BY RANDOM()
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		http.Error(w, "Erreur lors de la récupération des morceaux", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tracks []map[string]interface{}

	for rows.Next() {
		var id, nb_album, nb_fans int
		var name, picture, link, title, track_link, preview string
		if err := rows.Scan(&id, &name, &link, &picture, &nb_album, &nb_fans, &title, &track_link, &preview); err != nil {
			http.Error(w, "Erreur lecture résultat", http.StatusInternalServerError)
			return
		}
		tracks = append(tracks, map[string]interface{}{
			"id":       id,
			"name":     name,
			"picture":  picture,
			"link":     link,
			"nb_album": nb_album,
			"nb_fans":  nb_fans,
			"track": map[string]interface{}{
				"title":   title,
				"link":    track_link,
				"preview": preview,
			},
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracks)
}

func AddLikeHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IdUser  int `json:"id_user"`
		IdTrack int `json:"id_track"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Exec("INSERT INTO Likes (id_user, id_track) VALUES ($1, $2)", input.IdUser, input.IdTrack)
	if err != nil {
		if strings.Contains(err.Error(), "unique_like") {
			http.Error(w, "Already liked", http.StatusConflict)
			return
		}
		http.Error(w, "Error inserting like", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func RemoveLikeHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IdUser  int `json:"id_user"`
		IdTrack int `json:"id_track"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Exec("DELETE FROM Likes WHERE id_user = $1 AND id_track = $2", input.IdUser, input.IdTrack)
	if err != nil {
		http.Error(w, "Error removing like", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func GetLikesInfoHandler(w http.ResponseWriter, r *http.Request) {
	trackID := r.URL.Query().Get("track_id")
	userID := r.URL.Query().Get("user_id")

	row := db.QueryRow(`
		SELECT COUNT(*) AS like_count,
		       EXISTS(SELECT 1 FROM Likes WHERE id_user = $1 AND id_track = $2) AS user_liked
		FROM Likes WHERE id_track = $2
	`, userID, trackID)

	var likeCount int
	var userLiked bool
	if err := row.Scan(&likeCount, &userLiked); err != nil {
		http.Error(w, "Error fetching like info", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"like_count": likeCount,
		"user_liked": userLiked,
	})
}

// Ajoutez ces nouvelles fonctions handlers

func AddCommentHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IdUser  int    `json:"id_user"`
		IdTrack int    `json:"id_track"`
		Contenu string `json:"contenu"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Exec(
		"INSERT INTO Commentaires (id_user, id_track, contenu, date_commentaire) VALUES ($1, $2, $3, NOW())",
		input.IdUser, input.IdTrack, input.Contenu,
	)
	if err != nil {
		http.Error(w, "Error adding comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func GetCommentsHandler(w http.ResponseWriter, r *http.Request) {
	trackID := r.URL.Query().Get("track_id")
	if trackID == "" {
		http.Error(w, "Track ID is required", http.StatusBadRequest)
		return
	}

	rows, err := db.Query(`
        SELECT c.id_commentaire, c.contenu, c.date_commentaire, 
               u.id as user_id, u.username as user_name
        FROM Commentaires c
        JOIN users u ON c.id_user = u.id
        WHERE c.id_track = $1
        ORDER BY c.date_commentaire DESC
    `, trackID)
	if err != nil {
		http.Error(w, "Error fetching comments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []map[string]interface{}
	for rows.Next() {
		var idCommentaire, userID int
		var contenu, dateCommentaire, userName string

		if err := rows.Scan(&idCommentaire, &contenu, &dateCommentaire, &userID, &userName); err != nil {
			http.Error(w, "Error reading comment", http.StatusInternalServerError)
			return
		}

		comments = append(comments, map[string]interface{}{
			"id":      idCommentaire,
			"content": contenu,
			"date":    dateCommentaire,
			"user": map[string]interface{}{
				"id":   userID,
				"name": userName,
			},
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

func DeleteCommentHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IdUser    int `json:"id_user"`
		IdComment int `json:"id_comment"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Vérifie que l'utilisateur est bien l'auteur du commentaire avant de supprimer
	_, err := db.Exec(
		"DELETE FROM Commentaires WHERE id_commentaire = $1 AND id_user = $2",
		input.IdComment, input.IdUser,
	)
	if err != nil {
		http.Error(w, "Error deleting comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
