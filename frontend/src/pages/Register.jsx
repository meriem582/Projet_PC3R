import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import './Register.css';
import { Link } from 'react-router-dom';


emailjs.init("Oet3_0tFf8UltwLXz");

function Register({ onRegister }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Effacer l'erreur quand l'utilisateur modifie le champ
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation côté client
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }

    try {
      // Enregistrement de l'utilisateur
      const response = await axios.post(`/register`, {
        username: form.username,
        email: form.email,
        password: form.password
      });


      // Envoi de l'email de confirmation
      await emailjs.send(
        'service_0a0g42c', 
        'template_eg9z2lt',
        {
          to_email: form.email,
          username: form.username,
          confirmation_link: `${window.location.origin}/confirm-email?token=${response.data.token}`,
          nom_site: "MerYouZik"
        },
        "Oet3_0tFf8UltwLXz"
      );

      setShowSuccessMessage(true);

      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: "Votre compte a été créé. Veuillez vérifier votre email pour le confirmer." 
          } 
        });
      }, 5000);

    } catch (err) {
      console.error("Erreur lors de l'inscription:", err);
      
      // Gestion des erreurs spécifiques
      if (err.response?.status === 409) {
        setError("Un compte existe déjà avec cet email ou nom d'utilisateur. Veuillez vous connecter ou utiliser des informations différentes.");
      } else if (err.response?.data?.message?.includes('email')) {
        setError("Veuillez utiliser une adresse email valide.");
      } else if (err.response?.data?.message?.includes('username')) {
        setError("Le nom d'utilisateur doit contenir entre 3 et 20 caractères (lettres, chiffres et underscores uniquement).");
      } else {
        setError(err.response?.data?.message || 
                "Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <h2 className="register-title">Rejoignez-nous à MerYouZik</h2>
        <p className="register-subtitle">Créez votre compte en quelques secondes</p>
      </div>

      {!showSuccessMessage ? (
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <input 
              type="text" 
              name="username" 
              placeholder="Nom d'utilisateur" 
              value={form.username} 
              onChange={handleChange} 
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              title="Lettres, chiffres et underscores uniquement"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              value={form.email} 
              onChange={handleChange} 
              required
              className="form-input"
            />
          </div>

          <div className="form-group password-group">
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="Mot de passe (6 caractères minimum)" 
                value={form.password} 
                onChange={handleChange} 
                required
                minLength={6}
                className="form-input password-input"
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={toggleShowPassword}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5C5 5 2 12 2 12C2 12 5 19 12 19C19 19 22 12 22 12C22 12 19 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group password-group">
            <div className="password-input-container">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword" 
                placeholder="Confirmez le mot de passe" 
                value={form.confirmPassword} 
                onChange={handleChange} 
                required
                minLength={6}
                className="form-input confirm-password-input"
              />
              <button 
                type="button" 
                className="password-toggle confirm-password-toggle"
                onClick={toggleShowConfirmPassword}
                aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5C5 5 2 12 2 12C2 12 5 19 12 19C19 19 22 12 22 12C22 12 19 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
            {form.password && form.confirmPassword && (
              <p className={`password-match ${form.password === form.confirmPassword ? 'match' : 'no-match'}`}>
                {form.password === form.confirmPassword 
                  ? '✓ Les mots de passe correspondent' 
                  : '✗ Les mots de passe ne correspondent pas'}
              </p>
            )}
          </div>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button" 
            style={{background: '#9b09ff'}}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Création du compte...</span>
            ) : (
              <>
                <span>S'inscrire</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="register-success-message">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#9b09ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="#9b09ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Inscription réussie !</h3>
          <p>Un email de confirmation a été envoyé à <strong>{form.email}</strong>.</p>
          <p>Veuillez vérifier votre boîte mail pour confirmer votre compte.</p>
          <div className="success-countdown">
            <p>Redirection vers la page de connexion dans 5 secondes...</p>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="go-to-login-btn"
          >
            Aller à la connexion maintenant
          </button>
        </div>
      )}
      
      <div className="login-link">
        Déjà un compte? <Link to="/login" className="login-link-anchor">Connectez-vous</Link>
      </div>
    </div>
  );
}

export default Register;