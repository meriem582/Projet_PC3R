import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PrivateRoute from './PrivateRoute';
import RegisterSuccess from './pages/RegisterSuccess';
import { AuthContext } from './context/AuthContext';
import ConfirmEmail from './pages/ConfirmEmail';

function App() {
  const { user, login, logout } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/register" element={<Register onRegister={login} />} />
        <Route path="/register-success" element={<RegisterSuccess />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />

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
