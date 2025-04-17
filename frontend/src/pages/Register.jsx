import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register({ onRegister }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    provider: 'local',
    resetPasswordToken: '',
    confirmationToken: '',
    confirmed: false,
    blocked: false,
    role: null,
    photoDeProfil: null,
    id_user: ''
  });

  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.match('image.*')) {
      handleFile(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    setForm({ ...form, photoDeProfil: file });
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('email', form.email);
      formData.append('password', form.password);
      if (form.photoDeProfil) {
        formData.append('files.photoDeProfil', form.photoDeProfil);
      }

      const response = await axios.post('http://localhost:1337/api/auth/local/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { jwt, user } = response.data;
      localStorage.setItem('token', jwt);
      onRegister(user);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || "Erreur lors de l'inscription.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <h2 className="register-title">Rejoignez-nous à MerYouZik</h2>
        <p className="register-subtitle">Créez votre compte en quelques secondes</p>
      </div>
      
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <input 
            type="text" 
            name="username" 
            placeholder="Nom d'utilisateur" 
            value={form.username} 
            onChange={handleChange} 
            required 
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
              placeholder="Mot de passe" 
              value={form.password} 
              onChange={handleChange} 
              required 
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

        <div className="form-group">
          <div 
            className={`image-upload ${isDragging ? 'dragging' : ''} ${previewImage ? 'has-image' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {previewImage ? (
              <div className="image-preview-container">
                <img src={previewImage} alt="Preview" className="preview-image" />
                <div className="image-overlay">
                  <span className="change-image-text">Changer d'image</span>
                </div>
              </div>
            ) : (
              <>
                <div className="upload-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                  </svg>
                </div>
                <p className="upload-text">Glissez-déposez votre photo ou cliquez pour sélectionner</p>
              </>
            )}
            <input 
              type="file" 
              name="photoDeProfil" 
              onChange={handleFileChange}
              accept="image/*"
              className="file-input"
            />
          </div>
        </div>

        <button type="submit" className="submit-button" style={{background: '#9b09ff'}}>
          <span>S'inscrire</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="login-link">
        Déjà un compte? <a href="/login">Connectez-vous</a>
      </div>
    </div>
  );
}

export default Register;