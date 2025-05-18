import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Login.css';
import logo from '../assets/MerYouZikLOGO.png';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Afficher le message de succès si présent
  useEffect(() => {
    if (location.state?.success) {
      const timer = setTimeout(() => {
        navigate(location.pathname, { state: {} }); // Efface le message après 5s
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/login0', {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        onLogin(response.data.user);
        navigate('/');
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <img src={logo} alt="MerYouzik Logo" className="login-logo" />
        <h2 className="login-title">Bienvenue sur MerYouZik!</h2>
        <p className="login-subtitle">Connectez-vous à votre compte MerYouZik</p>
      </div>

      {/* Message de succès */}
    {location.state?.message && (
      <div className="success-message-wrapper">
        <div className="success-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#4BB543" strokeWidth="2" strokeLinecap="round"/>
            <path d="M22 4L12 14.01l-3-3" stroke="#4BB543" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {location.state.message}
        </div>
      </div>
    )}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group password-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#666" strokeWidth="2"/>
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#666" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M2.999 3L21 21M9.843 9.914C9.321 10.454 9 11.189 9 12C9 13.657 10.342 15 12 15C12.822 15 13.567 14.669 14.109 14.133M6.499 6.647C4.6 7.9 3.153 9.784 2.457 12C3.731 16.057 7.522 19 12 19C13.989 19 15.841 18.419 17.399 17.418M11 5.049C11.328 5.017 11.662 5 12 5C16.477 5 20.267 7.943 21.541 12C21.261 12.894 20.858 13.734 20.352 14.5" stroke="#666" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>

        <button type="submit" className="submit-button" disabled={isLoading} style={{background: '#9b09ff'}}>
          {isLoading ? (
            <span>Connexion...</span>
          ) : (
            <>
              <span>Se connecter</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </>
          )}
        </button>

        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
              <path d="M12 8V12M12 16H12.01M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12Z" 
                stroke="#ff6b6b" strokeWidth="2"/>
            </svg>
            {error}
          </div>
        )}
      </form>

      <div className="register-link">
        Pas encore de compte? <Link to="/register">Créer un compte</Link>
      </div>
    </div>
  );
}

export default Login;