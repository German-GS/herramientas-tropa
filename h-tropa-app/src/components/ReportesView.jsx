// src/components/ReportesView.jsx (Actualizado a Chart.js)

import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// --- 1. IMPORTACIONES DE CHART.JS ---
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import styles from "../styles/components/DirigenteDashboard.module.css";
import { FaTrophy } from "react-icons/fa";

// --- 2. REGISTRO DE COMPONENTES DE CHART.JS ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportesView() {
  // --- LOS ESTADOS Y EL useEffect SE MANTIENEN IGUAL ---
  const [patrullas, setPatrullas] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [juegos, setJuegos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const patrullasSnap = await getDocs(collection(db, "patrullas"));
        setPatrullas(
          patrullasSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );

        const qMiembros = query(
          collection(db, "miembros"),
          where("rol", "==", "protagonista")
        );
        const miembrosSnap = await getDocs(qMiembros);
        setMiembros(miembrosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const qJuegos = query(
          collection(db, "juegos"),
          where("fecha", ">=", fechaInicio),
          where("fecha", "<=", fechaFin)
        );
        const juegosSnap = await getDocs(qJuegos);
        setJuegos(juegosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const qAsistencia = query(
          collection(db, "registros_diarios"),
          where("fecha", ">=", fechaInicio),
          where("fecha", "<=", fechaFin)
        );
        const asistenciaSnap = await getDocs(qAsistencia);
        setAsistencias(
          asistenciaSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (e) {
        console.error("Error fetching report data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fechaInicio, fechaFin]);

  // --- 3. useMemo ADAPTADO PARA CHART.JS ---
  const reportes = useMemo(() => {
    const totalReuniones = asistencias.length;

    const asistenciaMiembros = miembros.map((miembro) => {
      const diasPresente = asistencias.filter(
        (a) => a.registros[miembro.id]?.asistencia
      ).length;
      const porcentaje =
        totalReuniones > 0
          ? Math.round((diasPresente / totalReuniones) * 100)
          : 0;

      return { ...miembro, diasPresente, totalReuniones, porcentaje };
    });

    const puntajesPorPatrulla = patrullas
      .map((patrulla) => {
        const miembrosDePatrulla = miembros.filter(
          (m) => m.patrullaId === patrulla.id
        );

        let totalEspiritu = 0,
          totalJuegos = 0,
          totalLeyPromesa = 0,
          totalParticipacion = 0,
          totalInspeccion = 0,
          totalAsistencia = 0;

        juegos.forEach((juego) => {
          const pj = juego.puntajes?.[patrulla.id];
          if (pj) {
            totalEspiritu += Number(pj.espiritu) || 0;
            totalJuegos += Number(pj.puntaje) || 0;
            totalLeyPromesa += Number(pj.leyPromesa) || 0;
            totalParticipacion += Number(pj.participacion) || 0;
          }
        });

        asistencias.forEach((registro) => {
          miembrosDePatrulla.forEach((miembro) => {
            const reg = registro.registros?.[miembro.id];
            if (reg?.asistencia) {
              totalAsistencia += 1;
              if (reg.inspeccion) {
                totalInspeccion += Object.values(reg.inspeccion).filter(
                  Boolean
                ).length;
              }
            }
          });
        });

        const puntajeFinal =
          totalEspiritu +
          totalJuegos +
          totalLeyPromesa +
          totalParticipacion +
          totalInspeccion +
          totalAsistencia;

        return {
          id: patrulla.id,
          nombre: patrulla.nombre,
          espiritu: totalEspiritu,
          juegos: totalJuegos,
          leyPromesa: totalLeyPromesa,
          participacion: totalParticipacion,
          inspeccion: totalInspeccion,
          asistencia: totalAsistencia,
          puntajeFinal,
        };
      })
      .sort((a, b) => b.puntajeFinal - a.puntajeFinal);

    // Banderín (lógica sin cambios)
    const CATEGORIAS_BASE = [
      "juegos",
      "espiritu",
      "participacion",
      "leyPromesa",
    ];
    const ganadoresPorCategoria = CATEGORIAS_BASE.reduce((acc, cat) => {
      const max = Math.max(...puntajesPorPatrulla.map((p) => p[cat]));
      if (max > 0) {
        acc[cat] = puntajesPorPatrulla
          .filter((p) => p[cat] === max)
          .map((p) => p.id);
      } else {
        acc[cat] = [];
      }
      return acc;
    }, {});
    const intersection = puntajesPorPatrulla
      .map((p) => p.id)
      .filter((id) =>
        CATEGORIAS_BASE.every((cat) => ganadoresPorCategoria[cat].includes(id))
      );
    const banderinHonor =
      intersection.length === 1
        ? puntajesPorPatrulla.find((p) => p.id === intersection[0])
        : null;

    // --- 4. ESTRUCTURA DE DATOS PARA CADA GRÁFICO ---
    const labels = puntajesPorPatrulla.map((p) => p.nombre);

    const getChartData = (label, dataKey, colorRgb) => ({
      labels,
      datasets: [
        {
          label,
          data: puntajesPorPatrulla.map((p) => p[dataKey]),
          backgroundColor: `rgba(${colorRgb}, 0.6)`,
          borderColor: `rgba(${colorRgb}, 1)`,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    });

    return {
      asistenciaMiembros,
      puntajesPorPatrulla,
      ganadoresPorCategoria,
      banderinHonor,
      chartData: {
        espiritu: getChartData("Espíritu", "espiritu", "255, 107, 107"),
        leyPromesa: getChartData("Ley & Promesa", "leyPromesa", "54, 162, 235"),
        participacion: getChartData(
          "Participación",
          "participacion",
          "255, 206, 86"
        ),
        juegos: getChartData("Juegos", "juegos", "75, 192, 192"),
        inspeccion: getChartData("Inspección", "inspeccion", "153, 102, 255"),
      },
    };
  }, [miembros, asistencias, juegos, patrullas]);

  if (loading) {
    return <div className={styles.loading}>Generando reportes...</div>;
  }

  // --- 5. OPCIONES COMUNES PARA LOS GRÁFICOS ---
  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Ocultamos la leyenda individual
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          family: "Inter, sans-serif",
        },
        padding: {
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  });

  return (
    <div>
      {/* Filtros (sin cambios) */}
      <div className={styles.reportHeader}>
        <div className={styles.formGroup}>
          <label>Desde</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Hasta</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className={styles.formInput}
          />
        </div>
      </div>

      {/* Asistencia (sin cambios) */}
      <div className={styles.reportSection}>
        <h3 className={styles.formSectionTitle}>
          Control de Asistencia ({asistencias.length} reuniones en este período)
        </h3>
        <div className={styles.tableResponsive}>
          <table className={styles.asistenciaTable}>
            <thead>
              <tr>
                <th>Protagonista</th>
                <th>Asistencias</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {reportes.asistenciaMiembros.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.primerNombre} {item.primerApellido}
                  </td>
                  <td>
                    {item.diasPresente} de {item.totalReuniones}
                  </td>
                  <td>
                    <div className={styles.percentageBar}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${item.porcentaje}%` }}
                      >
                        {item.porcentaje}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Banderín de Honor (sin cambios) */}
      <div className={styles.reportSection}>
        <h3 className={styles.formSectionTitle}>Banderín de Honor</h3>
        {reportes.banderinHonor ? (
          <div className={`${styles.banderinCard} ${styles.golden}`}>
            <FaTrophy className={styles.banderinIcon} />
            <h4>{reportes.banderinHonor.nombre}</h4>
            <p>Ganó en Juegos, Espíritu, Participación y Ley & Promesa.</p>
            <span className={styles.totalPts}>
              {reportes.banderinHonor.puntajeFinal} pts
            </span>
          </div>
        ) : (
          <>
            <p className={styles.noteText}>
              No hay una patrulla que haya liderado TODAS las categorías.
              Mejores por ítem:
            </p>
            <div className={styles.catsWinnersGrid}>
              {["juegos", "espiritu", "participacion", "leyPromesa"].map(
                (cat) => {
                  const winnersIds = reportes.ganadoresPorCategoria[cat] || [];
                  return (
                    <div key={cat} className={styles.catWinnerCard}>
                      <h5 className={styles.catTitle}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </h5>
                      <ul className={styles.winnersList}>
                        {winnersIds.length > 0 ? (
                          winnersIds.map((id) => {
                            const pat = reportes.puntajesPorPatrulla.find(
                              (p) => p.id === id
                            );
                            return <li key={id}>{pat?.nombre}</li>;
                          })
                        ) : (
                          <li>N/A</li>
                        )}
                      </ul>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </div>

      {/* --- 6. RENDERIZADO DE GRÁFICOS INDIVIDUALES --- */}
      <div className={styles.reportSection}>
        <h3 className={styles.formSectionTitle}>Gráficos de Rendimiento</h3>
        <div className={styles.chartsGrid}>
          <div className={styles.chartContainer}>
            <Bar
              options={chartOptions("Espíritu")}
              data={reportes.chartData.espiritu}
            />
          </div>
          <div className={styles.chartContainer}>
            <Bar
              options={chartOptions("Ley & Promesa")}
              data={reportes.chartData.leyPromesa}
            />
          </div>
          <div className={styles.chartContainer}>
            <Bar
              options={chartOptions("Participación")}
              data={reportes.chartData.participacion}
            />
          </div>
          <div className={styles.chartContainer}>
            <Bar
              options={chartOptions("Juegos")}
              data={reportes.chartData.juegos}
            />
          </div>
          <div className={styles.chartContainer}>
            <Bar
              options={chartOptions("Inspección")}
              data={reportes.chartData.inspeccion}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
