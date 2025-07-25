// src/components/GestionPatrullas.jsx (Adaptado con la nueva orientación)

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

  // --- TODA LA LÓGICA DE FUNCIONES SE MANTIENE EXACTAMENTE IGUAL ---
  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
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
        setPatrullas({});
        setMiembrosSinAsignar([]);
        setLoading(false);
        return;
      }

      const patrullasSnapshot = await getDocs(collection(db, "patrullas"));
      const patrullasData = {};
      patrullasSnapshot.forEach((doc) => {
        patrullasData[doc.id] = {
          id: doc.id,
          nombre: doc.data().nombre,
          miembros: [],
        };
      });

      const miembrosRef = collection(db, "miembros");
      const qMiembros = query(
        miembrosRef,
        where("correo", "in", emailsProtagonistasAceptados)
      );
      const miembrosSnapshot = await getDocs(qMiembros);
      const miembrosSinAsignarTemp = [];
      miembrosSnapshot.forEach((doc) => {
        const miembro = { id: doc.id, ...doc.data() };
        if (miembro.patrullaId && patrullasData[miembro.patrullaId]) {
          patrullasData[miembro.patrullaId].miembros.push(miembro);
        } else {
          miembrosSinAsignarTemp.push(miembro);
        }
      });
      setPatrullas(patrullasData);
      setMiembrosSinAsignar(miembrosSinAsignarTemp);
    } catch (error) {
      console.error("Error cargando los datos:", error);
      Swal.fire("Error", "No se pudieron cargar los datos.", "error");
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
    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    )
      return;

    setIsUpdating(true);

    const miembroMovido =
      source.droppableId === "sin-asignar"
        ? miembrosSinAsignar.find((m) => m.id === draggableId)
        : patrullas[source.droppableId]?.miembros.find(
            (m) => m.id === draggableId
          );

    if (!miembroMovido) {
      setIsUpdating(false);
      return;
    }

    const nuevosSinAsignar = [...miembrosSinAsignar];
    const nuevasPatrullas = JSON.parse(JSON.stringify(patrullas));

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
        fetchData();
      })
      .finally(() => setIsUpdating(false));
  };

  const handleInvitarMiembro = async () => {
    const { value: email } = await Swal.fire({
      title: "Invitar a un Protagonista",
      input: "email",
      inputLabel: "Correo electrónico del protagonista",
      inputPlaceholder: "Ingresa el email para enviar la invitación",
      showCancelButton: true,
      confirmButtonText: "Enviar Invitación",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) {
          return "¡Necesitas escribir un correo electrónico!";
        }
        // Validación simple para formato de email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Por favor, ingresa un correo electrónico válido.";
        }
      },
    });

    if (email) {
      try {
        // --- Paso 1: Verificar si ya existe una invitación (pendiente o aceptada) ---
        // Esto evita enviar invitaciones duplicadas o a miembros que ya están en la tropa.
        const invitacionesRef = collection(db, "invitaciones");
        const q = query(
          invitacionesRef,
          where("protagonistaEmail", "==", email),
          where("dirigenteId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        let estadoExistente = null;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.estado === "pendiente" || data.estado === "aceptada") {
            estadoExistente = data.estado;
          }
        });

        if (estadoExistente === "pendiente") {
          Swal.fire(
            "Invitación Existente",
            `Ya hay una invitación pendiente para ${email}.`,
            "warning"
          );
          return; // Detiene la ejecución
        }

        if (estadoExistente === "aceptada") {
          Swal.fire(
            "Usuario ya en Tropa",
            `${email} ya aceptó una invitación y es parte de tu tropa.`,
            "info"
          );
          return; // Detiene la ejecución
        }

        // --- Paso 2: Si no hay invitaciones, crear el nuevo documento ---
        await addDoc(collection(db, "invitaciones"), {
          dirigenteId: auth.currentUser.uid,
          protagonistaEmail: email,
          estado: "pendiente",
          fechaCreacion: serverTimestamp(),
        });

        Swal.fire(
          "¡Invitación Enviada!",
          `Se ha enviado una invitación a ${email}. El protagonista deberá aceptarla desde su panel de notificaciones.`,
          "success"
        );
      } catch (error) {
        console.error("Error al enviar la invitación:", error);
        Swal.fire(
          "Error",
          "Ocurrió un error al enviar la invitación. Por favor, inténtalo de nuevo.",
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

        {/* --- ESTRUCTURA JSX REORDENADA --- */}
        <div className={styles.gestionContainerReordered}>
          {/* 1. SECCIÓN DE PATRULLAS (ARRIBA) */}
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

          {/* 2. SECCIÓN DE MIEMBROS SIN ASIGNAR (ABAJO) */}
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
        </div>
      </DragDropContext>
    </div>
  );
}
