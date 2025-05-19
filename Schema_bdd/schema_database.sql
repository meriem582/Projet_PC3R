CREATE TABLE up_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  confirmation_token CHARACTER VARYING(255),
  confirmation_expiry TIMESTAMP,
  confirmed BOOLEAN
);

CREATE TABLE tracks (
  id SERIAL PRIMARY KEY,
  id_track BIGINT NOT NULL,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  id_album BIGINT NOT NULL,
  id_artist BIGINT NOT NULL,
  duration INTEGER,
  rank INTEGER
);

CREATE TABLE responses (
  id SERIAL PRIMARY KEY,
  contenu TEXT NOT NULL,
  date_response TIMESTAMP,
  id_comment BIGINT NOT NULL,
  id_user BIGINT NOT NULL
);

CREATE TABLE likes (
  id_like SERIAL PRIMARY KEY,
  id_user BIGINT NOT NULL,
  id_track BIGINT NOT NULL
);

CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  id_genre BIGINT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE commentaires (
  contenu TEXT NOT NULL,
  id SERIAL PRIMARY KEY,
  id_user BIGINT NOT NULL,
  id_track BIGINT NOT NULL,
  date_commentaire TIMESTAMP
);

CREATE TABLE charts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  id_artist BIGINT NOT NULL,
  id_album BIGINT NOT NULL,
  id_chart BIGINT NOT NULL,
  nom_artist TEXT NOT NULL,
  picture_artist TEXT NOT NULL,
  link_artist TEXT NOT NULL,
  nom_album TEXT NOT NULL,
  duration INTEGER,
  rank INTEGER
);

CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  id_artist BIGINT NOT NULL,
  link TEXT NOT NULL,
  picture TEXT NOT NULL
);

CREATE TABLE album_genres (
  id SERIAL PRIMARY KEY,
  id_genre BIGINT NOT NULL,
  id_album BIGINT NOT NULL
);

CREATE TABLE albums (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  release_date TIMESTAMP,
  id_album BIGINT NOT NULL,
  id_artist BIGINT NOT NULL
);

-- Contraintes d’unicité pour éviter les doublons
ALTER TABLE tracks ADD CONSTRAINT track_unique UNIQUE (id_track);
ALTER TABLE genres ADD CONSTRAINT genre_unique UNIQUE (id_genre);
ALTER TABLE charts ADD CONSTRAINT chart_unique UNIQUE (id_chart);
ALTER TABLE artists ADD CONSTRAINT artist_unique UNIQUE (id_artist);
ALTER TABLE albums ADD CONSTRAINT album_unique UNIQUE (id_album);
ALTER TABLE album_genres ADD CONSTRAINT unique_genre_album_pair UNIQUE (id_genre, id_album);
