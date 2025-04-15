package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"

	"strings"

	_ "github.com/lib/pq"
)

const (
	DB_HOST     = "dpg-cvtuc3q4d50c73aodl90-a.oregon-postgres.render.com"
	DB_NAME     = "music_app_l1yd"
	DB_USER     = "admin"
	DB_PASSWORD = "X9KFl31tkZrhQDHFuuYWeG80eoB84S1O"
)

type Genre struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Album struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Link        string `json:"link"`
	Artist      struct {
		ID int `json:"id"`
	} `json:"artist"`
}

type Artist struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Link     string `json:"link"`
	Picture  string `json:"picture"`
}

type Chart struct {
	ID             int    `json:"id"`
	Title          string `json:"title"`
	Link           string `json:"link"`
	Preview        string `json:"preview"`
	Artist         struct {
		ID      int    `json:"id"`
		Name    string `json:"name"`
		Link    string `json:"link"`
		Picture string `json:"picture"`
	} `json:"artist"`
	Album struct {
		ID    int    `json:"id"`
		Title string `json:"title"`
	} `json:"album"`
}

type Track struct {
	ID             int    `json:"id"`
	Title          string `json:"title"`
	Preview        string `json:"preview"`
	Link           string `json:"link"`
	Album          struct {
		ID int `json:"id"`
	} `json:"album"`
	Artist struct {
		ID int `json:"id"`
	} `json:"artist"`
}

// Récupérer des données JSON
func fetchDeezerData(url string, target interface{}) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Erreur lecture du corps de la réponse:", err)
		return err
	}

	// Rewind the response body and decode into the target
	resp.Body = io.NopCloser(bytes.NewReader(body))
	return json.NewDecoder(resp.Body).Decode(target)
}

// Insérer un genre
func insertGenre(db *sql.DB, genre Genre) {
	query := `INSERT INTO "genres" (id_genre, name) VALUES ($1, $2) ON CONFLICT (id_genre) DO NOTHING;`
	_, err := db.Exec(query, genre.ID, genre.Name)
	if err != nil {
		log.Printf("Erreur insertion genre %d: %v", genre.ID, err)
	}
}

func insertChart(db *sql.DB, chart Chart) {
	query := `INSERT INTO "charts" (id_chart, title, link, preview, id_artist, id_album, nom_artist, picture_artist, link_artist, nom_album) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
	          ON CONFLICT (id_chart) DO NOTHING;`
	_, err := db.Exec(query, chart.ID, chart.Title, chart.Link, chart.Preview, chart.Artist.ID, chart.Album.ID, chart.Artist.Name, chart.Artist.Picture, chart.Artist.Link, chart.Album.Title)
	if err != nil {
		log.Printf("Erreur insertion chart %d: %v", chart.ID, err)
	}
}

func insertAlbum(db *sql.DB, album Album) {

	query := `INSERT INTO "albums" (id_album, title, link, id_artist) 
	          VALUES ($1, $2, $3, $4) 
	          ON CONFLICT (id_album) DO NOTHING;`
	_, err := db.Exec(query, album.ID, album.Title, album.Link, album.Artist.ID) // <-- Correction ici
	if err != nil {
		log.Printf("Erreur insertion album %d: %v", album.ID, err)
	}
}

func insertArtist(db *sql.DB, artist Artist) {
	query := `INSERT INTO "artists" (id_artist, name, link, picture) 
	          VALUES ($1, $2, $3, $4) 
	          ON CONFLICT (id_artist) DO NOTHING;`
	_, err := db.Exec(query, artist.ID, artist.Name, artist.Link, artist.Picture)
	if err != nil {
		log.Printf("Erreur insertion artist %d: %v", artist.ID, err)
	}
}

// Insérer une track
func insertTrack(db *sql.DB, track Track) {
	query := `INSERT INTO "tracks" (id_track, title, preview, link, id_album, id_artist) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          ON CONFLICT (id_track) DO NOTHING;`
	_, err := db.Exec(query, track.ID, track.Title, track.Preview, track.Link, track.Album.ID, track.Artist.ID)
	if err != nil {
		log.Printf("Erreur insertion track %d: %v", track.ID, err)
	}
}

// insérer de genreAlbum
func insertGenreAlbum(db *sql.DB, genreID int, albumID int) {
	query := `INSERT INTO "album_genres" (id_genre, id_album) 
	          VALUES ($1, $2) 
	          ON CONFLICT (id_genre, id_album) DO NOTHING;`
	_, err := db.Exec(query, genreID, albumID)
	if err != nil {
		log.Printf("Erreur insertion genre_album %d: %v", genreID, err)
	}
}

// Récupérer et insérer les genres
func fetchAndInsertGenres(db *sql.DB) {
	var response struct {
		Data []Genre `json:"data"`
	}

	if err := fetchDeezerData("https://api.deezer.com/genre", &response); err != nil {
		log.Println("Erreur fetch genres:", err)
		return
	}

	for _, genre := range response.Data {
		insertGenre(db, genre)
	}
}

func fetchAndInsertCharts(db *sql.DB) {
	var response struct {
		Tracks struct {
			Data []Chart `json:"data"`
		} `json:"tracks"`
	}

	if err := fetchDeezerData("https://api.deezer.com/chart", &response); err != nil {
		log.Println("Erreur fetch charts:", err)
		return
	}

	if len(response.Tracks.Data) == 0 {
		log.Println("Aucun chart disponible.")
	}

	for _, chart := range response.Tracks.Data {
		insertChart(db, chart)
	}
}

func fetchAndInsertAlbumsByGenre(db *sql.DB, genreName string, genreID int) {
	var response struct {
		Data []Album `json:"data"`
	}
	genreNameEncoded := url.QueryEscape(genreName)

	// Construire l'URL pour rechercher par genre
	url := fmt.Sprintf("https://api.deezer.com/search/album?q=genre:\"%s\"", strings.ReplaceAll(genreNameEncoded, " ", "%20"))

	// Appeler l'API Deezer
	if err := fetchDeezerData(url, &response); err != nil {
		log.Println("Erreur fetch albums:", err)
		return
	}

	// Insérer les albums dans la base de données
	for _, album := range response.Data {
		insertAlbum(db, album)
		insertGenreAlbum(db, genreID, album.ID)
	}
}

func fetchAndInsertArtistsByAlbum(db *sql.DB, artistID int) {
	var artist Artist

	// Construire l'URL pour rechercher par artiste
	url := fmt.Sprintf("https://api.deezer.com/artist/%d", artistID)

	// Appeler l'API Deezer et décoder la réponse dans la variable artist
	if err := fetchDeezerData(url, &artist); err != nil {
		log.Printf("Erreur fetch artist %d: %v", artistID, err)
		return
	}

	// Insérer l'artiste dans la base de données
	insertArtist(db, artist)
}

func fetchGenresFromDB(db *sql.DB) ([]Genre, error) {
	rows, err := db.Query(`SELECT id_genre, name FROM genres`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var genres []Genre
	for rows.Next() {
		var genre Genre
		if err := rows.Scan(&genre.ID, &genre.Name); err != nil {
			return nil, err
		}
		genres = append(genres, genre)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return genres, nil
}

func fetchArtistIdFromDB(db *sql.DB) ([]int, error) {
	rows, err := db.Query(`SELECT id_artist FROM albums`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var artistIds []int
	for rows.Next() {
		var artistId int
		if err := rows.Scan(&artistId); err != nil {
			return nil, err
		}
		artistIds = append(artistIds, artistId)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return artistIds, nil
}

// Récupérer les tracks d'un album et les insérer
func fetchAndInsertTracksByAlbum(db *sql.DB, albumID int) {
	// D'abord vérifier si l'album existe dans votre base
	var exists bool
	err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM albums WHERE id_album = $1)`, albumID).Scan(&exists)
	if err != nil || !exists {
		log.Printf("Album %d n'existe pas, skip des tracks", albumID)
		return
	}

	var response struct {
		Data []Track `json:"data"`
	}

	url := fmt.Sprintf("https://api.deezer.com/album/%d/tracks", albumID)
	if err := fetchDeezerData(url, &response); err != nil {
		log.Printf("Erreur fetch tracks pour l'album %d: %v", albumID, err)
		return
	}

	for _, track := range response.Data {
		// Ne pas insérer si l'ID d'album est 0 ou invalide
		if track.Album.ID <= 0 {
			track.Album.ID = albumID // Forcer l'ID d'album correct
		}

		// Vérifier aussi l'artiste
		if track.Artist.ID <= 0 {
			// Récupérer l'artiste depuis l'album si possible
			var artistID int
			err := db.QueryRow(`SELECT id_artist FROM albums WHERE id_album = $1`, albumID).Scan(&artistID)
			if err == nil {
				track.Artist.ID = artistID
			} else {
				log.Printf("Impossible de trouver l'artiste pour l'album %d: %v", albumID, err)
				continue // Skip cette track
			}
		}

		insertTrack(db, track)
	}
}

// Récupérer et insérer les tracks pour chaque album
func fetchAndInsertTracksForAlbums(db *sql.DB) {
	// Récupérer les albums depuis la base de données
	rows, err := db.Query(`SELECT id_album FROM albums`)
	if err != nil {
		log.Fatal("Erreur récupération albums:", err)
	}
	defer rows.Close()

	for rows.Next() {
		var albumID int
		if err := rows.Scan(&albumID); err != nil {
			log.Fatal("Erreur lecture album ID:", err)
		}
		// Pour chaque album, récupérer et insérer les tracks
		log.Printf("Récupération des tracks pour l'album %d", albumID)
		fetchAndInsertTracksByAlbum(db, albumID)
	}

	if err := rows.Err(); err != nil {
		log.Fatal("Erreur itération sur les albums:", err)
	}
}
func clearAllTables(db *sql.DB) {
	tables := []string{
		"album_genres",
		"tracks",
		"charts",
		"albums",
		"artists",
		"genres",
	}

	for _, table := range tables {
		_, err := db.Exec(fmt.Sprintf(`TRUNCATE TABLE "%s" RESTART IDENTITY CASCADE;`, table))
		if err != nil {
			log.Printf("Erreur lors du TRUNCATE de %s: %v", table, err)
		} else {
			log.Printf("Table %s vidée.", table)
		}
	}
}

func main() {
	dsn := fmt.Sprintf("host=%s dbname=%s user=%s password=%s sslmode=require", DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Erreur connexion DB:", err)
	}
	defer db.Close()

	log.Println("Début de la mise à jour de la base de données...")
	clearAllTables(db)
	fetchAndInsertGenres(db)

	// Récupérer les genres depuis la base de données
	genres, err := fetchGenresFromDB(db)
	if err != nil {
		log.Fatal("Erreur récupération genres:", err)
	}

	// Pour chaque genre, récupérer et insérer les albums associés
	for _, genre := range genres {
		fetchAndInsertAlbumsByGenre(db, genre.Name, genre.ID)
	}

	ArtistIds, err := fetchArtistIdFromDB(db)
	if err != nil {
		log.Fatal("Erreur récupération artistIds:", err)
	}

	for _, artistId := range ArtistIds {
		fetchAndInsertArtistsByAlbum(db, artistId)
	}
	fetchAndInsertCharts(db)

	// Récupérer et insérer les tracks pour chaque album
	fetchAndInsertTracksForAlbums(db)

	log.Println("Mise à jour terminée. Attente de 30 secondes...")

}
