import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Login, Tareas } from './views'
import './App.css'

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/tareas" element={<Tareas />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
