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
  const [commentInputs, setCommentInputs] = useState({});
  const [activeCommentTrack, setActiveCommentTrack] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");

  // Fonction pour générer un ID temporaire si nécessaire
  const generateTempId = () => Math.floor(Math.random() * 1000000);

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
      setComments(prev => ({ ...prev, [trackId]: response.data || [] }));
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires :', error);
      setComments(prev => ({ ...prev, [trackId]: [] }));
    }
  };

  const handleAddComment = async (trackId) => {
    const commentText = commentInputs[trackId];
    if (!user || !commentText?.trim()) return;
    
    try {
      await axios.post('/comment', {
        id_user: user.id,
        id_track: trackId, // Bien utiliser l'ID de la track
        contenu: commentText,
      });
      
      setCommentInputs(prev => ({
        ...prev,
        [trackId]: ""
      }));
      
      await fetchComments(trackId);
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire :", error.response?.data || error.message);
    }
  };

  const handleDeleteComment = async (commentId, trackId) => {
    if (!user) return;
    
    try {
      await axios.delete('/comment/delete', {
        data: {
          id: commentId,
          id_user: user.id
        }
      });
      await fetchComments(trackId);
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire :", error);
    }
  };

  const handleUpdateComment = async (trackId, commentId) => {
    if (!user || !editedCommentText.trim()) return;
  
    try {
      await axios.put('/comment/update', {
        id: commentId,
        id_user: user.id,
        contenu: editedCommentText,
      });
      
      setEditingCommentId(null);
      setEditedCommentText("");
      await fetchComments(trackId);
    } catch (error) {
      console.error("Erreur lors de la modification du commentaire :", error);
      alert("Vous ne pouvez modifier que vos propres commentaires !");
    }
  };

  // Composant ResponseSection
  const ResponseSection = ({ comment, trackId }) => {
    const [responses, setResponses] = useState([]);
    const [showResponses, setShowResponses] = useState(true);
    const [responseInputs, setResponseInputs] = useState({});
    const [isLoadingResponses, setIsLoadingResponses] = useState(false);
    const [responseCount, setResponseCount] = useState(0);
    const [editingResponseId, setEditingResponseId] = useState(null);
    const [editedResponseText, setEditedResponseText] = useState("");

    const fetchResponseCount = async () => {
      try {
        const response = await axios.get(`/response/count?comment_id=${comment.id}`);
        setResponseCount(response.data?.count || 0);
      } catch (error) {
        console.error('Erreur lors du comptage des réponses:', error);
      }
    };

    const loadResponses = async () => {
      setIsLoadingResponses(true);
      try {
        const response = await axios.get(`/response/get?comment_id=${comment.id}`);
        const res = response.data || [];
        setResponses(res);
        setResponseCount(res.length);
      } catch (error) {
        console.error("Erreur lors du chargement des réponses:", error);
        setResponses([]);
        setResponseCount(0);
      } finally {
        setIsLoadingResponses(false);
      }
    };

    const handleAddResponse = async () => {
      const responseText = responseInputs[comment.id];
      if (!user || !responseText?.trim()) return;
      
      try {
        await axios.post('/response/add', {
          id_user: user.id,
          id_comment: comment.id,
          contenu: responseText,
        });
        
        setResponseInputs(prev => ({
          ...prev,
          [comment.id]: ""
        }));
        
        await loadResponses();
      } catch (error) {
        console.error("Erreur lors de l'ajout de la réponse:", error);
      }
    };

    const handleUpdateResponse = async (responseId) => {
      if (!user || !editedResponseText.trim()) return;
  
      try {
        await axios.put('/response/update', {
          id: responseId,
          id_user: user.id,
          contenu: editedResponseText,
        });
        
        setEditingResponseId(null);
        setEditedResponseText("");
        await loadResponses();
      } catch (error) {
        console.error("Erreur lors de la modification de la réponse:", error);
      }
    };

    useEffect(() => {
      fetchResponseCount();
      if (showResponses) {
        loadResponses();
      }
    }, [comment.id, showResponses]);

    return (
      <div className="responses-section">
        <button 
          className="toggle-responses-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowResponses(!showResponses);
          }}
        >
          {showResponses ? 'Masquer les réponses' : `Afficher les réponses (${responseCount})`}
        </button>

        {showResponses && (
          <div className="responses-container" onClick={(e) => e.stopPropagation()}>
            {isLoadingResponses ? (
              <div>Chargement des réponses...</div>
            ) : (
              <>
                {responses.length > 0 ? (
                  responses.map(response => (
                    <div key={response.id} className="response">
                      <div className="response-header">
                        <strong>{response.user.name}</strong>
                        <span className="response-date">
                          {new Date(response.date).toLocaleString()}
                        </span>
                        {user?.id === response.user.id && (
                          <div className="response-actions">
                            {editingResponseId === response.id ? (
                              <>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateResponse(response.id);
                                  }}
                                  className="save-edit-btn"
                                >
                                  ✔ Enregistrer
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingResponseId(null);
                                  }}
                                  className="cancel-edit-btn"
                                >
                                  ✖ Annuler
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingResponseId(response.id);
                                    setEditedResponseText(response.content);
                                  }}
                                  className="edit-response-btn"
                                >
                                  ✏ Modifier
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Supprimer cette réponse ?")) {
                                      axios.delete('/response/delete', {
                                        data: {
                                          id: response.id,
                                          id_user: user.id
                                        }
                                      }).then(() => loadResponses());
                                    }
                                  }}
                                  className="delete-response-btn"
                                >
                                  🗑 Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {editingResponseId === response.id ? (
                        <textarea
                          value={editedResponseText}
                          onChange={(e) => setEditedResponseText(e.target.value)}
                          className="edit-response-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="response-content">{response.content}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-responses">Aucune réponse pour le moment</div>
                )}

                {user && (
                  <div className="add-response">
                    <textarea
                      value={responseInputs[comment.id] || ""}
                      onChange={(e) => setResponseInputs({
                        ...responseInputs,
                        [comment.id]: e.target.value
                      })}
                      placeholder="Répondre à ce commentaire..."
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddResponse();
                      }}
                      disabled={!responseInputs[comment.id]?.trim()}
                    >
                      Envoyer la réponse
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleSearch = async (query, searchType = "artist") => {
    if (!query) return;
    try {
        const response = await axios.get(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
        
        // Normaliser les résultats
        const normalizedResults = response.data.map(item => ({
            ...item,
            track: {
                ...item.track,
                id: item.track?.id || generateTempId(),
                artistId: item.id
            },
            album: item.album || null // Ajouter les infos de l'album si disponibles
        })).filter(item => item.track);

        setResults(normalizedResults);

        // Charger les likes pour chaque track
        const likePromises = normalizedResults.map(async (item) => {
            const info = await fetchLikeInfo(item.track.id);
            return { trackId: item.track.id, info };
        });
        
        const resultsWithLikes = await Promise.all(likePromises);
        const newLikesData = {};
        resultsWithLikes.forEach(({ trackId, info }) => newLikesData[trackId] = info);
        setLikesData(prev => ({ ...prev, ...newLikesData }));
    } catch (error) {
        console.error('Erreur lors de la recherche :', error);
    }
};

  // Rendu des cartes
  const renderCard = (item, index, isChart = false) => {
    // Structure cohérente pour les tracks
    const track = isChart
      ? {
          id: item.id_chart, // ID de la track pour les charts
          title: item.title,
          preview: item.preview,
          link: item.link,
          artistId: item.id_artist,
          artistName: item.nom_artist,
          picture: item.picture_artist
        }
      : {
          id: item.track.id, // ID de la track pour les résultats de recherche
          title: item.track.title,
          preview: item.track.preview,
          link: item.track.link,
          artistId: item.id,
          artistName: item.name,
          picture: item.picture
        };

    const likeInfo = likesData[track.id] || { like_count: 0, user_liked: false };
    const trackComments = comments[track.id] || [];

    return (
      <div className="watch-card" key={`${track.id}-${index}`}>
        <div className="watch-card-header">
          <div className="artist-name">{track.artistName}</div>
        </div>
        
          <div className="track-info">
              {item.album && (
                  <div className="album-info">
                      Album: <strong>{item.album.title}</strong>
                  </div>
              )}
              Écoutez le titre <em>"{track.title}"</em> de <strong>{track.artistName}</strong>
              <br />
              <a href={track.link} target="_blank" rel="noopener noreferrer" className="deezer-link">
                  🎧 Écouter sur Deezer
              </a>
          </div>

        <div
          className={`image-container ${currentTrack === track.preview ? 'active' : ''}`}
          onMouseEnter={() => setCurrentTrack(track.preview)}
          onMouseLeave={() => !isPlaying && setCurrentTrack(null)}
        >
          <img src={track.picture} alt={track.artistName} className="artist-image" />

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
                        <div className="comment-actions">
                          {editingCommentId === comment.id ? (
                            <>
                              <button 
                                onClick={() => handleUpdateComment(track.id, comment.id)}
                                className="save-edit-btn"
                              >
                                ✔ Enregistrer
                              </button>
                              <button 
                                onClick={() => setEditingCommentId(null)}
                                className="cancel-edit-btn"
                              >
                                ✖ Annuler
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditedCommentText(comment.content);
                                }}
                                className="edit-comment-btn"
                              >
                                ✏ Modifier
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm("Supprimer ce commentaire ?")) {
                                    handleDeleteComment(comment.id, track.id);
                                  }
                                }}
                                className="delete-comment-btn"
                              >
                                🗑 Supprimer
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <textarea
                        value={editedCommentText}
                        onChange={(e) => setEditedCommentText(e.target.value)}
                        className="edit-comment-input"
                      />
                    ) : (
                      <div className="comment-content">{comment.content}</div>
                    )}

                    <ResponseSection comment={comment} trackId={track.id} />
                  </div>
                ))}
              </div>

              {user && (
                <div className="add-comment">
                  <textarea
                    value={commentInputs[track.id] || ""}
                    onChange={(e) => setCommentInputs({
                      ...commentInputs,
                      [track.id]: e.target.value
                    })}
                    placeholder="Ajouter un commentaire..."
                  />
                  <button 
                    onClick={() => handleAddComment(track.id)}
                    disabled={!commentInputs[track.id]?.trim()}
                  >
                    Envoyer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Chargement initial des données
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const response = await axios.get('/charts');
        const data = Array.isArray(response.data) ? response.data : [];
        setCharts(data);

        const likePromises = data.map(async (item) => {
          const info = await fetchLikeInfo(item.id_chart);
          return { trackId: item.id_chart, info };
        });
        
        const chartsWithLikes = await Promise.all(likePromises);
        const newLikesData = {};
        chartsWithLikes.forEach(({ trackId, info }) => newLikesData[trackId] = info);
        setLikesData(prev => ({ ...prev, ...newLikesData }));
      } catch (error) {
        console.error("Erreur lors du chargement des charts :", error);
      }
    };

    const fetchRandomTracks = async (page = 1) => {
      try {
        const response = await axios.get(`/tracks?page=${page}`);
        const data = response.data.map(item => ({
          ...item,
          track: {
            id: item.track?.id || generateTempId(),
            title: item.track?.title,
            preview: item.track?.preview,
            link: item.track?.link
          }
        }));
        
        if (page === 1) {
          setTracks(data);
        } else {
          setTracks(prev => [...prev, ...data]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des morceaux :", error);
      }
    };

    fetchCharts();
    fetchRandomTracks();
  }, []);

  // Gestion de l'audio
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(error => {
        console.error("Erreur de lecture audio :", error);
        setIsPlaying(false);
      });
    }
  }, [currentTrack, isPlaying]);

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
              {results.map((item, index) => renderCard(item, index))}
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
              <h2>🎶 Morceaux recommandés</h2>
              <div className="track-list">
                {tracks.map((track, index) => renderCard(track, index))}
              </div>
              <button
                className="load-more-button"
                onClick={() => {
                  const nextPage = trackPage + 1;
                  setTrackPage(nextPage);
                  axios.get(`/tracks?page=${nextPage}`)
                    .then(response => {
                      setTracks(prev => [...prev, ...response.data]);
                    })
                    .catch(error => {
                      console.error("Erreur lors du chargement supplémentaire :", error);
                    });
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