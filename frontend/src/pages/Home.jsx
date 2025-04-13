import React, { useState, useRef, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import './Home.css';

function Home() {
  const [results, setResults] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleSearch = async (query) => {
    if (!query) return;
    const response = await axios.get(`/search?q=${encodeURIComponent(query)}`);
    setResults(response.data);
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const togglePlay = (previewUrl) => {
    if (currentTrack === previewUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(previewUrl);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(() => {}); // silence error if autoplay is blocked
    }
  }, [currentTrack]);

  return (
    <div className="page-wrapper">
      <div className="content-wrapper">
        <SearchBar onSearch={handleSearch} />

        <div className="results">
          {results.map((artist, index) => (
            artist.track && (
              <div className="watch-card" key={`${artist.id}-${index}`}>
                <div className="watch-card-header">
                  <div>
                    <div className="artist-name">{artist.name}</div>
                  </div>
                </div>
                <div className="track-info">
                  Écoutez le dernier titre de <strong>{artist.name}</strong> : <em>"{artist.track.title}"</em>
                  <br />
                  <a
                    href={artist.track.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="deezer-link"
                  >
                    🎧 Écouter sur Deezer
                  </a>
                </div>

                <div
                  className={`image-container ${currentTrack === artist.track.preview ? 'active' : ''}`}
                  onMouseEnter={() => setCurrentTrack(artist.track.preview)}
                  onMouseLeave={() => !isPlaying && setCurrentTrack(null)}
                >
                  <img src={artist.picture} alt={artist.name} className="artist-image" />

                  {artist.track.preview && (
                    <>
                      <button
                        className="custom-play-button"
                        onClick={() => togglePlay(artist.track.preview)}
                      >
                        {currentTrack === artist.track.preview && isPlaying ? '❚❚' : '▶'}
                      </button>

                      {currentTrack === artist.track.preview && (
                        <div className="audio-bar">
                          <audio
                            ref={audioRef}
                            src={currentTrack}
                            controls
                            onPause={() => setIsPlaying(false)}
                            onPlay={() => setIsPlaying(true)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
