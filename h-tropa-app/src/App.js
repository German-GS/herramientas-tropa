// En tu archivo de rutas principal (ej. App.jsx)

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* -> 1. RUTA AÑADIDA PARA LA PÁGINA PRINCIPAL <- */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/registero" element={<Register />} />

          {/* 2. La ruta a /dashboard también se mantiene por si quieres un enlace directo */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* ... otras rutas ... */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
