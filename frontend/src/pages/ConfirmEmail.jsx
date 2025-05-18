import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ConfirmEmail.css';

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [message, setMessage] = useState('Confirmation en cours...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setMessage('Token manquant');
        setTimeout(() => navigate('/register'), 3000);
        return;
      }

      try {
        const response = await axios.post('/confirm-email', { token });
        
        setIsSuccess(true);
        setMessage('Email confirmé avec succès! Redirection...');
        
        setTimeout(() => {
          navigate('/login', { 
            state: { success: "Votre email a été confirmé avec succès!" },
            replace: true
          });
        }, 2000);
      } catch (error) {
        console.error("Erreur:", error.response?.data || error.message);
        setMessage(error.response?.data?.message || 'Erreur lors de la confirmation');
        
        setTimeout(() => {
          navigate('/register', { 
            state: { error: "Lien invalide ou expiré" },
            replace: true
          });
        }, 3000);
      }
    };

    confirmEmail();
  }, [token, navigate]);

  return (
    <div className="confirm-email-container">
      <div className={`confirmation-message ${isSuccess ? 'success' : 'error'}`}>
        {isSuccess ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#4BB543" strokeWidth="2"/>
            <path d="M22 4L12 14.01l-3-3" stroke="#4BB543" strokeWidth="2"/>
          </svg>
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M12 8V12M12 16H12.01M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12Z" 
              stroke="#ff6b6b" strokeWidth="2"/>
          </svg>
        )}
        <p>{message}</p>
      </div>
    </div>
  );
}