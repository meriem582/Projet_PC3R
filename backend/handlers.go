package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

// db est accessible globalement
var db *sql.DB

// handler pour la page d'accueil, pour récupérer les publications selon le type de recherche
func SearchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Veuillez entrer un terme de recherche",
			"results": []interface{}{},
		})
		return
	}

	searchType := r.URL.Query().Get("type") // "artist", "track" ou "album"
	if searchType == "" {
		searchType = "artist" // Par défaut, recherche par artiste
	}

	query = "%" + strings.ToLower(query) + "%"

	var rows *sql.Rows
	var err error

	switch searchType {
	case "track":
		rows, err = db.Query(`
            SELECT a.id_artist, a.name AS artist_name, a.link AS artist_link, a.picture AS artist_picture, 
                   t.title AS track_title, t.link AS track_link, t.preview AS track_preview,
                   al.title AS album_title
            FROM artists AS a 
            JOIN tracks AS t ON t.id_artist = a.id_artist
            LEFT JOIN albums AS al ON t.id_album = al.id_album
            WHERE LOWER(t.title) LIKE $1`, query)
	case "album":
		rows, err = db.Query(`
            SELECT a.id_artist, a.name AS artist_name, a.link AS artist_link, a.picture AS artist_picture, 
                   t.title AS track_title, t.link AS track_link, t.preview AS track_preview,
                   al.title AS album_title
            FROM artists AS a 
            JOIN tracks AS t ON t.id_artist = a.id_artist
            JOIN albums AS al ON t.id_album = al.id_album
            WHERE LOWER(al.title) LIKE $1`, query)
	default: // artist
		rows, err = db.Query(`
            SELECT a.id_artist, a.name AS artist_name, a.link AS artist_link, a.picture AS artist_picture, 
                   t.title AS track_title, t.link AS track_link, t.preview AS track_preview,
                   al.title AS album_title
            FROM artists AS a 
            JOIN tracks AS t ON t.id_artist = a.id_artist
            LEFT JOIN albums AS al ON t.id_album = al.id_album
            WHERE LOWER(a.name) LIKE $1`, query)
	}

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Une erreur est survenue lors de la recherche",
			"results": []interface{}{},
		})
		return
	}
	defer rows.Close()

	var results []map[string]interface{}

	for rows.Next() {
		var (
			id                                              int
			name, picture, link, title, track_link, preview string
			album_title                                     sql.NullString // Utilisation de NullString pour gérer les valeurs NULL
		)

		if err := rows.Scan(
			&id, &name, &link, &picture,
			&title, &track_link, &preview,
			&album_title,
		); err != nil {
			http.Error(w, "Erreur lecture résultat: "+err.Error(), http.StatusInternalServerError)
			return
		}

		result := map[string]interface{}{
			"id":      id,
			"name":    name,
			"picture": picture,
			"link":    link,
			"track": map[string]interface{}{
				"title":   title,
				"link":    track_link,
				"preview": preview,
			},
		}

		if album_title.Valid {
			albumInfo := map[string]interface{}{
				"title": album_title.String,
			}
			result["album"] = albumInfo
		}

		results = append(results, result)
	}

	if len(results) == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Aucun résultat trouvé",
			"results": []interface{}{},
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Résultats de la recherche",
		"results": results,
	})
}

// handler pour récupérer les charts "TOP 10"
func GetAllChartsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
        SELECT id_chart, title, link, preview, 
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
			id_artist, id_album, id_chart int
			nom_artist, picture_artist    string
			link_artist, nom_album        string
		)

		if err := rows.Scan(
			&id_chart, &title, &link, &preview,
			&id_artist, &id_album, &nom_artist, &picture_artist,
			&link_artist, &nom_album,
		); err != nil {
			// En cas d'erreur, renvoyer un tableau vide plutôt que d'échouer
			charts = []map[string]interface{}{}
			break
		}

		charts = append(charts, map[string]interface{}{
			"id_chart":       id_chart,
			"title":          title,
			"link":           link,
			"preview":        preview,
			"id_artist":      id_artist,
			"id_album":       id_album,
			"nom_artist":     nom_artist,
			"picture_artist": picture_artist,
			"link_artist":    link_artist,
			"nom_album":      nom_album,
		})
	}

	if charts == nil {
		charts = []map[string]interface{}{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(charts)
}

// handler pour récupérer les morceaux aléatoires avec pagination
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
		SELECT a.id_artist, a.name, a.link, a.picture,
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
		var id int
		var name, picture, link, title, track_link, preview string
		if err := rows.Scan(&id, &name, &link, &picture, &title, &track_link, &preview); err != nil {
			http.Error(w, "Erreur lecture résultat", http.StatusInternalServerError)
			return
		}
		tracks = append(tracks, map[string]interface{}{
			"id":      id,
			"name":    name,
			"picture": picture,
			"link":    link,
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

// handler pour ajouter un like
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

// handler pour supprimer un like
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

// handler pour récupérer les informations de like (le nombre)
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

// handler pour ajouter un commentaire
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

// handler pour récupérer les commentaires d'un morceau
func GetCommentsHandler(w http.ResponseWriter, r *http.Request) {
	trackID := r.URL.Query().Get("track_id")
	if trackID == "" {
		http.Error(w, "Track ID is required", http.StatusBadRequest)
		return
	}

	rows, err := db.Query(`
        SELECT c.id, c.contenu, c.date_commentaire, 
               u.id as user_id, u.username as user_name
        FROM Commentaires c
        JOIN  up_users u ON c.id_user = u.id
        WHERE c.id_track = $1
        ORDER BY c.date_commentaire DESC;
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

// handler pour supprimer un commentaire
func DeleteCommentHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IdComment int `json:"id"`
		IdUser    int `json:"id_user"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Vérification que l'utilisateur est bien l'auteur
	var authorID int
	err := db.QueryRow("SELECT id_user FROM Commentaires WHERE id = $1", input.IdComment).Scan(&authorID)
	if err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	if authorID != input.IdUser {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	_, err = db.Exec("DELETE FROM Commentaires WHERE id = $1", input.IdComment)
	if err != nil {
		http.Error(w, "Error deleting comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// handler pour mettre à jour un commentaire
func UpdateCommentHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IdComment int    `json:"id"`
		IdUser    int    `json:"id_user"`
		Contenu   string `json:"contenu"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var authorID int
	err := db.QueryRow("SELECT id_user FROM Commentaires WHERE id = $1", input.IdComment).Scan(&authorID)
	if err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	if authorID != input.IdUser {
		http.Error(w, "Unauthorized: You can only edit your own comments", http.StatusUnauthorized)
		return
	}

	_, err = db.Exec(
		"UPDATE Commentaires SET contenu = $1, date_commentaire = NOW() WHERE id = $2",
		input.Contenu, input.IdComment,
	)
	if err != nil {
		http.Error(w, "Error updating comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// handler pour ajouter une réponse à un commentaire
func AddResponseHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IdUser    int    `json:"id_user"`
		IdComment int    `json:"id_comment"`
		Contenu   string `json:"contenu"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Exec(
		"INSERT INTO Responses (id_user, id_comment, contenu, date_response) VALUES ($1, $2, $3, NOW())",
		input.IdUser, input.IdComment, input.Contenu,
	)
	if err != nil {
		http.Error(w, "Error adding response", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// handler pour récupérer les réponses d'un commentaire
func GetResponsesHandler(w http.ResponseWriter, r *http.Request) {
	commentID := r.URL.Query().Get("comment_id")
	if commentID == "" {
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}

	rows, err := db.Query(`
        SELECT r.id, r.contenu, r.date_response, 
               u.id as user_id, u.username as user_name
        FROM Responses r
        JOIN up_users u ON r.id_user = u.id
        WHERE r.id_comment = $1
        ORDER BY r.date_response ASC
    `, commentID)
	if err != nil {
		http.Error(w, "Error fetching responses", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var responses []map[string]interface{}
	for rows.Next() {
		var idResponse, userID int
		var contenu, dateResponse, userName string

		if err := rows.Scan(&idResponse, &contenu, &dateResponse, &userID, &userName); err != nil {
			http.Error(w, "Error reading response", http.StatusInternalServerError)
			return
		}

		responses = append(responses, map[string]interface{}{
			"id":      idResponse,
			"content": contenu,
			"date":    dateResponse,
			"user": map[string]interface{}{
				"id":   userID,
				"name": userName,
			},
		})
	}

	if responses == nil {
		responses = []map[string]interface{}{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responses)
}

// handler pour supprimer une réponse
func DeleteResponseHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IdResponse int `json:"id"`
		IdUser     int `json:"id_user"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var authorID int
	err := db.QueryRow("SELECT id_user FROM Responses WHERE id = $1", input.IdResponse).Scan(&authorID)
	if err != nil {
		http.Error(w, "Response not found", http.StatusNotFound)
		return
	}

	if authorID != input.IdUser {
		http.Error(w, "Unauthorized: You can only delete your own responses", http.StatusUnauthorized)
		return
	}

	_, err = db.Exec("DELETE FROM Responses WHERE id = $1", input.IdResponse)
	if err != nil {
		http.Error(w, "Error deleting response", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// handler pour compter le nombre de réponses à un commentaire
func GetResponseCountHandler(w http.ResponseWriter, r *http.Request) {
	commentID := r.URL.Query().Get("comment_id")
	if commentID == "" {
		http.Error(w, "Comment ID is required", http.StatusBadRequest)
		return
	}

	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM Responses WHERE id_comment = $1", commentID).Scan(&count)
	if err != nil {
		http.Error(w, "Error counting responses", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"count": count,
	})
}

// handler pour mettre à jour une réponse
func UpdateResponseHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IdResponse int    `json:"id"`
		IdUser     int    `json:"id_user"`
		Contenu    string `json:"contenu"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var authorID int
	err := db.QueryRow("SELECT id_user FROM Responses WHERE id = $1", input.IdResponse).Scan(&authorID)
	if err != nil {
		http.Error(w, "Response not found", http.StatusNotFound)
		return
	}

	if authorID != input.IdUser {
		http.Error(w, "Unauthorized: You can only edit your own responses", http.StatusUnauthorized)
		return
	}

	_, err = db.Exec(
		"UPDATE Responses SET contenu = $1, date_response = NOW() WHERE id = $2",
		input.Contenu, input.IdResponse,
	)
	if err != nil {
		http.Error(w, "Error updating response", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Vérifier si l'email ou le username existe déjà
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM up_users WHERE email = $1 OR username = $2",
		input.Email, input.Username).Scan(&count)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if count > 0 {
		http.Error(w, "Email or username already exists", http.StatusConflict)
		return
	}

	// Hasher le mot de passe (vous devrez implémenter cette fonction)
	hashedPassword, err := hashPassword(input.Password)
	if err != nil {
		http.Error(w, "Error processing password", http.StatusInternalServerError)
		return
	}

	// Insérer le nouvel utilisateur
	_, err = db.Exec("INSERT INTO up_users (username, email, password) VALUES ($1, $2, $3)",
		input.Username, input.Email, hashedPassword)
	if err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}

func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func generateJWTToken(userID int) (string, error) {
	// Implémentez la génération de token JWT selon votre préférence
	// Exemple simplifié :
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString([]byte("your-secret-key"))
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var user struct {
		ID       int
		Username string
		Email    string
		Password string
	}

	err := db.QueryRow("SELECT id, username, email, password FROM up_users WHERE email = $1",
		input.Email).Scan(&user.ID, &user.Username, &user.Email, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	// Vérifier le mot de passe (vous devrez implémenter cette fonction)
	if !checkPasswordHash(input.Password, user.Password) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Générer un token JWT (vous devrez implémenter cette fonction)
	token, err := generateJWTToken(user.ID)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}
