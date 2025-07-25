// src/components/AsistenciaInspeccion.jsx (Con lógica de creación de registro)

import React, { useState, useEffect, useCallback } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import styles from "../styles/components/DirigenteDashboard.module.css";

const ITEMS_INSPECCION = [
  { id: "uniforme", label: "Uniforme" },
  { id: "panuelo", label: "Pañuelo" },
  { id: "bordon", label: "Bordón" },
  { id: "libreta", label: "Libreta" },
  { id: "lapicero", label: "Lapicero" },
  { id: "cuerda", label: "Cuerda" },
  { id: "costurero", label: "Costurero" },
  { id: "espejo", label: "Espejo" },
  { id: "agua", label: "Agua" },
];

export default function AsistenciaInspeccion() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [patrullas, setPatrullas] = useState([]);
  const [registros, setRegistros] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const patrullasSnapshot = await getDocs(collection(db, "patrullas"));
      const patrullasData = {};
      patrullasSnapshot.forEach((doc) => {
        patrullasData[doc.id] = { ...doc.data(), id: doc.id, miembros: [] };
      });

      const qMiembros = query(
        collection(db, "miembros"),
        where("rol", "==", "protagonista")
      );
      const miembrosSnapshot = await getDocs(qMiembros);
      miembrosSnapshot.forEach((doc) => {
        const miembro = { id: doc.id, ...doc.data() };
        if (miembro.patrullaId && patrullasData[miembro.patrullaId]) {
          patrullasData[miembro.patrullaId].miembros.push(miembro);
        }
      });
      setPatrullas(Object.values(patrullasData));

      const docId = `registro_${fecha}`;
      const docRef = doc(db, "registros_diarios", docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRegistros(docSnap.data().registros || {});
      } else {
        setRegistros({});
      }
    } catch (error) {
      console.error("Error al cargar datos de asistencia:", error);
      Swal.fire("Error", "No se pudieron cargar los datos.", "error");
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- FUNCIÓN CORREGIDA ---
  const handleRegistroChange = (miembroId, campo, item, valor) => {
    setRegistros((prev) => {
      const newRegistros = { ...prev };
      // Si no existe un registro para este miembro, lo creamos vacío
      if (!newRegistros[miembroId]) {
        newRegistros[miembroId] = { asistencia: false, inspeccion: {} };
      }

      // Actualizamos el campo correspondiente
      if (campo === "asistencia") {
        newRegistros[miembroId].asistencia = valor;
      } else if (campo === "inspeccion") {
        newRegistros[miembroId].inspeccion[item] = valor;
      }
      return newRegistros;
    });
  };

  const handleGuardarRegistros = async () => {
    const docId = `registro_${fecha}`;
    const docRef = doc(db, "registros_diarios", docId);
    try {
      await setDoc(
        docRef,
        {
          fecha,
          dirigenteId: auth.currentUser.uid,
          registros,
        },
        { merge: true }
      );
      Swal.fire(
        "¡Guardado!",
        "Se han guardado los registros del día.",
        "success"
      );
    } catch (error) {
      console.error("Error al guardar registros:", error);
      Swal.fire("Error", "No se pudieron guardar los registros.", "error");
    }
  };

  return (
    <div>
      <div className={styles.asistenciaHeader}>
        <label htmlFor="fecha-asistencia">Fecha del Registro:</label>
        <input
          type="date"
          id="fecha-asistencia"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={styles.formInput}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando...</div>
      ) : (
        <div className={styles.asistenciaContainer}>
          {patrullas.map((patrulla) => (
            <div key={patrulla.id} className={styles.patrullaSection}>
              <h3 className={styles.patrullaSectionTitle}>{patrulla.nombre}</h3>
              <div className={styles.miembrosGrid}>
                {patrulla.miembros.map((miembro) => {
                  const asistenciaMarcada =
                    registros[miembro.id]?.asistencia || false;
                  return (
                    <div
                      key={miembro.id}
                      className={styles.miembroInspectionCard}
                    >
                      <div className={styles.miembroName}>
                        {miembro.primerNombre} {miembro.primerApellido}
                      </div>
                      <div className={styles.asistenciaToggle}>
                        <label>Asistencia</label>
                        <input
                          type="checkbox"
                          checked={asistenciaMarcada}
                          onChange={(e) =>
                            handleRegistroChange(
                              miembro.id,
                              "asistencia",
                              null,
                              e.target.checked
                            )
                          }
                        />
                      </div>
                      <div className={styles.inspeccionGrid}>
                        {ITEMS_INSPECCION.map((item) => (
                          <div key={item.id} className={styles.inspeccionItem}>
                            <input
                              type="checkbox"
                              id={`${miembro.id}-${item.id}`}
                              checked={
                                registros[miembro.id]?.inspeccion?.[item.id] ||
                                false
                              }
                              disabled={!asistenciaMarcada}
                              onChange={(e) =>
                                handleRegistroChange(
                                  miembro.id,
                                  "inspeccion",
                                  item.id,
                                  e.target.checked
                                )
                              }
                            />
                            <label htmlFor={`${miembro.id}-${item.id}`}>
                              {item.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className={styles.buttonContainer}>
        <button onClick={handleGuardarRegistros} className={styles.submitBtn}>
          Guardar Registros del Día
        </button>
      </div>
    </div>
  );
}
