import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PrivateRoute from './PrivateRoute';
import { AuthContext } from './AuthContext';

function App() {
  const { user, login, logout } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/register" element={<Register onRegister={login} />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home user={user} onLogout={logout} />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
