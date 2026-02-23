import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../assets/logo.png";

function Layout() {
  const navigate = useNavigate();
  const { dispatch } = useAuth();

  function handleLogout() {
    dispatch({ type: "LOGOUT" });
    navigate("/", { replace: true });
  }

  return (
    <div className="w-screen h-screen">
      <header className="flex justify-between items-center gap-4 py-3 px-6 border-b border-gray-200 bg-neutral-50">
        <div className="flex items-center gap-2">
          <img src={Logo} alt="Logo" className="h-auto w-24" />
          <h2 className="text-base font-bold ml-2">Gestor de Tareas</h2>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs p-2 rounded-sm bg-zinc-700 text-white hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8"
          title="Cerrar sesión"
        >
          <i className="pi pi-sign-out"></i>
        </button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
