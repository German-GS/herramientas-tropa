// src/components/DirigenteDashboard.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/components/DirigenteDashboard.module.css";
import GestionPatrullas from "./GestionPatrullas";
import RegistroJuegos from "./RegistroJuegos";
import AsistenciaInspeccion from "./AsistenciaInspeccion";
import ReportesView from "./ReportesView";
import logoTropa from "../img/TROPA-ÍCONO-4.png";
import { FaBars, FaTimes } from "react-icons/fa";

export default function DirigenteDashboard({ userProfile }) {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("patrullas");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  // Detecta cambios de tamaño
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    // Fuerza un cálculo inicial después del primer render
    setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case "patrullas":
        return "Gestión de Patrullas";
      case "juegos":
        return "Registro de Juegos";
      case "asistencia":
        return "Asistencia e Inspección";
      case "reportes":
        return "Reportes y Puntajes";
      default:
        return "";
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "patrullas":
        return <GestionPatrullas />;
      case "asistencia":
        return <AsistenciaInspeccion />;
      case "juegos":
        return <RegistroJuegos />;
      case "reportes":
        return <ReportesView />;
      default:
        return <GestionPatrullas />;
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        {isMobile && (
          <button
            className={styles.hamburgerBtn}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <FaBars />
          </button>
        )}

        <div className={styles.headerTitle}>
          <h1 className={styles.title}>Panel del Dirigente</h1>
          <p className={styles.emailDesktop}>{user?.email}</p>
        </div>

        <button onClick={logout} className={styles.logoutBtn}>
          Cerrar Sesión
        </button>
      </header>

      {/* Navegación de escritorio */}
      {!isMobile && (
        <nav className={styles.desktopNav}>
          <button
            className={`${styles.navBtn} ${
              activeTab === "patrullas" ? styles.active : ""
            }`}
            onClick={() => handleNavClick("patrullas")}
          >
            Gestión de Patrullas
          </button>
          <button
            className={`${styles.navBtn} ${
              activeTab === "asistencia" ? styles.active : ""
            }`}
            onClick={() => handleNavClick("asistencia")}
          >
            Asistencia e Inspección
          </button>
          <button
            className={`${styles.navBtn} ${
              activeTab === "juegos" ? styles.active : ""
            }`}
            onClick={() => handleNavClick("juegos")}
          >
            Registro de Juegos
          </button>
          <button
            className={`${styles.navBtn} ${
              activeTab === "reportes" ? styles.active : ""
            }`}
            onClick={() => handleNavClick("reportes")}
          >
            Reportes
          </button>
        </nav>
      )}

      {/* Menú lateral móvil */}
      {isMobileMenuOpen && (
        <div
          className={styles.mobileMenuOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <nav
            className={styles.mobileMenuPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.mobileMenuHeader}>
              <div className={styles.mobileUserInfo}>
                <img
                  src={logoTropa}
                  alt="Logo Tropa"
                  className={styles.mobileMenuLogo}
                />
                <span>{user?.email}</span>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Cerrar menú"
              >
                <FaTimes />
              </button>
            </div>

            <button
              className={styles.mobileNavLink}
              onClick={() => handleNavClick("patrullas")}
            >
              Gestión de Patrullas
            </button>
            <button
              className={styles.mobileNavLink}
              onClick={() => handleNavClick("asistencia")}
            >
              Asistencia e Inspección
            </button>
            <button
              className={styles.mobileNavLink}
              onClick={() => handleNavClick("juegos")}
            >
              Registro de Juegos
            </button>
            <button
              className={styles.mobileNavLink}
              onClick={() => handleNavClick("reportes")}
            >
              Reportes
            </button>
          </nav>
        </div>
      )}

      <main>
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <h2 className={styles.moduleTitle}>{getTitle()}</h2>
            <img
              src={logoTropa}
              alt="Logo Tropa"
              className={styles.moduleLogo}
            />
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
