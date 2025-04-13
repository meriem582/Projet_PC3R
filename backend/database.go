package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

const (
	DB_HOST     = "dpg-cvtuc3q4d50c73aodl90-a.oregon-postgres.render.com"
	DB_NAME     = "music_app_l1yd"
	DB_USER     = "admin"
	DB_PASSWORD = "X9KFl31tkZrhQDHFuuYWeG80eoB84S1O"
)

func InitDB() *sql.DB {
	dsn := fmt.Sprintf("host=%s dbname=%s user=%s password=%s sslmode=require", DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Erreur lors de la connexion à la base de données : %v", err)
	}

	// Test de connexion
	if err := db.Ping(); err != nil {
		log.Fatalf("Base de données inaccessible : %v", err)
	}

	log.Println("Connexion à la base de données réussie.")
	return db
}
