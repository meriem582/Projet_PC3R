import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import SearchBar from './SearchBar';
import axios from 'axios';
import './Home.css';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { user, logout } = useContext(AuthContext); 
  const [results, setResults] = useState([]);
  const [charts, setCharts] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [trackPage, setTrackPage] = useState(1);
  const [likesData, setLikesData] = useState({});
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [activeCommentTrack, setActiveCommentTrack] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [showNoResultsMessage, setShowNoResultsMessage] = useState(false);
  const navigate = useNavigate();

  const generateTempId = () => Math.floor(Math.random() * 1000000);

  const fetchLikeInfo = async (trackId) => {
    if (!user) return { like_count: 0, user_liked: false };
    
    try {
      const response = await axios.get(`https://meryouzik-backend.onrender.com/likes?track_id=${trackId}&user_id=${user.id}`);
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
        await axios.post('https://meryouzik-backend.onrender.com/like', { id_user: user.id, id_track: trackId });
      } else {
        await axios.delete('https://meryouzik-backend.onrender.com/unlike', { data: { id_user: user.id, id_track: trackId } });
      }
      const updated = await fetchLikeInfo(trackId);
      setLikesData(prev => ({ ...prev, [trackId]: updated }));
    } catch (error) {
      console.error("Erreur lors du like/dislike :", error);
    }
  };

  const fetchComments = async (trackId) => {
    try {
      const response = await axios.get(`https://meryouzik-backend.onrender.com/comments?track_id=${trackId}`);
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
      await axios.post('https://meryouzik-backend.onrender.com/comment', {
        id_user: user.id,
        id_track: trackId, 
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
      await axios.delete('https://meryouzik-backend.onrender.com/comment/delete', {
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
      await axios.put('https://meryouzik-backend.onrender.com/comment/update', {
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

  const ResponseSection = ({ comment, trackId }) => {
    const [responses, setResponses] = useState([]);
    const [showResponses, setShowResponses] = useState(false);
    const [responseInputs, setResponseInputs] = useState({});
    const [isLoadingResponses, setIsLoadingResponses] = useState(false);
    const [responseCount, setResponseCount] = useState(0);
    const [editingResponseId, setEditingResponseId] = useState(null);
    const [editedResponseText, setEditedResponseText] = useState("");

    const fetchResponseCount = async () => {
      try {
        const response = await axios.get(`https://meryouzik-backend.onrender.com/response/count?comment_id=${comment.id}`);
        setResponseCount(response.data?.count || 0);
      } catch (error) {
        console.error('Erreur lors du comptage des réponses:', error);
      }
    };

    const loadResponses = async () => {
      setIsLoadingResponses(true);
      try {
        const response = await axios.get(`https://meryouzik-backend.onrender.com/response/get?comment_id=${comment.id}`);
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
        await axios.post('https://meryouzik-backend.onrender.com/response/add', {
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
        await axios.put('https://meryouzik-backend.onrender.com/response/update', {
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
          {showResponses ? (
            <span>▼ Masquer les réponses</span>
          ) : (
            <span>▶ Afficher les réponses ({responseCount})</span>
          )}
        </button>

        {showResponses && (
          <div className="responses-container" onClick={(e) => e.stopPropagation()}>
            {isLoadingResponses ? (
              <div className="loading-spinner">Chargement...</div>
            ) : (
              <>
                {responses.length > 0 ? (
                  responses.map(response => (
                    <div key={response.id} className="response">
                      <div className="response-header">
                        <div className="response-user">
                          <span className="response-username">{response.user.name}</span>
                          <span className="response-date">
                            {new Date(response.date).toLocaleString()}
                          </span>
                        </div>
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
                                  Enregistrer
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingResponseId(null);
                                  }}
                                  className="cancel-edit-btn"
                                >
                                  Annuler
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
                                  Modifier
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Supprimer cette réponse ?")) {
                                      axios.delete('https://meryouzik-backend.onrender.com/response/delete', {
                                        data: {
                                          id: response.id,
                                          id_user: user.id
                                        }
                                      }).then(() => loadResponses());
                                    }
                                  }}
                                  className="delete-response-btn"
                                >
                                  Supprimer
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
                      className="send-response-btn"
                    >
                      Envoyer
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
    setSearchPerformed(true);
    setShowNoResultsMessage(true); 
    
    if (!query) {
        setResults([]);
        return;
    }

    try {
        const response = await axios.get(`https://meryouzik-backend.onrender.com/search?q=${encodeURIComponent(query)}&type=${searchType}`);
        
       if (!response.data?.results?.length) {
            setResults([]);
            const timer = setTimeout(() => {
                setShowNoResultsMessage(false);
            }, 30000);
            return () => clearTimeout(timer); 
        }

        const normalizedResults = response.data.results.map(item => ({
            ...item,
            track: {
                ...item.track,
                id: item.track?.id || generateTempId(),
                artistId: item.id
            },
            album: item.album || null
        })).filter(item => item.track);

        setResults(normalizedResults);

        const likePromises = normalizedResults.map(async (item) => {
            const info = await fetchLikeInfo(item.track.id);
            return { trackId: item.track.id, info };
        });
        
        const resultsWithLikes = await Promise.all(likePromises);
        const newLikesData = {};
        resultsWithLikes.forEach(({ trackId, info }) => newLikesData[trackId] = info);
        setLikesData(prev => ({ ...prev, ...newLikesData }));

        setShowNoResultsMessage(false);
    } catch (error) {
        setResults([]);
        const timer = setTimeout(() => {
            setShowNoResultsMessage(false);
        }, 30000);
        return () => clearTimeout(timer);
    }
  };

  const renderCard = (item, index, isChart = false) => {
    const track = isChart
      ? {
          id: item.id_chart, 
          title: item.title,
          rank: item.rank,
          duration: item.duration,
          link : item.link,
          artistId: item.id_artist,
          artistName: item.nom_artist,
          picture: item.picture_artist
        }
      : {
          id: item.track.id,
          title: item.track.title,
          rank: item.track.rank,
          duration: item.track.duration,
          link: item.track.link,
          artistId: item.id,
          artistName: item.name,
          picture: item.picture
        };

    const likeInfo = likesData[track.id] || { like_count: 0, user_liked: false };
    const trackComments = comments[track.id] || [];

     const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="music-card" key={`${track.id}-${index}`}>
        <div className="card-header">
          <div className="artist-info">
            <h3 className="artist-name">{track.artistName}</h3>
            <p className="track-title">{track.title}</p>
            <div className="track-meta">
              {track.rank && <p className="track-rank">Rank: {track.rank}</p>}
              <br />
              {track.duration && <p className="track-duration">Duration: {formatDuration(track.duration)}</p>}
            </div>
          </div>
        </div>
        
        <div className="card-content">
          <div className="track-image-container">
            <img src={track.picture} alt={track.artistName} className="artist-image" />
          </div>

          {item.album && (
            <div className="album-info">
              <span className="detail-label">Album:</span> {item.album.title}
            </div>
          )}

          {track.link && (
            <div className="deezer-link-container">
              <a 
                href={track.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="deezer-link"
              >
                Écouter sur Deezer
              </a>
            </div>
          )}
        </div>
        

        <div className="card-footer">
          <div className="like-section">
            <button
              className={`like-button ${likeInfo.user_liked ? 'liked' : ''}`}
              onClick={() => toggleLike(track.id)}
            >
              <span className="like-icon">❤️</span>
              <span className="like-count">{likeInfo.like_count}</span>
              <span className="like-text">{likeInfo.user_liked ? 'Retirer' : 'Liker'}</span>
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
              {activeCommentTrack === track.id ? (
                <span>▼ Masquer les commentaires</span>
              ) : (
                <span>▶ Afficher les commentaires ({trackComments.length})</span>
              )}
            </button>

            {activeCommentTrack === track.id && (
              <div className="comments-container">
                <div className="comments-list">
                  {trackComments.length > 0 ? (
                    trackComments.map(comment => (
                      <div key={comment.id} className="comment">
                        <div className="comment-header">
                          <div className="comment-user">
                            <span className="comment-username">{comment.user.name}</span>
                            <span className="comment-date">
                              {new Date(comment.date).toLocaleString()}
                            </span>
                          </div>
                          {user?.id === comment.user.id && (
                            <div className="comment-actions">
                              {editingCommentId === comment.id ? (
                                <>
                                  <button 
                                    onClick={() => handleUpdateComment(track.id, comment.id)}
                                    className="save-edit-btn"
                                  >
                                    Enregistrer
                                  </button>
                                  <button 
                                    onClick={() => setEditingCommentId(null)}
                                    className="cancel-edit-btn"
                                  >
                                    Annuler
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
                                    Modifier
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (window.confirm("Supprimer ce commentaire ?")) {
                                        handleDeleteComment(comment.id, track.id);
                                      }
                                    }}
                                    className="delete-comment-btn"
                                  >
                                    Supprimer
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
                    ))
                  ) : (
                    <div className="no-comments">Aucun commentaire pour le moment</div>
                  )}
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
                      className="send-comment-btn"
                    >
                      Envoyer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const response = await axios.get('https://meryouzik-backend.onrender.com/charts');
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
        const response = await axios.get(`https://meryouzik-backend.onrender.com/tracks?page=${page}`);
        const data = response.data.map(item => ({
          ...item,
          track: {
            id: item.track?.id || generateTempId(),
            title: item.track?.title,
            rank: item.track?.rank,
            duration: item.track?.duration
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

  return (
    <div className="music-app">
      <div className="app-container">
        <SearchBar onSearch={handleSearch} />
         {user && (
        <button 
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="logout-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
          </svg>
          Déconnexion
        </button>
      )}
        
        {showNoResultsMessage && results.length === 0 && searchPerformed && (
          <div className="search-message">
            <i className="icon-search"></i>
            <p>Aucun résultat trouvé pour votre recherche</p>
          </div>
        )}

        {results.length > 0 ? (
          <>
            <button className="back-button" onClick={() => setResults([])}>
              <i className="icon-arrow-left"></i> Retour aux Charts
            </button>
            <div className="cards-grid">
              {results.map((item, index) => renderCard(item, index))}
            </div>
          </>
        ) : (
          <>
            <section className="charts-section">
              <h2 className="section-title">
              <i className="icon-music"></i> Top Charts
              </h2>
              <div className="cards-grid">
                {charts.map((chart, index) => renderCard(chart, index, true))}
              </div>
            </section>

            <section className="recommendations-section">
              <h2 className="section-title">
                <i className="icon-music"></i> Morceaux recommandés
              </h2>
              <div className="cards-grid">
                {tracks.map((track, index) => renderCard(track, index))}
              </div>
              <button
                className="load-more-button"
                onClick={() => {
                  const nextPage = trackPage + 1;
                  setTrackPage(nextPage);
                  axios.get(`https://meryouzik-backend.onrender.com/tracks?page=${nextPage}`)
                    .then(response => {
                      setTracks(prev => [...prev, ...response.data]);
                    })
                    .catch(error => {
                      console.error("Erreur lors du chargement supplémentaire :", error);
                    });
                }}
              >
                <i className="icon-plus"></i> Charger plus
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;