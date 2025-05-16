import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Ajout d'un état de chargement

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Remplacer l'endpoint Strapi par votre propre endpoint
      axios.get('http://localhost:8080/api/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUser(res.data.user); // Adapté à la structure de votre réponse
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur de vérification du token:", err);
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Valeur du contexte
  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user, // Booléen pour vérifier si l'utilisateur est connecté
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}