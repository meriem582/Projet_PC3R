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
	DB_HOST     = "dpg-d0jfc0umcj7s73fur7ig-a.oregon-postgres.render.com"
	DB_NAME     = "meryouzik_bdd"
	DB_USER     = "admin"
	DB_PASSWORD = "mXXOwM0aUIePbdj2Y6FzWvJNvOXmkXuw"
)

type Genre struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Album struct {
	ID     int    `json:"id"`
	Title  string `json:"title"`
	Link   string `json:"link"`
	Artist struct {
		ID int `json:"id"`
	} `json:"artist"`
}

type Artist struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Link    string `json:"link"`
	Picture string `json:"picture"`
}

type Chart struct {
	ID       int    `json:"id"`
	Title    string `json:"title"`
	Link     string `json:"link"`
	Rank     int    `json:"rank"`
	Duration int    `json:"duration"`
	Artist   struct {
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
	ID       int    `json:"id"`
	Title    string `json:"title"`
	Link     string `json:"link"`
	Rank     int    `json:"rank"`
	Duration int    `json:"duration"`
	Album    struct {
		ID int `json:"id"`
	} `json:"album"`
	Artist struct {
		ID int `json:"id"`
	} `json:"artist"`
}

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

	resp.Body = io.NopCloser(bytes.NewReader(body))
	return json.NewDecoder(resp.Body).Decode(target)
}

func insertGenre(db *sql.DB, genre Genre) {
	query := `INSERT INTO "genres" (id_genre, name) VALUES ($1, $2) ON CONFLICT (id_genre) DO NOTHING;`
	_, err := db.Exec(query, genre.ID, genre.Name)
	if err != nil {
		log.Printf("Erreur insertion genre %d: %v", genre.ID, err)
	}
}

func insertChart(db *sql.DB, chart Chart) {
	query := `INSERT INTO "charts" (id_chart, title, link, id_artist, id_album, nom_artist, picture_artist, link_artist, nom_album, rank, duration) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
	          ON CONFLICT (id_chart) DO NOTHING;`
	_, err := db.Exec(query, chart.ID, chart.Title, chart.Link, chart.Artist.ID, chart.Album.ID,
		chart.Artist.Name, chart.Artist.Picture, chart.Artist.Link, chart.Album.Title, chart.Rank, chart.Duration)
	if err != nil {
		log.Printf("Erreur insertion chart %d: %v", chart.ID, err)
	}
}

func insertAlbum(db *sql.DB, album Album) {
	query := `INSERT INTO "albums" (id_album, title, link, id_artist) 
	          VALUES ($1, $2, $3, $4) 
	          ON CONFLICT (id_album) DO NOTHING;`
	_, err := db.Exec(query, album.ID, album.Title, album.Link, album.Artist.ID)
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

func insertTrack(db *sql.DB, track Track) {
	query := `INSERT INTO "tracks" (id_track, title, link, id_album, id_artist, rank ,duration) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7) 
	          ON CONFLICT (id_track) DO NOTHING;`
	_, err := db.Exec(query, track.ID, track.Title, track.Link, track.Album.ID, track.Artist.ID, track.Rank, track.Duration)
	if err != nil {
		log.Printf("Erreur insertion track %d: %v", track.ID, err)
	}
}

func insertGenreAlbum(db *sql.DB, genreID int, albumID int) {
	query := `INSERT INTO "album_genres" (id_genre, id_album) 
	          VALUES ($1, $2) 
	          ON CONFLICT (id_genre, id_album) DO NOTHING;`
	_, err := db.Exec(query, genreID, albumID)
	if err != nil {
		log.Printf("Erreur insertion genre_album %d: %v", genreID, err)
	}
}

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

	url := fmt.Sprintf("https://api.deezer.com/search/album?q=genre:\"%s\"", strings.ReplaceAll(genreNameEncoded, " ", "%20"))

	if err := fetchDeezerData(url, &response); err != nil {
		log.Println("Erreur fetch albums:", err)
		return
	}

	for _, album := range response.Data {
		insertAlbum(db, album)
		insertGenreAlbum(db, genreID, album.ID)
	}
}

func fetchAndInsertArtistsByAlbum(db *sql.DB, artistID int) {
	var artist Artist

	url := fmt.Sprintf("https://api.deezer.com/artist/%d", artistID)

	if err := fetchDeezerData(url, &artist); err != nil {
		log.Printf("Erreur fetch artist %d: %v", artistID, err)
		return
	}

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

func fetchAndInsertTracksByAlbum(db *sql.DB, albumID int) {
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
		if track.Album.ID <= 0 {
			track.Album.ID = albumID
		}

		if track.Artist.ID <= 0 {
			var artistID int
			err := db.QueryRow(`SELECT id_artist FROM albums WHERE id_album = $1`, albumID).Scan(&artistID)
			if err == nil {
				track.Artist.ID = artistID
			} else {
				log.Printf("Impossible de trouver l'artiste pour l'album %d: %v", albumID, err)
				continue
			}
		}

		insertTrack(db, track)
	}
}

func fetchAndInsertTracksForAlbums(db *sql.DB) {
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
		fetchAndInsertTracksByAlbum(db, albumID)
	}

	if err := rows.Err(); err != nil {
		log.Fatal("Erreur itération sur les albums:", err)
	}
}

func clearAllChart(db *sql.DB) {
	_, err := db.Exec(fmt.Sprintf(`TRUNCATE TABLE charts RESTART IDENTITY CASCADE;`))
	if err != nil {
		log.Printf("Erreur lors du TRUNCATE charts: %v", err)
	} else {
		log.Printf("Table charts vidée.")
	}
}

func main() {
	dsn := fmt.Sprintf("host=%s dbname=%s user=%s password=%s sslmode=require", DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Erreur connexion DB:", err)
	}
	defer db.Close()

	clearAllChart(db)
	fetchAndInsertGenres(db)
	fetchAndInsertCharts(db)
	genres, err := fetchGenresFromDB(db)

	if err != nil {
		log.Fatal("Erreur récupération genres:", err)
	}

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
	fetchAndInsertTracksForAlbums(db)

	log.Println("fin de l'insertion de nouveau tuples.")

}
