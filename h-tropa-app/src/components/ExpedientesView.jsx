// src/components/ExpedientesView.jsx (Versión con detalles de avance y edad)

import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import styles from "../styles/components/DirigenteDashboard.module.css";
import { bitacoraData } from "../data/bitacoraData";

// --- NUEVA FUNCIÓN PARA CALCULAR EDAD ---
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

// --- Lógica existente (sin cambios) ---
const getBitacoraPorEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return "Aventurero";
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
const calcularAvancePorArea = (progreso, etapaActual) => {
  const pasosDeEtapa = bitacoraData.filter((p) => p.etapa === etapaActual);
  const areas = [
    "Corporalidad",
    "Creatividad",
    "Carácter",
    "Afectividad",
    "Sociabilidad",
    "Espiritualidad",
  ];
  const avance = {};
  areas.forEach((area) => {
    const pasosDelArea = pasosDeEtapa.filter((p) => p.area === area);
    const totalPasos = pasosDelArea.length;
    if (totalPasos === 0) {
      avance[area] = 0;
      return;
    }
    const pasosCompletados = pasosDelArea.filter((paso) => {
      const progresoKey = `${etapaActual}-${paso.id}`;
      return progreso[progresoKey]?.estado === "completado";
    }).length;
    avance[area] = Math.round((pasosCompletados / totalPasos) * 100);
  });
  return avance;
};
const calcularEstadoTransicion = (fechaNacimiento) => {
  if (!fechaNacimiento)
    return {
      enTransicion: false,
      mensaje: "Fecha de nacimiento no disponible.",
    };
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const fechaCumple15 = new Date(
    nacimiento.getFullYear() + 15,
    nacimiento.getMonth(),
    nacimiento.getDate()
  );
  const inicioTransicion = new Date(fechaCumple15);
  inicioTransicion.setMonth(inicioTransicion.getMonth() - 6);
  if (hoy < inicioTransicion) {
    return {
      enTransicion: false,
      mensaje: "Aún no está cerca de la transición.",
    };
  }
  const tiempoRestanteMs = fechaCumple15 - hoy;
  if (tiempoRestanteMs <= 0) {
    return {
      enTransicion: true,
      mensaje:
        "El período de transición ha finalizado. Debería coordinarse su paso a la Wak.",
    };
  }
  let diasRestantes = Math.ceil(tiempoRestanteMs / (1000 * 60 * 60 * 24));
  const mesesRestantes = Math.floor(diasRestantes / 30.44);
  const diasSueltos = Math.round(diasRestantes % 30.44);
  return {
    enTransicion: true,
    mensaje: `En transición. Faltan aproximadamente ${mesesRestantes} meses y ${diasSueltos} días para pasar a la Wak.`,
  };
};

export default function ExpedientesView() {
  const [patrullas, setPatrullas] = useState({});
  const [loading, setLoading] = useState(true);
  const [expedienteAbierto, setExpedienteAbierto] = useState(null);
  const [areaAbierta, setAreaAbierta] = useState({}); // --- NUEVO ESTADO PARA EL ACORDEÓN DE ÁREAS ---

  useEffect(() => {
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
        const invitacionesSnap = await getDocs(qInvitaciones);
        const emailsProtagonistas = invitacionesSnap.docs.map(
          (doc) => doc.data().protagonistaEmail
        );

        if (emailsProtagonistas.length === 0) {
          setLoading(false);
          return;
        }

        const patrullasSnap = await getDocs(collection(db, "patrullas"));
        const patrullasData = {};
        patrullasSnap.forEach((doc) => {
          patrullasData[doc.id] = { id: doc.id, ...doc.data(), miembros: [] };
        });

        const miembrosRef = collection(db, "miembros");
        const qMiembros = query(
          miembrosRef,
          where("correo", "in", emailsProtagonistas)
        );
        const miembrosSnap = await getDocs(qMiembros);

        await Promise.all(
          miembrosSnap.docs.map(async (miembroDoc) => {
            const miembroData = { id: miembroDoc.id, ...miembroDoc.data() };
            const progresoRef = doc(
              db,
              "progreso_bitacoras",
              miembroData.userId
            );
            const progresoSnap = await getDoc(progresoRef);
            const progreso = progresoSnap.exists()
              ? progresoSnap.data().progreso || {}
              : {};
            const etapaActual = getBitacoraPorEdad(miembroData.fechaNacimiento);
            const avancePorArea = calcularAvancePorArea(progreso, etapaActual);

            const miembroEnriquecido = {
              ...miembroData,
              edad: calcularEdad(miembroData.fechaNacimiento), // Añadimos la edad
              progreso, // Guardamos el progreso para mostrar los detalles
              etapaActual,
              avancePorArea,
            };

            if (
              miembroEnriquecido.patrullaId &&
              patrullasData[miembroEnriquecido.patrullaId]
            ) {
              patrullasData[miembroEnriquecido.patrullaId].miembros.push(
                miembroEnriquecido
              );
            }
          })
        );

        setPatrullas(patrullasData);
      } catch (error) {
        console.error("Error cargando expedientes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleExpediente = (miembroId) => {
    setExpedienteAbierto((prevId) => (prevId === miembroId ? null : miembroId));
  };

  // --- NUEVA FUNCIÓN PARA ABRIR/CERRAR EL DETALLE DE UN ÁREA ---
  const handleToggleArea = (miembroId, area) => {
    setAreaAbierta((prev) => ({
      ...prev,
      [miembroId]: prev[miembroId] === area ? null : area,
    }));
  };

  if (loading) {
    return <div className={styles.loading}>Cargando expedientes...</div>;
  }

  return (
    <div>
      {Object.values(patrullas).map((patrulla) =>
        patrulla.miembros.length > 0 ? (
          <div key={patrulla.id} className={styles.reportSection}>
            <h3 className={styles.patrullaSectionTitle}>{patrulla.nombre}</h3>
            <div className={styles.expedientesContainer}>
              {patrulla.miembros.map((miembro) => {
                const estadoTransicion = calcularEstadoTransicion(
                  miembro.fechaNacimiento
                );
                return (
                  <div key={miembro.id} className={styles.expedienteItem}>
                    <button
                      className={styles.expedienteHeader}
                      onClick={() => handleToggleExpediente(miembro.id)}
                    >
                      {miembro.primerNombre} {miembro.primerApellido}
                      <span
                        className={
                          expedienteAbierto === miembro.id
                            ? styles.expedienteChevronAbierto
                            : styles.expedienteChevronCerrado
                        }
                      >
                        ▼
                      </span>
                    </button>
                    {expedienteAbierto === miembro.id && (
                      <div className={styles.expedienteDetalle}>
                        <div className={styles.expedienteGrid}>
                          <div className={styles.expedienteColumna}>
                            <p>
                              <strong>Cédula:</strong> {miembro.cedula}
                            </p>
                            <p>
                              <strong>Email:</strong> {miembro.correo}
                            </p>
                            <p>
                              <strong>Teléfono:</strong> {miembro.telefono}
                            </p>
                            <p>
                              <strong>Fecha de Nacimiento:</strong>{" "}
                              {miembro.fechaNacimiento} (<strong>Edad:</strong>{" "}
                              {miembro.edad} años)
                            </p>
                            <p>
                              <strong>Etapa Actual:</strong>{" "}
                              <span className={styles.highlight}>
                                {miembro.etapaActual}
                              </span>
                            </p>
                            <div
                              className={
                                estadoTransicion.enTransicion
                                  ? styles.transicionActiva
                                  : styles.transicionInactiva
                              }
                            >
                              <p>
                                <strong>Transición:</strong>{" "}
                                {estadoTransicion.mensaje}
                              </p>
                            </div>
                          </div>

                          <div className={styles.expedienteColumna}>
                            <h4>Avance por Área</h4>
                            {Object.entries(miembro.avancePorArea).map(
                              ([area, porcentaje]) => (
                                <div key={area}>
                                  <div
                                    className={styles.avanceAreaItem}
                                    onClick={() =>
                                      handleToggleArea(miembro.id, area)
                                    }
                                  >
                                    <label>{area}</label>
                                    <div className={styles.percentageBar}>
                                      <div
                                        className={styles.barFill}
                                        style={{
                                          width: `${porcentaje}%`,
                                          backgroundColor:
                                            porcentaje > 0
                                              ? "var(--color-tropa)"
                                              : "#e0e0e0",
                                        }}
                                      >
                                        {porcentaje}%
                                      </div>
                                    </div>
                                  </div>
                                  {areaAbierta[miembro.id] === area && (
                                    <div
                                      className={styles.pasosDetalleContainer}
                                    >
                                      {bitacoraData
                                        .filter(
                                          (p) =>
                                            p.etapa === miembro.etapaActual &&
                                            p.area === area
                                        )
                                        .map((paso) => {
                                          const progresoKey = `${miembro.etapaActual}-${paso.id}`;
                                          const progresoDelPaso =
                                            miembro.progreso[progresoKey];
                                          const isCompletado =
                                            progresoDelPaso?.estado ===
                                            "completado";
                                          return (
                                            <div
                                              key={paso.id}
                                              className={
                                                isCompletado
                                                  ? styles.pasoCompletado
                                                  : styles.pasoPendiente
                                              }
                                            >
                                              <p>
                                                <strong>{paso.id}:</strong>{" "}
                                                {paso.pregunta}
                                              </p>
                                              {isCompletado &&
                                                progresoDelPaso.texto && (
                                                  <p
                                                    className={styles.pasoTexto}
                                                  >
                                                    <em>
                                                      Relato: “
                                                      {progresoDelPaso.texto}”
                                                    </em>
                                                  </p>
                                                )}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}
