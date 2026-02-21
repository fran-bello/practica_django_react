import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Layout() {
  const navigate = useNavigate()
  const { dispatch } = useAuth()

  function handleLogout() {
    dispatch({ type: 'LOGOUT' })
    navigate('/', { replace: true })
  }

  return (
    <div>
      <header className="flex justify-end items-center gap-4 p-4 border-b border-gray-200 bg-neutral-50">
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded border border-gray-400 hover:bg-gray-100"
        >
          Cerrar sesión
        </button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
