// src/components/BrujulaView.jsx
import React from "react";
import styles from "../styles/components/ProtagonistaDashboard.module.css";

export default function BrujulaView() {
  return (
    <div className={styles.viewContainer}>
      <h2 className={styles.viewTitle}>Progreso en Brújulas</h2>
      <p>
        Selecciona una brújula para ver los temas y registrar tus conocimientos
        técnicos una vez demostrados a tu dirigente.
      </p>
      {/* Aquí irá la navegación y el contenido de las brújulas */}
    </div>
  );
}
