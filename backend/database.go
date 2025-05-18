package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var (
	DB_HOST     = os.Getenv("DB_HOST")
	DB_NAME     = os.Getenv("DB_NAME")
	DB_USER     = os.Getenv("DB_USER")
	DB_PASSWORD = os.Getenv("DB_PASSWORD")
)

func InitDB() *sql.DB {
	dsn := fmt.Sprintf("host=%s dbname=%s user=%s password=%s sslmode=require", DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Erreur lors de la connexion à la base de données : %v", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatalf("Base de données inaccessible : %v", err)
	}

	log.Println("Connexion à la base de données réussie.")
	return db
}
