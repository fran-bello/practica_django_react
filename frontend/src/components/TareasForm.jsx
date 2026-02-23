import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "../components";
import { useAuth } from "../context/AuthContext";
import { getApiUrl, getAuthHeaders } from "../api/client";

// Estilos reutilizables para inputs y selects
const selectClasses =
  "w-full text-sm p-3 rounded-sm border border-gray-300 outline-blue-200 outline-1 bg-white min-w-0";

export default function TareasForm({ onSuccess }) {
  const { token } = useAuth();
  
  // Estados para los campos del formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  // Estado para las opciones del select de categorías
  const [categories, setCategories] = useState([]);
  
  // Estado de carga para deshabilitar el botón
  const [loading, setLoading] = useState(false);

  // Cargar categorías al montar el componente
  useEffect(() => {
    if (!token) return;
    axios
      .get(getApiUrl("/api/categories/"), { headers: getAuthHeaders(token) })
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
  }, [token]);

  // Manejo del envío del formulario (Crear Tarea)
  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return; // Validación básica
    
    setLoading(true);
    axios
      .post(
        getApiUrl("/api/tasks/"),
        {
          title: title.trim(),
          description: description.trim() || null, // null si está vacío para evitar strings vacíos en BD
          category: categoryId ? Number(categoryId) : null,
          due_date: dueDate || null,
        },
        { headers: getAuthHeaders(token) }
      )
      .then(() => {
        // Limpiar el formulario tras el éxito
        setTitle("");
        setDescription("");
        setCategoryId("");
        setDueDate("");
        
        // Notificar al componente padre que se creó la tarea
        // (Esto disparará la recarga de la lista mediante la referencia en Tareas.jsx)
        onSuccess?.();
      })
      .finally(() => setLoading(false));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-nowrap items-end gap-2 w-full py-4"
    >
      {/* Campo Título */}
      <div className="flex-1 min-w-0">
        <Input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-0"
        />
      </div>

      {/* Campo Descripción */}
      <div className="flex-1 min-w-0">
        <Input
          type="text"
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mb-0"
        />
      </div>

      {/* Select Categoría */}
      <div className="flex-1 min-w-0 min-w-[140px]">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={selectClasses}
          aria-label="Categoría"
        >
          <option value="">Sin categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Input Fecha Límite */}
      <div className="min-w-0 w-[140px]">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={selectClasses}
          aria-label="Fecha límite"
        />
      </div>

      {/* Botón Submit */}
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="text-sm px-4 py-3 rounded-sm bg-zinc-700 hover:bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        {loading ? "…" : "Agregar"}
      </button>
    </form>
  );
}
