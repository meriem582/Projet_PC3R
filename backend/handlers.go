package main

import (
	"database/sql"
	"encoding/json"
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

