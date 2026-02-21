import { Routes, Route, Navigate } from 'react-router-dom'
import { Login, Tareas } from './views'
import { Layout } from './components'
import { useAuth } from './context/AuthContext'
import './App.css'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/tareas" replace /> : <Login />} />
      <Route element={isAuthenticated ? <Layout /> : <Navigate to="/" replace />}>
        <Route path="/tareas" element={<Tareas />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
