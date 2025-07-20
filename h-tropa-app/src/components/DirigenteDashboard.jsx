// src/components/DirigenteDashboard.jsx

import React from "react";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/components/DirigenteDashboard.module.css";
import GestionPatrullas from "./GestionPatrullas"; // -> 1. Importamos el módulo de patrullas
import logoTropa from "../img/TROPA-3.png"; // -> 2. Importamos el logo

export default function DirigenteDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel del Dirigente</h1>
          <p className={styles.email}>{user?.email}</p>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          Cerrar Sesión
        </button>
      </header>
      <main>
        {/* -> 3. Reemplazamos el mensaje de bienvenida con el componente funcional */}
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <h2 className={styles.moduleTitle}>Gestión de Patrullas</h2>
            <img
              src={logoTropa}
              alt="Logo Tropa"
              className={styles.moduleLogo}
            />
          </div>
          <GestionPatrullas />
        </div>
      </main>
    </div>
  );
}
