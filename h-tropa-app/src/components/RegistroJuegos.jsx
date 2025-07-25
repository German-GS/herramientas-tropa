// src/components/RegistroJuegos.jsx (Versión Completa y Funcional)

import React, { useState, useEffect, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  writeBatch,
} from "firebase/firestore";
import Swal from "sweetalert2";
import styles from "../styles/components/DirigenteDashboard.module.css";
import { FaEdit, FaTrashAlt, FaPlusCircle } from "react-icons/fa";

export default function RegistroJuegos() {
  const [patrullas, setPatrullas] = useState([]);
  const [juegosRegistrados, setJuegosRegistrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGame, setEditingGame] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const patrullasSnapshot = await getDocs(collection(db, "patrullas"));
      const patrullasActivas = patrullasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatrullas(patrullasActivas);

      const q = query(
        collection(db, "juegos"),
        where("cicloId", "==", null),
        orderBy("fecha", "desc")
      );
      const juegosSnapshot = await getDocs(q);
      const juegosData = juegosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJuegosRegistrados(juegosData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Swal.fire("Error", "No se pudieron cargar los datos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (juego) => {
    setEditingGame(juego);
    window.scrollTo(0, 0);
  };

  const handleDelete = (juegoId, juegoNombre) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: `No podrás revertir la eliminación de "${juegoNombre}"`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await deleteDoc(doc(db, "juegos", juegoId));
        Swal.fire("¡Eliminado!", "El registro ha sido borrado.", "success");
        fetchData();
      }
    });
  };

  const handleNuevoCiclo = () => {
    Swal.fire({
      title: "¿Iniciar un nuevo ciclo?",
      text: "Esto archivará los puntajes actuales y reiniciará el conteo.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, iniciar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const cicloId = `ciclo-${new Date().toISOString()}`;
        const batch = writeBatch(db);
        juegosRegistrados.forEach((juego) => {
          const juegoRef = doc(db, "juegos", juego.id);
          batch.update(juegoRef, { cicloId });
        });
        await batch.commit();
        Swal.fire(
          "¡Nuevo Ciclo!",
          "Los puntajes han sido archivados.",
          "success"
        );
        fetchData();
      }
    });
  };

  const initialValues = editingGame || {
    nombreJuego: "",
    fecha: new Date().toISOString().split("T")[0],
    observaciones: "",
    puntajes: patrullas.reduce((acc, patrulla) => {
      acc[patrulla.id] = {
        puntaje: "",
        espiritu: "",
        leyPromesa: "",
        participacion: "",
      };
      return acc;
    }, {}),
  };

  const validationSchema = Yup.object({
    nombreJuego: Yup.string().required("El nombre es obligatorio"),
    fecha: Yup.date().required("La fecha es obligatoria"),
  });

  const handleSubmit = async (values, { resetForm }) => {
    try {
      if (editingGame) {
        await updateDoc(doc(db, "juegos", editingGame.id), {
          ...values,
          cicloId: null,
        });
        Swal.fire({
          icon: "success",
          title: "¡Actualizado!",
          timer: 2000,
          showConfirmButton: false,
        });
        setEditingGame(null);
      } else {
        await addDoc(collection(db, "juegos"), {
          ...values,
          fechaCreacion: serverTimestamp(),
          cicloId: null,
        });
        Swal.fire({
          icon: "success",
          title: "¡Guardado!",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      resetForm();
      fetchData();
    } catch (error) {
      Swal.fire("Error", "Ocurrió un problema al guardar.", "error");
    }
  };

  const juegosAgrupados = useMemo(() => {
    return juegosRegistrados.reduce((acc, juego) => {
      const fecha = new Date(juego.fecha + "T00:00:00").toLocaleDateString(
        "es-CR",
        { dateStyle: "full" }
      );
      if (!acc[fecha]) acc[fecha] = [];
      acc[fecha].push(juego);
      return acc;
    }, {});
  }, [juegosRegistrados]);

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className={styles.formModuleContainer}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, resetForm }) => (
          <Form>
            <h3 className={styles.formSectionTitle}>
              {editingGame ? "Editando Actividad" : "Registrar Nueva Actividad"}
            </h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="nombreJuego">Nombre de la Actividad</label>
                <Field
                  name="nombreJuego"
                  type="text"
                  className={styles.formInput}
                />
                <ErrorMessage
                  name="nombreJuego"
                  component="div"
                  className={styles.errorMsg}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="fecha">Fecha</label>
                <Field name="fecha" type="date" className={styles.formInput} />
                <ErrorMessage
                  name="fecha"
                  component="div"
                  className={styles.errorMsg}
                />
              </div>
            </div>

            <div className={styles.puntajesGrid}>
              {patrullas.map((patrulla) => (
                <div key={patrulla.id} className={styles.puntajeCard}>
                  <h4 className={styles.puntajeCardTitle}>{patrulla.nombre}</h4>
                  <div className={styles.puntajeFields}>
                    <div className={styles.formGroup}>
                      <label>Puntaje</label>
                      <Field
                        name={`puntajes.${patrulla.id}.puntaje`}
                        type="number"
                        min="1"
                        max="10"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Espíritu</label>
                      <Field
                        name={`puntajes.${patrulla.id}.espiritu`}
                        type="number"
                        min="1"
                        max="10"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Participación</label>
                      <Field
                        name={`puntajes.${patrulla.id}.participacion`}
                        type="number"
                        min="1"
                        max="10"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Ley y Promesa</label>
                      <Field
                        name={`puntajes.${patrulla.id}.leyPromesa`}
                        type="number"
                        min="1"
                        max="10"
                        className={styles.formInput}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="observaciones">Observaciones</label>
              <Field
                name="observaciones"
                as="textarea"
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.buttonContainer}>
              {editingGame && (
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setEditingGame(null);
                    resetForm();
                  }}
                >
                  Cancelar Edición
                </button>
              )}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Guardando..."
                  : editingGame
                  ? "Actualizar"
                  : "Guardar"}
              </button>
            </div>
          </Form>
        )}
      </Formik>

      <div className={styles.registrosContainer}>
        <div className={styles.historialHeader}>
          <h3 className={styles.formSectionTitle}>
            Historial de Actividades del Ciclo Actual
          </h3>
          <button onClick={handleNuevoCiclo} className={styles.cicloBtn}>
            <FaPlusCircle /> Iniciar Nuevo Ciclo
          </button>
        </div>
        {Object.keys(juegosAgrupados).length > 0 ? (
          Object.entries(juegosAgrupados).map(([fecha, juegosDelDia]) => (
            <div key={fecha} className={styles.grupoFecha}>
              <h4 className={styles.fechaTitulo}>{fecha}</h4>
              <div className={styles.tableResponsive}>
                <table className={styles.registrosTable}>
                  <thead>
                    <tr>
                      <th>Actividad</th>
                      {patrullas.map((p) => (
                        <th key={p.id}>{p.nombre}</th>
                      ))}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {juegosDelDia.map((juego) => (
                      <tr key={juego.id}>
                        <td>{juego.nombreJuego}</td>
                        {patrullas.map((p) => (
                          <td
                            key={`${juego.id}-${p.id}`}
                            className={styles.puntajesCell}
                          >
                            <span className={styles.patrullaLabel}>
                              {p.nombre}
                            </span>{" "}
                            {/* ← NUEVO */}
                            <div className={styles.puntajesChips}>
                              <span className={styles.puntajeItem}>
                                <b>P:</b> {juego.puntajes[p.id]?.puntaje || "-"}
                              </span>
                              <span className={styles.puntajeItem}>
                                <b>E:</b>{" "}
                                {juego.puntajes[p.id]?.espiritu || "-"}
                              </span>
                              <span className={styles.puntajeItem}>
                                <b>Pa:</b>{" "}
                                {juego.puntajes[p.id]?.participacion || "-"}
                              </span>
                              <span className={styles.puntajeItem}>
                                <b>LP:</b>{" "}
                                {juego.puntajes[p.id]?.leyPromesa || "-"}
                              </span>
                            </div>
                          </td>
                        ))}
                        <td className={styles.actionButtons}>
                          <button
                            onClick={() => handleEdit(juego)}
                            className={styles.editBtn}
                            type="button"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(juego.id, juego.nombreJuego)
                            }
                            className={styles.deleteBtn}
                            type="button"
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <p>No se han registrado juegos en el ciclo actual.</p>
        )}
      </div>
    </div>
  );
}
