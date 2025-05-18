import { useLocation } from 'react-router-dom';

export default function RegisterSuccess() {
  const { state } = useLocation();

  return (
    <div className="register-success-container">
      <div className="register-success-card">
        <h2>Inscription réussie !</h2>
        <p>Un email de confirmation a été envoyé.</p>
        <p>Veuillez vérifier votre boîte mail : <strong>{state?.email}</strong></p>
        
        <div className="tips">
          <h4>Vous n'avez pas reçu l'email ?</h4>
          <ul>
            <li>Vérifiez vos spams/courriers indésirables</li>
            <li>Attendez quelques minutes</li>
            <li>Contactez le support si le problème persiste</li>
          </ul>
        </div>
      </div>
    </div>
  );
}