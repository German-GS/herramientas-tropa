import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "../styles/components/Login.module.css";
import { FaGoogle } from "react-icons/fa";

import troopLogo from "../img/TROPA-3.png";
import assocLogo from "../img/EMBLEMA-SIMPLIFICADO-BLANCO.png";

export default function Login() {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const nav = useNavigate();

  // Estados
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handlers (permanecen igual)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setIsLoading(true);

    try {
      await login(email, password);
      nav("/dashboard");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setMsg("");
    setIsLoading(true);

    try {
      await loginWithGoogle();
      nav("/dashboard");
    } catch (err) {
      setError(err.message || "Error con Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      setError("Ingresa tu email para recuperar contraseña");
      return;
    }

    try {
      await resetPassword(email);
      setMsg(`Enlace enviado a ${email}`);
    } catch (err) {
      setError(err.message || "Error al enviar enlace");
    }
  };

  return (
    <div className={styles.container}>
      {/* Mensajes posicionados absolutamente en la parte superior */}
      <div className={styles.loginMessages}>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}
        {msg && (
          <div className={styles.msg} role="status">
            {msg}
          </div>
        )}
      </div>

      {/* Contenido principal del login */}
      <div className={styles.loginContent}>
        <img src={troopLogo} alt="Tropa" className={styles.logo} />

        <h1 className={styles.title}>Iniciar Sesión</h1>
        <p className={styles.subtitle}>Accede a tu cuenta</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className={styles.formLabel}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.formInput}
              placeholder="guiayscout@email.com"
              required
            />
          </div>

          <div>
            <label className={styles.formLabel}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.formInput}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
          <button
            onClick={() => nav("/registro")}
            className={styles.registerBtn}
            type="button"
          >
            Registrarse
          </button>
        </form>

        <div className={styles.divider}>o</div>

        <button
          onClick={handleGoogle}
          className={styles.googleBtn}
          disabled={isLoading}
        >
          <FaGoogle className={styles.googleIcon} /> Entrar con Google
        </button>

        <button onClick={handleForgot} className={styles.forgotBtn}>
          ¿Olvidaste tu contraseña?
        </button>

        <img
          src={assocLogo}
          alt="Asociación"
          className={styles.associationLogo}
        />
      </div>
    </div>
  );
}
