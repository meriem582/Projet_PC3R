import React, { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("artist");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, searchType);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`search-container ${isFocused ? 'focused' : ''}`}>
      <div className="search-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher musique, artistes ou albums..."
            className="search-input"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          
          <div className="search-type-selector">
            <button
              type="button"
              className={`type-option ${searchType === 'artist' ? 'active' : ''}`}
              onClick={() => setSearchType('artist')}
            >
              <span className="type-icon">🎤</span>
              <span className="type-label">Artistes</span>
            </button>
            
            <div className="divider"></div>
            
            <button
              type="button"
              className={`type-option ${searchType === 'track' ? 'active' : ''}`}
              onClick={() => setSearchType('track')}
            >
              <span className="type-icon">🎵</span>
              <span className="type-label">Titres</span>
            </button>
            
            <div className="divider"></div>
            
            <button
              type="button"
              className={`type-option ${searchType === 'album' ? 'active' : ''}`}
              onClick={() => setSearchType('album')}
            >
              <span className="type-icon">💿</span>
              <span className="type-label">Albums</span>
            </button>
          </div>
        </div>
        
        <button type="submit" className="search-submit">
          <svg width="20" height="20" viewBox="0 0 24 24" className="search-icon">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" 
                  stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M21 21L16.65 16.65" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </form>
  );
}

export default SearchBar;