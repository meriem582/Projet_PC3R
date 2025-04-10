import React, { useState } from "react";
import axios from "axios";

function Search({ onAddFavorite }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const search = async () => {
    if (!query) return;
    const res = await axios.get(`/api/search?q=${query}`);
    setResults(res.data.data);
  };

  const togglePlay = (previewUrl) => {
    if (currentTrack === previewUrl) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(previewUrl);
      setIsPlaying(true);
    }
  };

  return (
    <div>
      <h2>Recherche Deezer</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={search}>Rechercher</button>

      <ul>
        {results.map((track) => (
          <li key={track.id}>
            {track.title} - {track.artist.name}
            <button onClick={() => onAddFavorite(track)}>❤️</button>
            <a
              href={track.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: "10px" }}
            >
              🎵 Écouter sur Deezer
            </a>
            {track.preview && (
              <button
                onClick={() => togglePlay(track.preview)}
                style={{ marginLeft: "10px" }}
              >
                {currentTrack === track.preview && isPlaying
                  ? "⏸️ Pause"
                  : "▶️ Écouter un extrait"}
              </button>
            )}
          </li>
        ))}
      </ul>

      {currentTrack && isPlaying && (
        <audio controls autoPlay key={currentTrack}>
          <source src={currentTrack} type="audio/mpeg" />
          Votre navigateur ne supporte pas l'élément audio.
        </audio>
      )}
    </div>
  );
}

export default Search;
