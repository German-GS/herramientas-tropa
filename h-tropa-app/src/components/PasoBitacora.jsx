// src/components/PasoBitacora.jsx
import React, { useState } from "react";
import styles from "../styles/components/ProtagonistaDashboard.module.css";
import Swal from "sweetalert2"; // -> 1. Asegúrate de que Swal esté importado

// -> 2. Configura el "Toast" de SweetAlert2. Puedes poner esto fuera del componente.
const Toast = Swal.mixin({
  toast: true,
  position: "top-end", // Aparecerá en la esquina superior derecha
  showConfirmButton: false,
  timer: 3000, // Durará 3 segundos
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export default function PasoBitacora({ paso, progreso, onUpdate }) {
  const [respuesta, setRespuesta] = useState(progreso?.respuesta || null);
  const [texto, setTexto] = useState(progreso?.texto || "");

  const handleSeleccion = (seleccion) => {
    setRespuesta(seleccion);
    if (respuesta !== seleccion) {
      setTexto("");
    }
  };

  const handleSave = () => {
    onUpdate(paso.id, {
      respuesta,
      texto,
      estado: "completado",
    });

    // -> 3. Llama al Toast para dar feedback al usuario
    Toast.fire({
      icon: "success",
      title: "¡Progreso Guardado!",
    });
  };

  const getStatusClass = () => {
    if (progreso?.estado === "completado") {
      return progreso.respuesta === "si" ? styles.statusSi : styles.statusNo;
    }
    return styles.statusPendiente;
  };

  return (
    <div className={styles.pasoContainer}>
      <div className={styles.pasoHeader}>
        <span className={styles.pasoId}>{paso.id}</span>
        <span className={`${styles.statusBadge} ${getStatusClass()}`}>
          {progreso?.estado || "Pendiente"}
        </span>
      </div>
      <p className={styles.pasoSituacion}>"{paso.situacion}"</p>
      <h4 className={styles.pasoPregunta}>{paso.pregunta}</h4>

      <div className={styles.pasoActions}>
        <button
          onClick={() => handleSeleccion("si")}
          className={`${styles.actionBtn} ${styles.btnSi} ${
            respuesta === "si" ? styles.selected : ""
          }`}
        >
          SÍ
        </button>
        <button
          onClick={() => handleSeleccion("no")}
          className={`${styles.actionBtn} ${styles.btnNo} ${
            respuesta === "no" ? styles.selected : ""
          }`}
        >
          NO
        </button>
      </div>

      {respuesta === "si" && (
        <div className={styles.pasoInputArea}>
          <label>Mi Experiencia (Relata lo que sucedió):</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Describe la situación donde demostraste que tu respuesta es SÍ..."
          />
        </div>
      )}

      {respuesta === "no" && (
        <div className={styles.pasoInputArea}>
          <label>Mi Nuevo Reto (¿Qué harás para lograr el SÍ?):</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Describe la acción o actividad que te propones para superar este desafío..."
          />
        </div>
      )}

      {respuesta && (
        <button onClick={handleSave} className={styles.saveBtn}>
          Guardar Progreso
        </button>
      )}
    </div>
  );
}
