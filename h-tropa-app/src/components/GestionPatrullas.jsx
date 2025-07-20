// src/components/GestionPatrullas.jsx (Lógica de carga corregida)

import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Swal from "sweetalert2";
import styles from "../styles/components/DirigenteDashboard.module.css";

export default function GestionPatrullas() {
  const [miembrosSinAsignar, setMiembrosSinAsignar] = useState([]);
  const [patrullas, setPatrullas] = useState({});
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // -> LÓGICA DE CARGA DE DATOS ACTUALIZADA
  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // 1. Buscar las invitaciones aceptadas por el dirigente actual
      const invitacionesRef = collection(db, "invitaciones");
      const qInvitaciones = query(
        invitacionesRef,
        where("dirigenteId", "==", auth.currentUser.uid),
        where("estado", "==", "aceptada")
      );
      const invitacionesSnapshot = await getDocs(qInvitaciones);
      const emailsProtagonistasAceptados = invitacionesSnapshot.docs.map(
        (doc) => doc.data().protagonistaEmail
      );

      if (emailsProtagonistasAceptados.length === 0) {
        // Si no hay protagonistas que hayan aceptado, no hay nada que mostrar
        setPatrullas({});
        setMiembrosSinAsignar([]);
        setLoading(false);
        return;
      }

      // 2. Cargar las patrullas (esto no cambia)
      const patrullasSnapshot = await getDocs(collection(db, "patrullas"));
      const patrullasData = {};
      patrullasSnapshot.forEach((doc) => {
        patrullasData[doc.id] = {
          id: doc.id,
          nombre: doc.data().nombre,
          miembros: [],
        };
      });

      // 3. Buscar solo los perfiles de los protagonistas que aceptaron la invitación
      const miembrosRef = collection(db, "miembros");
      const qMiembros = query(
        miembrosRef,
        where("correo", "in", emailsProtagonistasAceptados)
      );
      const miembrosSnapshot = await getDocs(qMiembros);

      const miembrosSinAsignarTemp = [];
      miembrosSnapshot.forEach((doc) => {
        const miembro = { id: doc.id, ...doc.data() };
        // Si el miembro tiene patrullaId y esa patrulla existe, lo asignamos
        if (miembro.patrullaId && patrullasData[miembro.patrullaId]) {
          patrullasData[miembro.patrullaId].miembros.push(miembro);
        } else {
          // Si no, va a la lista de "Sin Asignar"
          miembrosSinAsignarTemp.push(miembro);
        }
      });

      setPatrullas(patrullasData);
      setMiembrosSinAsignar(miembrosSinAsignarTemp);
    } catch (error) {
      console.error("Error cargando los datos:", error);
      Swal.fire(
        "Error",
        "No se pudieron cargar los datos de las patrullas.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCrearPatrulla = async () => {
    const { value: nombrePatrulla } = await Swal.fire({
      title: "Crear Nueva Patrulla",
      input: "text",
      inputLabel: "Nombre de la Patrulla",
      inputPlaceholder: "Ej: Halcones",
      showCancelButton: true,
    });

    if (nombrePatrulla) {
      const newPatrullaRef = await addDoc(collection(db, "patrullas"), {
        nombre: nombrePatrulla,
      });
      setPatrullas((prev) => ({
        ...prev,
        [newPatrullaRef.id]: {
          id: newPatrullaRef.id,
          nombre: nombrePatrulla,
          miembros: [],
        },
      }));
      Swal.fire(
        "¡Éxito!",
        `La patrulla "${nombrePatrulla}" ha sido creada.`,
        "success"
      );
    }
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    setIsUpdating(true);

    const miembroMovido =
      source.droppableId === "sin-asignar"
        ? miembrosSinAsignar.find((m) => m.id === draggableId)
        : patrullas[source.droppableId].miembros.find(
            (m) => m.id === draggableId
          );

    // Actualización optimista
    const nuevosSinAsignar = [...miembrosSinAsignar];
    const nuevasPatrullas = { ...patrullas };

    if (source.droppableId === "sin-asignar") {
      nuevosSinAsignar.splice(source.index, 1);
    } else {
      nuevasPatrullas[source.droppableId].miembros.splice(source.index, 1);
    }

    if (destination.droppableId === "sin-asignar") {
      nuevosSinAsignar.splice(destination.index, 0, miembroMovido);
    } else {
      nuevasPatrullas[destination.droppableId].miembros.splice(
        destination.index,
        0,
        miembroMovido
      );
    }

    setMiembrosSinAsignar(nuevosSinAsignar);
    setPatrullas(nuevasPatrullas);

    // Actualización en Firestore
    const miembroRef = doc(db, "miembros", draggableId);
    updateDoc(miembroRef, {
      patrullaId:
        destination.droppableId === "sin-asignar"
          ? null
          : destination.droppableId,
    })
      .catch((err) => {
        console.error("Error al actualizar:", err);
        Swal.fire("Error", "No se pudo guardar el cambio.", "error");
        fetchData(); // Revertir si hay error
      })
      .finally(() => setIsUpdating(false));
  };

  const handleInvitarMiembro = async () => {
    const { value: email } = await Swal.fire({
      title: "Invitar Protagonista",
      input: "email",
      inputLabel: "Correo Electrónico del Protagonista",
      inputPlaceholder: "Introduce el correo para enviar la invitación",
      showCancelButton: true,
      confirmButtonText: "Enviar Invitación",
      cancelButtonText: "Cancelar",
    });

    if (email) {
      try {
        const q = query(
          collection(db, "miembros"),
          where("correo", "==", email)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Swal.fire(
            "Error",
            "No se encontró ningún protagonista con ese correo electrónico.",
            "error"
          );
          return;
        }

        await addDoc(collection(db, "invitaciones"), {
          dirigenteId: auth.currentUser.uid,
          protagonistaEmail: email,
          estado: "pendiente",
          fechaCreacion: serverTimestamp(),
        });

        Swal.fire(
          "¡Éxito!",
          `Se ha enviado una invitación a ${email}.`,
          "success"
        );
      } catch (error) {
        console.error("Error al enviar la invitación:", error);
        Swal.fire(
          "Error",
          "Ocurrió un problema al enviar la invitación.",
          "error"
        );
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>Cargando miembros y patrullas...</div>
    );
  }

  return (
    <div className={styles.gestionWrapper}>
      {isUpdating && (
        <div className={styles.updateOverlay}>
          <div className={styles.updateSpinner}></div>
          <span>Asignando...</span>
        </div>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={styles.gestionHeader}>
          <button onClick={handleInvitarMiembro} className={styles.inviteBtn}>
            + Invitar Protagonista
          </button>
        </div>
        <div className={styles.gestionContainer}>
          {/* --- CORRECCIÓN 1: Faltaba este <Droppable> --- */}
          <Droppable droppableId="sin-asignar">
            {(provided) => (
              <div
                className={styles.columna}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <h2 className={styles.columnaTitle}>Miembros sin Asignar</h2>
                {miembrosSinAsignar.map((miembro, index) => (
                  <Draggable
                    key={miembro.id}
                    draggableId={miembro.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        className={styles.miembroCard}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {miembro.primerNombre} {miembro.primerApellido}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className={styles.patrullasGrid}>
            {Object.values(patrullas).map((patrulla) => (
              <Droppable key={patrulla.id} droppableId={patrulla.id}>
                {(provided) => (
                  <div
                    className={styles.patrullaCard}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <h3 className={styles.patrullaTitle}>{patrulla.nombre}</h3>
                    <div className={styles.miembrosContainer}>
                      {patrulla.miembros.map((miembro, index) => (
                        <Draggable
                          key={miembro.id}
                          draggableId={miembro.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              className={styles.miembroCard}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {miembro.primerNombre} {miembro.primerApellido}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
            <button
              onClick={handleCrearPatrulla}
              className={styles.addPatrullaBtn}
            >
              + Crear Nueva Patrulla
            </button>
          </div>
          {/* --- CORRECCIÓN 2: Se eliminó una llave '}' extra aquí --- */}
        </div>
      </DragDropContext>
    </div>
  );
}
