import React, { useState } from "react";
import axios from "axios";

function SearchDeezer() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query) return;
    
    try {
      const response = await axios.get(`http://localhost:8080/search?q=${query}`);
      setResults(response.data.data);  
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Recherche Deezer</h2>
      <input
        type="text"
        placeholder="Entrez un artiste..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "8px", width: "300px", marginRight: "10px" }}
      />
      <button onClick={handleSearch} style={{ padding: "8px 12px" }}>Rechercher</button>

      <ul style={{ marginTop: "20px", listStyle: "none", padding: 0 }}>
        {results.map((track) => (
          <li key={track.id} style={{ marginBottom: "10px" }}>
            <img src={track.album.cover_small} alt={track.title} style={{ borderRadius: "5px" }} />
            <p>{track.title} - {track.artist.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchDeezer;
