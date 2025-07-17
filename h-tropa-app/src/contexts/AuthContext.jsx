import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

/* ------------------------------------------------------
   AuthContext.jsx — Manejador global de autenticación
   • Registro email / contraseña
   • Login email / contraseña
   • Login con Google (crea doc en /users)
   • Reset password
   • Logout
------------------------------------------------------ */

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  /* --- Observador de sesión --- */
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  /* ---------- Acciones ---------- */
  const register = (email, pw) =>
    createUserWithEmailAndPassword(auth, email, pw);
  const login = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const logout = () => signOut(auth);

  /** Login con Google → crea /users/{uid} si no existe */
  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    const { uid, email, displayName, photoURL } = cred.user;

    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        email,
        nombre: displayName || "",
        foto: photoURL || "",
        rol: "padre", // ajusta según tu lógica
        creadoEn: new Date(),
      });
    }

    return cred.user;
  }

  /* ---------- Valor expuesto ---------- */
  const value = {
    user,
    register,
    login,
    loginWithGoogle,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
