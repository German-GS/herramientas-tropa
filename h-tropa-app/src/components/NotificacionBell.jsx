// src/components/NotificacionBell.jsx

import React, { useState } from "react";
import { FaBell } from "react-icons/fa";
import styles from "../styles/components/NotificacionBell.module.css";

export default function NotificacionBell({
  invitaciones,
  onManejarInvitacion,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className={styles.bellContainer}>
      <button
        className={styles.bellButton}
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <FaBell />
        {invitaciones.length > 0 && (
          <span className={styles.notificationBadge}></span>
        )}
      </button>

      {dropdownOpen && (
        <div className={styles.dropdown}>
          {invitaciones.length > 0 ? (
            invitaciones.map((inv) => (
              <div key={inv.id} className={styles.dropdownItem}>
                <p>Tienes una invitación para unirte a una tropa.</p>
                <div className={styles.dropdownActions}>
                  <button
                    onClick={() => {
                      onManejarInvitacion(inv.id, true);
                      setDropdownOpen(false);
                    }}
                    className={styles.btnAceptar}
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => {
                      onManejarInvitacion(inv.id, false);
                      setDropdownOpen(false);
                    }}
                    className={styles.btnRechazar}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.dropdownItem}>
              <p>No tienes notificaciones nuevas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
