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
	"time"

	"strings"

	_ "github.com/lib/pq"
)

const (
	DB_HOST     = "dpg-cvhgjr52ng1s739rlu5g-a.oregon-postgres.render.com"
	DB_NAME     = "music_app_bdd"
	DB_USER     = "admin"
	DB_PASSWORD = "dGOELcuc4Bnm55gaGPJ1wfZ9IXBfP4LP"
)

type Genre struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Album struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Link        string `json:"link"`
	ReleaseDate string `json:"release_date"`
	Cover       string `json:"cover"`
	Artist      struct {
		ID int `json:"id"`
	} `json:"artist"`
}

type Artist struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Link     string `json:"link"`
	Picture  string `json:"picture"`
	NbAlbums int    `json:"nb_album"`
	NbFans   int    `json:"nb_fans"`
}

type Chart struct {
	ID             int    `json:"id"`
	Title          string `json:"title"`
	Link           string `json:"link"`
	Preview        string `json:"preview"`
	ExplicitLyrics bool   `json:"explicit_lyrics"`
	Artist         struct {
		ID int `json:"id"`
	} `json:"artist"`
	Album struct {
		ID int `json:"id"`
	} `json:"album"`
}

type Track struct {
	ID             int    `json:"id"`
	Title          string `json:"title"`
	Preview        string `json:"preview"`
	Link           string `json:"link"`
	Duration       int    `json:"duration"`
	Rank           int    `json:"rank"`
	ReleaseDate    string `json:"release_date"`
	ExplicitLyrics bool   `json:"explicit_lyrics"`
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
	query := `INSERT INTO "charts" (id_chart, title, link, preview, explicit_lyrics, id_artist, id_album) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7) 
	          ON CONFLICT (id_chart) DO NOTHING;`
	_, err := db.Exec(query, chart.ID, chart.Title, chart.Link, chart.Preview, chart.ExplicitLyrics, chart.Artist.ID, chart.Album.ID)
	if err != nil {
		log.Printf("Erreur insertion chart %d: %v", chart.ID, err)
	}
}

func insertAlbum(db *sql.DB, album Album) {
	var releaseDate interface{}
	if album.ReleaseDate == "" {
		releaseDate = nil
	} else {
		releaseDate = album.ReleaseDate
	}

	query := `INSERT INTO "albums" (id_album, title, link, release_date, cover, id_artist) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          ON CONFLICT (id_album) DO NOTHING;`
	_, err := db.Exec(query, album.ID, album.Title, album.Link, releaseDate, album.Cover, album.Artist.ID) // <-- Correction ici
	if err != nil {
		log.Printf("Erreur insertion album %d: %v", album.ID, err)
	}
}

func insertArtist(db *sql.DB, artist Artist) {
	query := `INSERT INTO "artists" (id_artist, name, link, picture, nb_album, nb_fans) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          ON CONFLICT (id_artist) DO NOTHING;`
	_, err := db.Exec(query, artist.ID, artist.Name, artist.Link, artist.Picture, artist.NbAlbums, artist.NbFans)
	if err != nil {
		log.Printf("Erreur insertion artist %d: %v", artist.ID, err)
	}
}

// Insérer une track
func insertTrack(db *sql.DB, track Track) {
	var releaseDate interface{}
	if track.ReleaseDate == "" {
		releaseDate = nil
	} else {
		releaseDate = track.ReleaseDate
	}
	query := `INSERT INTO "tracks" (id_track, title, preview, link, duration, rank, release_date, explicit_lyrics, id_album, id_artist) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
	          ON CONFLICT (id_track) DO NOTHING;`
	_, err := db.Exec(query, track.ID, track.Title, track.Preview, track.Link, track.Duration, track.Rank, releaseDate, track.ExplicitLyrics, track.Album.ID, track.Artist.ID)
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
	var response struct {
		Data []Track `json:"data"`
	}

	// Appel de l'API Deezer pour récupérer les tracks de l'album
	url := fmt.Sprintf("https://api.deezer.com/album/%d/tracks", albumID)
	if err := fetchDeezerData(url, &response); err != nil {
		log.Printf("Erreur fetch tracks pour l'album %d: %v", albumID, err)
		return
	}

	// Insérer les tracks dans la base de données
	for _, track := range response.Data {
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

func main() {
	dsn := fmt.Sprintf("host=%s dbname=%s user=%s password=%s sslmode=require", DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Erreur connexion DB:", err)
	}
	defer db.Close()

	for {
		log.Println("Début de la mise à jour de la base de données...")
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
		time.Sleep(30 * time.Second)

	}
}
