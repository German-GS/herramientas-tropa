// src/components/BitacoraView.jsx
import React, { useState, useMemo } from "react";
import styles from "../styles/components/ProtagonistaDashboard.module.css";
import { bitacoraData } from "../data/bitacoraData"; // Importamos los datos
import PasoBitacora from "./PasoBitacora"; // Importamos el componente del paso

const getBitacoraPorEdad = (fechaNacimiento) => {
  // Por ahora, simulamos que el usuario está en la etapa "Aventurero"
  return "Aventurero";
};

export default function BitacoraView() {
  const bitacoraActual = getBitacoraPorEdad();

  // Estado para guardar el progreso del usuario. En una app real, vendría de Firestore.
  const [progreso, setProgreso] = useState({});

  const handleUpdatePaso = (pasoId, data) => {
    setProgreso((prev) => ({
      ...prev,
      [pasoId]: data,
    }));
  };

  // Filtramos y agrupamos los pasos. `useMemo` optimiza para que no se recalcule en cada render.
  const pasosAgrupados = useMemo(() => {
    return bitacoraData
      .filter((paso) => paso.etapa === bitacoraActual)
      .reduce((acc, paso) => {
        const { area } = paso;
        if (!acc[area]) {
          acc[area] = [];
        }
        acc[area].push(paso);
        return acc;
      }, {});
  }, [bitacoraActual]);

  const areas = Object.keys(pasosAgrupados);

  return (
    <div className={styles.viewContainer}>
      <div className="text-center">
        {" "}
        {/* Asumiendo que tienes una clase global para centrar texto */}
        <h2 className={styles.viewTitle}>
          Tu Bitácora Actual:{" "}
          <span className={styles.highlight}>{bitacoraActual}</span>
        </h2>
        <div className={styles.insigniaContainer}>
          <div className={styles.insigniaPlaceholder}></div>
        </div>
      </div>

      {/* Acordeón de Áreas de Crecimiento */}
      {areas.map((area) => (
        <details key={area} className={styles.areaSection}>
          <summary className={styles.areaTitle}>{area}</summary>
          <div className={styles.pasosGrid}>
            {pasosAgrupados[area].map((paso) => (
              <PasoBitacora
                key={paso.id}
                paso={paso}
                progreso={progreso[paso.id]}
                onUpdate={handleUpdatePaso}
              />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
