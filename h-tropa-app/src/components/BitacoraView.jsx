// src/components/BitacoraView.jsx

import React, { useState, useMemo, useEffect } from "react";
import styles from "../styles/components/ProtagonistaDashboard.module.css";
import { bitacoraData } from "../data/bitacoraData";
import PasoBitacora from "./PasoBitacora";

// -> Importaciones adicionales para consultar en Firestore
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";

// -> 1. Lógica MEJORADA para determinar la bitácora por edad
const getBitacoraPorEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return "Aventurero"; // Valor por defecto

  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  if (edad >= 14) return "Explorador";
  if (edad >= 13) return "Pionero";
  if (edad >= 12) return "Intrépido";
  return "Aventurero";
};

export default function BitacoraView() {
  const { user } = useAuth();

  const [progreso, setProgreso] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  // -> 2. Estado para guardar el nombre de la bitácora actual del usuario
  const [bitacoraActual, setBitacoraActual] = useState("");

  const [seccionesAbiertas, setSeccionesAbiertas] = useState({});

  // -> 3. useEffect MODIFICADO para cargar tanto el perfil como el progreso
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // --- Primero, obtenemos la fecha de nacimiento del usuario de la colección "miembros" ---
        const miembrosRef = collection(db, "miembros");
        const q = query(miembrosRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        let fechaNacimiento = null;
        if (!querySnapshot.empty) {
          const userProfile = querySnapshot.docs[0].data();
          fechaNacimiento = userProfile.fechaNacimiento;
        }

        // Determinamos la bitácora actual y la guardamos en el estado
        const etapaActual = getBitacoraPorEdad(fechaNacimiento);
        setBitacoraActual(etapaActual);

        // --- Segundo, cargamos el progreso guardado ---
        const progresoRef = doc(db, "progreso_bitacoras", user.uid);
        const progresoSnap = await getDoc(progresoRef);
        if (progresoSnap.exists()) {
          setProgreso(progresoSnap.data().progreso || {});
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar tu información.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ... (el resto de las funciones como handleUpdatePaso, toggleSeccion, colapsarTodo se mantienen igual)
  const handleUpdatePaso = async (pasoId, data) => {
    const nuevoProgreso = { ...progreso, [pasoId]: data };
    setProgreso(nuevoProgreso);

    if (!user) return;
    const docRef = doc(db, "progreso_bitacoras", user.uid);
    try {
      await setDoc(docRef, { progreso: nuevoProgreso }, { merge: true });
    } catch (error) {
      console.error("Error al guardar el progreso:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar tu cambio.",
      });
    }
  };

  const toggleSeccion = (area) => {
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [area]: !prev[area],
    }));
  };

  const colapsarTodo = () => {
    setSeccionesAbiertas({});
  };

  const pasosAgrupados = useMemo(() => {
    if (!bitacoraActual) return {}; // Si aún no se ha determinado la bitácora, no agrupar nada
    return bitacoraData
      .filter((paso) => paso.etapa === bitacoraActual)
      .reduce((acc, paso) => {
        const { area } = paso;
        if (!acc[area]) acc[area] = [];
        acc[area].push(paso);
        return acc;
      }, {});
  }, [bitacoraActual]);

  const areas = Object.keys(pasosAgrupados);

  if (isLoading) {
    return <div className={styles.loadingState}>Cargando tu progreso...</div>;
  }

  return (
    <div className={styles.viewContainer}>
      <div style={{ textAlign: "center" }}>
        <h2 className={styles.viewTitle}>
          Tu Bitácora Actual:{" "}
          <span className={styles.highlight}>{bitacoraActual}</span>
        </h2>
        {/* ... (resto del JSX de insignia y descripción se mantiene igual) ... */}
      </div>

      <div className={styles.controlesAcordeon}>
        <button onClick={colapsarTodo} className={styles.btnColapsar}>
          Cerrar Todo
        </button>
      </div>

      {areas.map((area) => (
        <details
          key={area}
          className={styles.areaSection}
          open={seccionesAbiertas[area] || false}
        >
          <summary
            className={styles.areaTitle}
            onClick={(e) => {
              e.preventDefault();
              toggleSeccion(area);
            }}
          >
            {area}
          </summary>
          <div className={styles.pasosGrid}>
            {pasosAgrupados[area].map((paso) => (
              <PasoBitacora
                key={`${paso.etapa}-${paso.id}`} // Llave única para evitar conflictos entre bitácoras
                paso={paso}
                progreso={progreso[`${bitacoraActual}-${paso.id}`]} // Usamos una clave única para el progreso
                onUpdate={(pasoId, data) =>
                  handleUpdatePaso(`${bitacoraActual}-${pasoId}`, data)
                }
              />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
