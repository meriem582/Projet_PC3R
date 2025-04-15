import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import './Home.css';

function Home() {
  const { user } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [charts, setCharts] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [trackPage, setTrackPage] = useState(1);
  const [likesData, setLikesData] = useState({});
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [activeCommentTrack, setActiveCommentTrack] = useState(null);

  // Fonctions pour les likes
  const fetchLikeInfo = async (trackId) => {
    if (!user) return { like_count: 0, user_liked: false };
    
    try {
      const response = await axios.get(`/likes?track_id=${trackId}&user_id=${user.id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des likes :', error);
      return { like_count: 0, user_liked: false };
    }
  };

  const toggleLike = async (trackId) => {
    if (!user) {
      alert('Veuillez vous connecter pour liker des morceaux');
      return;
    }

    const current = likesData[trackId] || { like_count: 0, user_liked: false };
    try {
      if (!current.user_liked) {
        await axios.post('/like', { id_user: user.id, id_track: trackId });
      } else {
        await axios.delete('/unlike', { data: { id_user: user.id, id_track: trackId } });
      }
      const updated = await fetchLikeInfo(trackId);
      setLikesData(prev => ({ ...prev, [trackId]: updated }));
    } catch (error) {
      console.error("Erreur lors du like/dislike :", error);
    }
  };

  // Fonctions pour les commentaires
  const fetchComments = async (trackId) => {
    try {
      const response = await axios.get(`/comments?track_id=${trackId}`);
      setComments(prev => ({ ...prev, [trackId]: response.data }));
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires :', error);
    }
  };

  const handleAddComment = async (trackId) => {
    if (!user || !newComment.trim()) return;
    
    try {
      await axios.post('/comment', {
        id_user: user.id,
        id_track: trackId,
        contenu: newComment,
      });
      setNewComment("");
      await fetchComments(trackId);
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire :", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    
    try {
      await axios.delete('/comment/delete', {
        data: {
          id_user: user.id,
          id_comment: commentId,
        },
      });
      if (activeCommentTrack) {
        await fetchComments(activeCommentTrack);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire :", error);
    }
  };

  // Fonctions pour la lecture audio
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

  // Fonction de recherche
  const handleSearch = async (query) => {
    if (!query) return;
    try {
      const response = await axios.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
      setCurrentTrack(null);
      setIsPlaying(false);

      const likePromises = response.data.map(async (item) => {
        const trackId = item.track.id || item.id;
        const info = await fetchLikeInfo(trackId);
        return { trackId, info };
      });
      const resultsWithLikes = await Promise.all(likePromises);
      const newLikesData = {};
      resultsWithLikes.forEach(({ trackId, info }) => newLikesData[trackId] = info);
      setLikesData(prev => ({ ...prev, ...newLikesData }));
    } catch (error) {
      console.error('Erreur lors de la recherche :', error);
    }
  };

  const fetchRandomTracks = async (page = 1) => {
    try {
      const response = await axios.get(`/tracks?page=${page}`);
      if (page === 1) {
        setTracks(response.data);
      } else {
        setTracks(prev => [...prev, ...response.data]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des morceaux aléatoires :", error);
    }
  };
  

  // Effets
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrack]);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const response = await axios.get('/charts');
        const data = Array.isArray(response.data) ? response.data : [];
        setCharts(data);

        const likePromises = data.map(async (item) => {
          const trackId = item.id_chart;
          const info = await fetchLikeInfo(trackId);
          return { trackId, info };
        });
        const chartsWithLikes = await Promise.all(likePromises);
        const newLikesData = {};
        chartsWithLikes.forEach(({ trackId, info }) => newLikesData[trackId] = info);
        setLikesData(prev => ({ ...prev, ...newLikesData }));
      } catch (error) {
        console.error("Erreur lors du chargement des charts :", error);
        setCharts([]);
      }
    };
    fetchCharts();
    fetchRandomTracks(); // Charger les premières tracks aléatoires
  }, []);

  // Rendu des cartes
  const renderCard = (item, index, isChart = false) => {
    const name = isChart ? item.nom_artist : item.name;
    const track = isChart
      ? { title: item.title, preview: item.preview, link: item.link, id: item.id_chart }
      : { ...item.track, id: item.track.id || item.id };
    const picture = isChart ? item.picture_artist : item.picture;
    const likeInfo = likesData[track.id] || { like_count: 0, user_liked: false };
    const trackComments = comments[track.id] || [];

    return track ? (
      <div className="watch-card" key={`${track.id}-${index}`}>
        <div className="watch-card-header">
          <div>
            <div className="artist-name">{name}</div>
          </div>
        </div>
        <div className="track-info">
          Écoutez le dernier titre de <strong>{name}</strong> : <em>"{track.title}"</em>
          <br />
          <a
            href={track.link}
            target="_blank"
            rel="noopener noreferrer"
            className="deezer-link"
          >
            🎧 Écouter sur Deezer
          </a>
        </div>

        <div
          className={`image-container ${currentTrack === track.preview ? 'active' : ''}`}
          onMouseEnter={() => setCurrentTrack(track.preview)}
          onMouseLeave={() => !isPlaying && setCurrentTrack(null)}
        >
          <img src={picture} alt={name} className="artist-image" />

          {track.preview && (
            <>
              <button
                className="custom-play-button"
                onClick={() => togglePlay(track.preview)}
              >
                {currentTrack === track.preview && isPlaying ? '❚❚' : '▶'}
              </button>

              {currentTrack === track.preview && (
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

        <div className="like-section">
          <div className="like-count">❤️ {likeInfo.like_count}</div>
          <button
            className={`like-button ${likeInfo.user_liked ? 'liked' : ''}`}
            onClick={() => toggleLike(track.id)}
          >
            {likeInfo.user_liked ? '💔 Retirer le like' : '❤️ Liker'}
          </button>
        </div>

        <div className="comments-section">
          <button 
            className="toggle-comments-btn"
            onClick={() => {
              setActiveCommentTrack(activeCommentTrack === track.id ? null : track.id);
              if (activeCommentTrack !== track.id && !comments[track.id]) {
                fetchComments(track.id);
              }
            }}
          >
            {activeCommentTrack === track.id ? 'Masquer les commentaires' : 'Afficher les commentaires'}
          </button>

          {activeCommentTrack === track.id && (
            <div className="comments-container">
              <div className="comments-list">
                {trackComments.map(comment => (
                  <div key={comment.id} className="comment">
                    <div className="comment-header">
                      <strong>{comment.user.name}</strong>
                      <span className="comment-date">
                        {new Date(comment.date).toLocaleString()}
                      </span>
                      {user?.id === comment.user.id && (
                        <button 
                          className="delete-comment-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                    <div className="comment-content">{comment.content}</div>
                  </div>
                ))}
              </div>

              {user && (
                <div className="add-comment">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                  />
                  <button 
                    onClick={() => handleAddComment(track.id)}
                    disabled={!newComment.trim()}
                  >
                    Envoyer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ) : null;
  };

  return (
    <div className="page-wrapper">
      <div className="content-wrapper">
        <SearchBar onSearch={handleSearch} />

        {results.length > 0 ? (
          <>
            <button className="back-button" onClick={() => setResults([])}>
              ⬅ Retour aux Charts
            </button>

            <div className="results">
              {results.map((artist, index) =>
                artist.track ? renderCard(artist, index) : null
              )}
            </div>
          </>
        ) : (
          <>
            <div className="charts">
              <h2>🎵 Top Charts</h2>
              <div className="chart-list">
                {charts.map((chart, index) => renderCard(chart, index, true))}
              </div>
            </div>

            <div className="random-tracks">
              <h2>🎶 Autres morceaux recommandés</h2>
              <div className="track-list">
                {tracks.map((track, index) => renderCard(track, index))}
              </div>
              <button
                className="load-more-button"
                onClick={() => {
                  const nextPage = trackPage + 1;
                  setTrackPage(nextPage);
                  fetchRandomTracks(nextPage);
                }}
              >
                ➕ Charger plus
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;