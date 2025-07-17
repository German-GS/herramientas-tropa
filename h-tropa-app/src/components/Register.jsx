import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import Swal from "sweetalert2";
import styles from "../styles/components/Register.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Register() {
  const [rol, setRol] = useState("protagonista");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const nav = useNavigate();

  const initialValues = {
    rol: "protagonista",
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    correo: "",
    password: "",
    confirmPassword: "",
    fechaNacimiento: "",
    genero: "",
    telefono: "",
    fechaIngresoMovimiento: "",
    responsableNombre: "",
    direccion: "",
    conQuienVive: "",
    contactoEmergencia: "",
    telefonoEmergencia: "",
    alergias: "",
    centroSalud: "",
    fechaIngresoAdulto: "",
    cargo: "",
    cursos: "",
    tipoSangre: "",
    contactoEmergenciaDir: "",
    telefonoEmergenciaDir: "",
  };

  const validationSchema = Yup.object({
    primerNombre: Yup.string().required("El primer nombre es obligatorio"),
    primerApellido: Yup.string().required("El primer apellido es obligatorio"),
    correo: Yup.string()
      .email("Formato de correo inválido")
      .required("El correo es obligatorio"),
    password: Yup.string()
      .required("La contraseña es obligatoria")
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\S]{8,}$/,
        "Debe contener al menos una mayúscula, una minúscula y un número"
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Las contraseñas deben coincidir")
      .required("Debes confirmar la contraseña"),
  });

  const handleRolChange = (e, setFieldValue) => {
    const nuevoRol = e.target.value;
    setRol(nuevoRol);
    setFieldValue("rol", nuevoRol);
  };

  const handleRegister = async (values, actions) => {
    const { correo, password, ...formData } = values;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        correo,
        password
      );
      const user = userCredential.user;

      delete formData.password;
      delete formData.confirmPassword;
      formData.userId = user.uid;
      formData.fechaRegistro = new Date();

      await addDoc(collection(db, "miembros"), formData);

      Swal.fire({
        icon: "success",
        title: "¡Registro Exitoso!",
        text: "Tu cuenta ha sido creada. Serás redirigido a la página de inicio de sesión.",
        timer: 3000,
        timerProgressBar: true,
        allowOutsideClick: false,
      }).then(() => {
        nav("/login");
      });
    } catch (error) {
      let errorMessage =
        "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "Este correo electrónico ya está registrado. Por favor, utiliza otro.";
      }

      Swal.fire({
        icon: "error",
        title: "Error en el Registro",
        text: errorMessage,
      });
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <div className={styles.registroContainer}>
      <div className={styles.registroCard}>
        <button
          type="button"
          onClick={() => nav("/login")}
          className={styles.btnRegresar}
        >
          ← Regresar
        </button>
        <h2 className={styles.titulo}>Registro de Miembros</h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleRegister}
        >
          {({ isSubmitting, setFieldValue }) => (
            <Form className={styles.registroForm}>
              {/* Las secciones 1 y 2 no cambian */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Información de Cuenta</h3>
                <div className={styles.columnaSimple}>
                  <label className={styles.label}>Rol en el Movimiento:</label>
                  <Field
                    as="select"
                    name="rol"
                    className={styles.select}
                    onChange={(e) => handleRolChange(e, setFieldValue)}
                    value={rol}
                  >
                    <option value="protagonista">Protagonista (Juvenil)</option>
                    <option value="dirigente">Dirigente (Adulto)</option>
                  </Field>
                </div>
                <div className={styles.columnaSimple}>
                  <Field
                    name="correo"
                    type="email"
                    className={styles.input}
                    placeholder="Correo Electrónico"
                  />
                  <ErrorMessage
                    name="correo"
                    component="div"
                    className={styles.error}
                  />
                </div>
                <div className={styles.columnaDoble}>
                  <div className={styles.passwordInputContainer}>
                    <Field
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={styles.input}
                      placeholder="Contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.passwordToggle}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <div className={styles.passwordInputContainer}>
                    <Field
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className={styles.input}
                      placeholder="Confirmar Contraseña"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className={styles.passwordToggle}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className={styles.columnaDoble}>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className={styles.error}
                  />
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className={styles.error}
                  />
                </div>
              </div>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Datos Personales</h3>
                <div className={styles.columnaDoble}>
                  <Field
                    name="primerNombre"
                    className={styles.input}
                    placeholder="Primer Nombre"
                  />
                  <Field
                    name="segundoNombre"
                    className={styles.input}
                    placeholder="Segundo Nombre (Opcional)"
                  />
                </div>
                <div className={styles.columnaDoble}>
                  <ErrorMessage
                    name="primerNombre"
                    component="div"
                    className={styles.error}
                  />
                </div>
                <div className={styles.columnaDoble}>
                  <Field
                    name="primerApellido"
                    className={styles.input}
                    placeholder="Primer Apellido"
                  />
                  <Field
                    name="segundoApellido"
                    className={styles.input}
                    placeholder="Segundo Apellido (Opcional)"
                  />
                </div>
                <div className={styles.columnaDoble}>
                  <ErrorMessage
                    name="primerApellido"
                    component="div"
                    className={styles.error}
                  />
                </div>
                <div className={styles.columnaDoble}>
                  <Field
                    name="telefono"
                    className={styles.input}
                    placeholder="Teléfono"
                  />
                  <Field as="select" name="genero" className={styles.select}>
                    <option value="">Selecciona tu Género</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </Field>
                </div>
                <div className={styles.columnaSimple}>
                  <label className={styles.label}>Fecha de Nacimiento:</label>
                  <Field
                    name="fechaNacimiento"
                    type="date"
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Sección de Protagonista no cambia */}
              {rol === "protagonista" && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    Información del Protagonista
                  </h3>
                  <div className={styles.columnaDoble}>
                    <div>
                      <label className={styles.label}>
                        Ingreso al Movimiento:
                      </label>
                      <Field
                        name="fechaIngresoMovimiento"
                        type="date"
                        className={styles.input}
                      />
                    </div>
                    <div>
                      <label className={styles.label}>
                        Nombre del Responsable:
                      </label>
                      <Field
                        name="responsableNombre"
                        className={styles.input}
                        placeholder="Nombre completo"
                      />
                    </div>
                  </div>
                  <div className={styles.columnaDoble}>
                    <Field
                      name="direccion"
                      className={styles.input}
                      placeholder="Dirección Exacta"
                    />
                    <Field
                      name="conQuienVive"
                      className={styles.input}
                      placeholder="¿Con quién vive?"
                    />
                  </div>
                  <div className={styles.columnaDoble}>
                    <Field
                      name="contactoEmergencia"
                      className={styles.input}
                      placeholder="Contacto de Emergencia"
                    />
                    <Field
                      name="telefonoEmergencia"
                      className={styles.input}
                      placeholder="Tel. Emergencia"
                    />
                  </div>
                  <div className={styles.columnaDoble}>
                    <Field
                      name="alergias"
                      className={styles.input}
                      placeholder="Alergias / Medicamentos"
                    />
                    <Field
                      name="centroSalud"
                      className={styles.input}
                      placeholder="Centro de Salud cercano"
                    />
                  </div>
                </div>
              )}

              {/* --- CAMBIOS APLICADOS AQUÍ --- */}
              {rol === "dirigente" && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    Información del Dirigente
                  </h3>
                  <div className={styles.columnaDoble}>
                    <div>
                      <label className={styles.label}>
                        Ingreso como adulto:
                      </label>
                      <Field
                        name="fechaIngresoAdulto"
                        type="date"
                        className={styles.input}
                      />
                    </div>
                    <div>
                      <label className={styles.label}>
                        Cargo que desempeña:
                      </label>
                      <Field
                        name="cargo"
                        className={styles.input}
                        placeholder="Ej: Jefe de Tropa"
                      />
                    </div>
                  </div>
                  <div className={styles.columnaDoble}>
                    <div>
                      {/* 1. Etiqueta actualizada */}
                      <label className={styles.label}>
                        Nivel de formación:
                      </label>
                      {/* 2. Campo convertido a <select> con las nuevas opciones */}
                      <Field
                        as="select"
                        name="cursos"
                        className={styles.select}
                      >
                        <option value="">Seleccionar nivel...</option>
                        <option value="inicial">Inicial</option>
                        <option value="base">Base</option>
                        <option value="insignia_de_madera">
                          Insignia de Madera
                        </option>
                      </Field>
                    </div>
                    <div>
                      <label className={styles.label}>Tipo de sangre:</label>
                      <Field
                        as="select"
                        name="tipoSangre"
                        className={styles.select}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </Field>
                    </div>
                  </div>
                  <div className={styles.columnaDoble}>
                    <Field
                      name="contactoEmergenciaDir"
                      className={styles.input}
                      placeholder="Contacto de Emergencia"
                    />
                    <Field
                      name="telefonoEmergenciaDir"
                      className={styles.input}
                      placeholder="Tel. Emergencia"
                    />
                  </div>
                </div>
              )}

              <button
                className={styles.registrarBtn}
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registrando..." : "Registrar Miembro"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
