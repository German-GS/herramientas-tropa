// src/components/Dashboard.jsx
// Este componente ahora actuará como un "enrutador" basado en el rol del usuario.
// Por ahora, mostrará directamente el panel del protagonista.

import React from "react";
// import { useAuth } from "../contexts/AuthContext"; // Ya no es necesario aquí si lo usamos en los sub-componentes

// Importamos el nuevo panel
import ProtagonistaDashboard from "../components/ProtagonistasDashboard";

export default function Dashboard() {
  // const { user } = useAuth(); // Podrías usar esto para obtener datos de Firestore y decidir qué panel mostrar

  // Lógica futura:
  // const [userData, setUserData] = useState(null);
  // useEffect(() => {
  //   // Fetch de datos de Firestore para obtener el rol del usuario
  //   // const userRole = fetchUserRole(user.uid);
  //   // setUserData({ role: userRole });
  // }, [user.uid]);

  // if (userData?.role === 'dirigente') {
  //   return <DirigenteDashboard />;
  // }

  // Por ahora, mostramos directamente el panel del Protagonista
  return <ProtagonistaDashboard />;
}
