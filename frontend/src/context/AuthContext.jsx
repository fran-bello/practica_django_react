// --- Imports de React ---
// createContext: crea el "contenedor" donde guardaremos el estado de auth
// useContext: hook para LEER ese estado desde cualquier componente hijo
// useReducer: hook para tener un estado (state) y cambiarlo con acciones (dispatch)
// useEffect: para ejecutar lógica al montar el componente o cuando cambien dependencias
import { createContext, useContext, useReducer, useEffect } from "react";

// Clave con la que guardamos/leemos el objeto { token, email } en localStorage
const AUTH_KEY = "auth";

// Estado inicial del auth: sin token ni email (usuario no logueado)
const initialState = {
  token: null,
  email: null,
};

// Reducer: función pura que recibe (estadoActual, acción) y devuelve el NUEVO estado.
// Según action.type decidimos qué hacer; así el estado solo cambia de forma predecible.
function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      // Login: reemplazamos el estado con token y email que vienen en action.payload
      return { token: action.payload.token, email: action.payload.email ?? null };
    case "LOGOUT":
      // Logout: volvemos al estado inicial (todo null)
      return initialState;
    case "INIT":
      // Init: usado al cargar la app para rellenar el estado desde localStorage
      return action.payload ?? initialState;
    default:
      // Cualquier otra acción: no cambiamos nada
      return state;
  }
}

// Creamos el Context. El valor por defecto es null (si alguien usa useAuth fuera del Provider, ctx será null)
const AuthContext = createContext(null);

// --- AuthProvider: el componente que "envuelve" la app y PROVEE el estado de auth ---
export function AuthProvider({ children }) {
  // state = estado actual { token, email }; dispatch = función para enviar acciones (LOGIN, LOGOUT, INIT)
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Efecto que se ejecuta UNA vez al montar el componente (array de deps vacío [])
  // Objetivo: si el usuario ya se logueó antes, leer token/email de localStorage y ponerlos en el estado
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY); // ej: '{"token":"abc123","email":"a@b.com"}'
      if (stored) {
        const data = JSON.parse(stored);
        if (data.token) {
          dispatch({ type: "INIT", payload: { token: data.token, email: data.email ?? null } });
        }
      }
    } catch (_) {
      // Si no hay nada guardado o el JSON está corrupto, no hacemos nada
    }
  }, []);

  // Efecto que se ejecuta cada vez que cambian state.token o state.email
  // Objetivo: mantener localStorage sincronizado con el estado (persistir sesión o borrarla)
  useEffect(() => {
    if (state.token) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token: state.token, email: state.email }));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [state.token, state.email]);

  // Objeto que pasamos a todos los componentes que usen useAuth():
  // - ...state = token y email
  // - dispatch = para hacer login/logout (dispatch({ type: "LOGIN", payload: {...} }))
  // - isAuthenticated = true si hay token, false si no (!! convierte cualquier valor a booleano)
  const value = { ...state, dispatch, isAuthenticated: !!state.token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- useAuth: hook para CONSUMIR el contexto desde cualquier componente hijo de AuthProvider ---
export function useAuth() {
  const ctx = useContext(AuthContext); // ctx es el "value" que pasó el Provider (o null si no hay Provider)
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx; // { token, email, dispatch, isAuthenticated }
}
