import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ConfirmEmail.css';

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        console.log("Envoi de la requête avec token:", token); // Debug
        const response = await axios.get(`http://localhost:8080/confirm-email?token=${token}`);
        console.log("Réponse du serveur:", response.data); // Debug
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              success: "Email confirmé avec succès!" 
            },
            replace: true // Empêche de revenir en arrière
          });
        }, 2000);
      } catch (error) {
        console.error("Erreur complète:", error.response || error);
        setTimeout(() => {
          navigate('/register', { 
            state: { 
              error: "Lien invalide ou expiré" 
            },
            replace: true
          });
        }, 2000);
      }
    };

    if (token) {
      confirmEmail();
    } else {
      navigate('/register', { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="confirm-email-container">
      {token ? (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Confirmation en cours...</p>
        </div>
      ) : (
        <p className="error-message">Token manquant</p>
      )}
    </div>
  );
}