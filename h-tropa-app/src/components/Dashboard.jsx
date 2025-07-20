// src/components/Dashboard.jsx (Versión Definitiva)

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

import ProtagonistaDashboard from "./ProtagonistaDashboard"; // Corregido a singular
import DirigenteDashboard from "./DirigenteDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  // -> 1. Guardaremos el perfil completo del usuario, no solo el rol
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      const q = query(
        collection(db, "miembros"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        // -> 2. Guardamos todo el perfil en el estado
        setUserProfile(userData);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [user]);

  if (loading) {
    return <div>Cargando panel de trabajo...</div>;
  }

  if (!userProfile) {
    // Esto puede pasar si un usuario se autentica pero no tiene perfil en 'miembros'
    // Podríamos redirigirlo a completar su perfil.
    return (
      <div>
        No se encontró el perfil de usuario. Por favor, contacta a un dirigente.
      </div>
    );
  }

  // -> 3. Pasamos el perfil completo como 'prop' al panel correspondiente
  if (userProfile.rol === "dirigente") {
    return <DirigenteDashboard userProfile={userProfile} />;
  }

  if (userProfile.rol === "protagonista") {
    return <ProtagonistaDashboard userProfile={userProfile} />;
  }

  // Fallback por si el rol no es ninguno de los esperados
  return <div>Rol de usuario no reconocido.</div>;
}
