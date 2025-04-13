import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Solution 1: Utiliser fetch API au lieu d'axios
      const response = await fetch('http://localhost:1337/api/auth/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok && data.jwt) {
        localStorage.setItem('token', data.jwt);
        onLogin(data.user);
        navigate('/');
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2 className="login-title">Content de vous revoir</h2>
        <p className="login-subtitle">Connectez-vous à votre compte</p>
      </div>
      
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <input
            type="email"
            placeholder="Adresse email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="forgot-password">
          <Link to="/forgot-password">Mot de passe oublié ?</Link>
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? (
            <span>Connexion...</span>
          ) : (
            <>
              <span>Se connecter</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>

        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
              <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
                stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {error}
          </div>
        )}
      </form>

      <div className="register-link">
        Pas encore de compte ? <Link to="/register">Créer un compte</Link>
      </div>
    </div>
  );
}

export default Login;