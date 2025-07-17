import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Bienvenido, {user.email}</h1>
      <button
        onClick={logout}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Cerrar sesión
      </button>
      {/* Aquí más adelante montarás tu mapa de rutas y bitácora */}
    </div>
  );
}
