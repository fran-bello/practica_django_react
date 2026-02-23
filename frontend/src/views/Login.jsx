import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import { Input } from "../components";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../api/client";

function Login() {
  // Hook de navegación para redirigir al usuario tras el login
  const navigate = useNavigate();
  // Hook de AuthContext: nos da la función 'dispatch' para actualizar el estado global de auth
  const { dispatch } = useAuth();
  
  // Estados locales para los campos del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Estado para manejar mensajes de error en los inputs
  const [errors, setErrors] = useState({ email: "", password: "" });
  // Estado para mostrar spinner o deshabilitar botón mientras carga
  const [loading, setLoading] = useState(false);

  // Función que maneja el envío del formulario
  function handleSubmit(e) {
    e.preventDefault(); // Evita que la página se recargue
    const nextErrors = { email: "", password: "" };

    // 1. Validaciones básicas en el cliente (campos vacíos)
    if (!email.trim()) {
      nextErrors.email = "Rellena este campo obligatorio.";
    }
    if (!password.trim()) {
      nextErrors.password = "Rellena este campo obligatorio.";
    }
    setErrors(nextErrors);
    
    // Si hay errores locales, detenemos la ejecución aquí
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    // 2. Iniciamos la carga (bloquea el botón)
    setLoading(true);

    // 3. Petición POST al endpoint de Django que valida credenciales
    // getApiUrl construye la URL completa (ej: http://localhost:8000/api-token-auth/)
    axios
      .post(getApiUrl("/api-token-auth/"), { email: email.trim(), password })
      .then((res) => {
        // 4. ÉXITO (res.data contiene { token: "...", email: "..." })
        
        // Guardamos token y email en el contexto global (AuthContext)
        // Esto a su vez disparará un useEffect que lo guarda en localStorage
        dispatch({
          type: "LOGIN",
          payload: { token: res.data.token, email: res.data.email },
        });

        // Redirigimos a la vista de tareas
        // 'replace: true' evita que el usuario pueda volver al Login con el botón "Atrás"
        navigate("/tareas", { replace: true });
      })
      .catch((err) => {
        // 5. ERROR (Credenciales inválidas, servidor caído, etc.)
        const msg =
          err.response?.data?.error ||   // Mensaje custom del backend
          err.response?.data?.detail ||  // Mensaje por defecto de DRF
          "Error al iniciar sesión.";
        
        // Intentamos asignar el error al campo correcto basándonos en el texto
        if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("no encontrado")) {
          setErrors({ email: msg, password: "" });
        } else {
          // Si no es específico del email, lo mostramos en el password o genérico
          setErrors({ email: "", password: msg });
        }
      })
      .finally(() => {
        // 6. FINALIZAR (Se ejecuta siempre)
        // Quitamos el estado de carga para rehabilitar el botón
        setLoading(false);
      });
  }

  return (
    // Contenedor principal centrado (pantalla completa)
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      {/* Tarjeta del formulario con estilos Tailwind (sombra, bordes redondeados) */}
      <div className="w-1/2 max-w-md bg-neutral-100 rounded-xl p-8 shadow-lg filter:blur-lg flex flex-col items-center">
        <img src={logo} alt="logo" className="logo w-2/3" />

        <form className="flex flex-col items-center justify-center w-full" onSubmit={handleSubmit}>
          {/* Input Email (componente reutilizable) */}
          <div className="mb-3 w-full">
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email} // Muestra mensaje de error si existe
            />
          </div>

          {/* Input Password */}
          <div className="mb-3 w-full">
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={loading} // Deshabilitado si está cargando
            className="text-sm w-full p-3 rounded-sm bg-zinc-700 hover:bg-zinc-900 text-white outline-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
