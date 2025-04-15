import React, { useState } from 'react'

// Dans SearchBar.jsx
function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("artist"); // "artist", "track", "album"

  const handleSubmit = (e) => {
      e.preventDefault();
      if (query.trim()) {
          onSearch(query, searchType);
      }
  };

  return (
      <form onSubmit={handleSubmit} className="search-bar">
          <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
          />
          <select 
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
          >
              <option value="artist">Artiste</option>
              <option value="track">Titre</option>
              <option value="album">Album</option>
          </select>
          <button type="submit">Rechercher</button>
      </form>
  );
}

export default SearchBar
