// src/components/ProtagonistaDashboard.jsx

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/components/ProtagonistaDashboard.module.css";
import BitacoraView from "./BitacoraView";
import BrujulaView from "./BrujulaView";

// -> 1. Importa la imagen del logo (usando la misma ruta que en Login.jsx)
import logoTropa from "../img/TROPA-ÍCONO-4.png";

export default function ProtagonistaDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("bitacora");

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        {/* -> 2. Añade la imagen aquí */}
        <img
          src={logoTropa}
          alt="Logo de la Tropa"
          className={styles.logoTropa}
        />

        <div className={styles.userInfo}>
          <h1 className={styles.title}>Panel del Protagonista</h1>
          <p className={styles.email}>{user?.email}</p>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          Cerrar Sesión
        </button>
      </header>

      <nav className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${
            activeTab === "bitacora" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("bitacora")}
        >
          🗺️ Mi Aventura Personal (Bitácora)
        </button>
        <button
          className={`${styles.tabBtn} ${
            activeTab === "brujulas" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("brujulas")}
        >
          🧭 Mis Conocimientos Técnicos (Brújulas)
        </button>
      </nav>

      <main className={styles.contentArea}>
        {activeTab === "bitacora" && <BitacoraView />}
        {activeTab === "brujulas" && <BrujulaView />}
      </main>
    </div>
  );
}
