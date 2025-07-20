// src/components/ProtagonistaDashboard.jsx (Integrado con NotificacionBell)

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import styles from "../styles/components/ProtagonistaDashboard.module.css";
import BitacoraView from "./BitacoraView";
import BrujulaView from "./BrujulaView";
import logoTropa from "../img/TROPA-3.png";
import NotificacionBell from "./NotificacionBell"; // -> 1. Importa el nuevo componente

export default function ProtagonistaDashboard({ userProfile }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("bitacora");
  const [invitaciones, setInvitaciones] = useState([]);

  useEffect(() => {
    // La lógica para buscar invitaciones se mantiene igual
    const buscarInvitaciones = async () => {
      if (!user) return;
      const q = query(
        collection(db, "invitaciones"),
        where("protagonistaEmail", "==", user.email),
        where("estado", "==", "pendiente")
      );
      const querySnapshot = await getDocs(q);
      const invitacionesPendientes = [];
      querySnapshot.forEach((doc) => {
        invitacionesPendientes.push({ id: doc.id, ...doc.data() });
      });
      setInvitaciones(invitacionesPendientes);
    };
    buscarInvitaciones();
  }, [user]);

  const manejarInvitacion = async (invitacionId, aceptada) => {
    // La lógica para manejar la invitación se mantiene igual
    const invitacionRef = doc(db, "invitaciones", invitacionId);
    const nuevoEstado = aceptada ? "aceptada" : "rechazada";

    await updateDoc(invitacionRef, { estado: nuevoEstado });
    if (aceptada) {
      const q = query(
        collection(db, "miembros"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const miembroDocId = querySnapshot.docs[0].id;
        const miembroRef = doc(db, "miembros", miembroDocId);
        await updateDoc(miembroRef, {
          grupo: "Grupo 57",
          tropa: "Tropa Krios",
        });
      }
    }
    setInvitaciones(invitaciones.filter((inv) => inv.id !== invitacionId));
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <img
          src={logoTropa}
          alt="Logo de la Tropa"
          className={styles.logoTropa}
        />
        <div className={styles.userInfo}>
          <h1 className={styles.title}>Panel del Protagonista</h1>
          <p className={styles.email}>
            {userProfile.primerNombre} {userProfile.primerApellido}
          </p>
        </div>
        {/* -> 2. Añade la campana y el botón de logout a un contenedor */}
        <div className={styles.headerActions}>
          <NotificacionBell
            invitaciones={invitaciones}
            onManejarInvitacion={manejarInvitacion}
          />
          <button onClick={logout} className={styles.logoutBtn}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* -> 3. ELIMINA EL BANNER ANTIGUO DE AQUÍ */}

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
