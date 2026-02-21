import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import { Input } from "../components";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../api/client";

function Login() {
  const navigate = useNavigate();
  const { dispatch } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = { email: "", password: "" };
    if (!email.trim()) {
      nextErrors.email = "Rellena este campo obligatorio.";
    }
    if (!password.trim()) {
      nextErrors.password = "Rellena este campo obligatorio.";
    }
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setLoading(true);
    // POST al endpoint de Django que valida email/password y devuelve un token
    axios
      .post(getApiUrl("/api-token-auth/"), { email: email.trim(), password })
      .then((res) => {
        // Éxito: guardamos token y email en el contexto (AuthContext) y en localStorage
        dispatch({
          type: "LOGIN",
          payload: { token: res.data.token, email: res.data.email },
        });
        // Redirigimos a /tareas (replace: true para no dejar "Login" en el historial)
        navigate("/tareas", { replace: true });
      })
      .catch((err) => {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          "Error al iniciar sesión.";
        // Asignar el error al campo correcto según lo que devuelve el backend
        if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("no encontrado")) {
          setErrors({ email: msg, password: "" });
        } else {
          setErrors({ email: "", password: msg });
        }
      })
      .finally(() => {
        // Siempre (éxito o error): quitamos el estado de carga del botón
        setLoading(false);
      });
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <div className="w-1/2 max-w-md bg-neutral-100 rounded-xl p-8 shadow-lg filter:blur-lg flex flex-col items-center">
        <img src={logo} alt="logo" className="logo w-2/3" />

        <form className="flex flex-col items-center justify-center w-full" onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <button
            type="submit"
            disabled={loading}
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
