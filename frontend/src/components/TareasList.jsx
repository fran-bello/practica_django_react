import { useState, useEffect, Fragment } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getApiUrl, getAuthHeaders } from "../api/client";

// =========================================================================
// ESTILOS COMUNES (Tailwind classes)
// =========================================================================
const inputClasses =
  "w-full text-sm px-2 py-1 border border-gray-300 rounded outline-blue-200 outline-1 min-w-0";
const selectClasses =
  "w-full text-sm px-2 py-1 border border-gray-300 rounded outline-blue-200 outline-1 bg-white min-w-0";

const buttonClasses =
  "text-xs p-2 rounded-sm bg-zinc-700 text-white hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed";
const buttonDeleteClasses =
  "text-xs p-2 rounded-sm bg-red-400 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed";

// =========================================================================
// HELPERS (Formato de fechas)
// =========================================================================
function formatDate(value) {
  if (!value) return "—";
  // Asegura compatibilidad si la fecha viene sin hora (YYYY-MM-DD)
  const d = value.includes("T")
    ? new Date(value)
    : new Date(value + "T00:00:00");
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toInputDate(value) {
  if (!value) return "";
  // Convierte ISO string a YYYY-MM-DD para el input type="date"
  return value.includes("T") ? value.slice(0, 10) : value;
}

// =========================================================================
// COMPONENTE PRINCIPAL
// =========================================================================
export default function TareasList({ refresh }) {
  const { token } = useAuth();
  
  // --- ESTADOS DE DATOS ---
  const [tasks, setTasks] = useState([]);         // Lista principal de tareas
  const [categories, setCategories] = useState([]); // Lista de categorías para selects
  const [loading, setLoading] = useState(true);     // Spinner inicial

  // --- ESTADOS DE INTERFAZ (UI) ---
  const [togglingId, setTogglingId] = useState(null); // ID de tarea siendo marcada (loading checkbox)
  const [deletingId, setDeletingId] = useState(null); // ID de tarea siendo eliminada
  const [savingId, setSavingId] = useState(null);     // ID de tarea siendo guardada (edit)

  // --- ESTADOS DE EDICIÓN DE TAREA ---
  const [editingId, setEditingId] = useState(null);   // Qué tarea se está editando
  const [editDraft, setEditDraft] = useState(null);   // Copia temporal de los datos para editar
  const [editError, setEditError] = useState(null);   // Error de validación en edición

  // --- ESTADOS DE CREACIÓN DE SUBTAREA ---
  const [addSubtaskTaskId, setAddSubtaskTaskId] = useState(null); // ID de tarea padre a la que se agrega subtarea
  const [subtaskDraft, setSubtaskDraft] = useState({  // Formulario temporal de nueva subtarea
    title: "",
    description: "",
    due_date: "",
    category: "",
  });
  const [addingSubtaskId, setAddingSubtaskId] = useState(null); // Loading al guardar subtarea

  // --- ESTADOS DE EDICIÓN/ACCIÓN EN SUBTAREAS ---
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editSubtaskDraft, setEditSubtaskDraft] = useState(null);
  const [savingSubtaskId, setSavingSubtaskId] = useState(null);
  const [deletingSubtaskId, setDeletingSubtaskId] = useState(null);
  const [togglingSubtaskId, setTogglingSubtaskId] = useState(null);

  // --- FILTROS Y ORDENAMIENTO ---
  const [filterCompleted, setFilterCompleted] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // =======================================================================
  // CARGA DE DATOS
  // =======================================================================
  
  function fetchTasks() {
    if (!token) return;
    setLoading(true);
    axios
      .get(getApiUrl("/api/tasks/"), { headers: getAuthHeaders(token) })
      .then((res) => setTasks(res.data ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }

  // 1. Cargar tareas al montar o cambiar token
  useEffect(() => {
    fetchTasks();
  }, [token]);

  // 2. Cargar categorías al montar
  useEffect(() => {
    if (!token) return;
    axios
      .get(getApiUrl("/api/categories/"), { headers: getAuthHeaders(token) })
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
  }, [token]);

  // 3. Exponer fetchTasks al componente padre mediante la referencia 'refresh'
  useEffect(() => {
    if (refresh != null) refresh.current = fetchTasks;
  }, [refresh]);

  // =======================================================================
  // MANEJADORES DE ACCIONES (TAREAS PADRE)
  // =======================================================================

  // Marcar como completada/pendiente
  function handleToggleCompleted(task) {
    // 1. Bloqueamos el checkbox visualmente (loading) para evitar doble clic
    setTogglingId(task.id);

    // 2. Enviamos solo el campo 'completed' invertido al servidor (PATCH)
    axios
      .patch(
        getApiUrl(`/api/tasks/${task.id}/`),
        { completed: !task.completed },
        { headers: getAuthHeaders(token) },
      )
      .then((res) =>
        // 3. Éxito: Actualizamos el estado local SIN recargar toda la lista
        setTasks((prev) =>
          // Recorremos el array de tareas actual (prev)
          prev.map((t) =>
            // Si es la tarea que tocamos, creamos una copia con el nuevo valor
            // Si no, dejamos la tarea tal cual estaba
            t.id === task.id ? { ...t, completed: res.data.completed } : t,
          ),
        ),
      )
      .finally(() => 
        // 4. Desbloqueamos el checkbox
        setTogglingId(null)
      );
  }

  // Iniciar edición (copia datos al draft)
  function startEdit(task) {
    setEditingId(task.id);
    setEditError(null);
    setEditDraft({
      title: task.title,
      description: task.description || "",
      category: task.category ?? "",
      due_date: toInputDate(task.due_date || task.created_at),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
    setEditError(null);
  }

  function updateDraft(field, value) {
    setEditDraft((prev) => (prev ? { ...prev, [field]: value } : null));
    if (field === "title") setEditError(null);
  }

  // Guardar edición (PATCH)
  function saveEdit() {
    if (!editDraft || editingId == null) return;
    const title = editDraft.title?.trim();
    if (!title) {
      setEditError("El título es obligatorio.");
      return;
    }
    setEditError(null);
    setSavingId(editingId);
    axios
      .patch(
        getApiUrl(`/api/tasks/${editingId}/`),
        {
          title: editDraft.title.trim(),
          description: editDraft.description.trim() || null,
          category: editDraft.category ? Number(editDraft.category) : null,
          due_date: editDraft.due_date || null,
        },
        { headers: getAuthHeaders(token) },
      )
      .then((res) => {
        // Actualización optimista del estado local
        setTasks((prev) =>
          prev.map((t) => (t.id === editingId ? { ...t, ...res.data } : t)),
        );
        cancelEdit();
      })
      .catch((err) => {
        setEditError(
          err.response?.data?.title?.[0] ||
            err.response?.data?.detail ||
            "Error al guardar.",
        );
      })
      .finally(() => setSavingId(null));
  }

  // Eliminar tarea (DELETE)
  function handleDelete(task) {
    if (!window.confirm(`¿Eliminar la tarea "${task.title}"?`)) return;
    setDeletingId(task.id);
    axios
      .delete(getApiUrl(`/api/tasks/${task.id}/`), {
        headers: getAuthHeaders(token),
      })
      .then(() => setTasks((prev) => prev.filter((t) => t.id !== task.id)))
      .finally(() => setDeletingId(null));
  }

  // =======================================================================
  // MANEJADORES DE ACCIONES (CREAR SUBTAREA)
  // =======================================================================

  function startAddSubtask(task) {
    setAddSubtaskTaskId(task.id);
    setSubtaskDraft({ title: "", description: "", due_date: "", category: "" });
  }
  function cancelAddSubtask() {
    setAddSubtaskTaskId(null);
    setSubtaskDraft({ title: "", description: "", due_date: "", category: "" });
  }

  function handleAddSubtask(task) {
    const title = subtaskDraft.title?.trim();
    if (!title) return;
    setAddingSubtaskId(task.id);
    axios
      .post(
        getApiUrl("/api/subtasks/"),
        {
          task: task.id,
          title,
          description: subtaskDraft.description?.trim() || null,
          due_date: subtaskDraft.due_date || null,
          category: subtaskDraft.category
            ? Number(subtaskDraft.category)
            : null,
        },
        { headers: getAuthHeaders(token) },
      )
      .then((res) =>
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              // Agregamos la nueva subtarea al array 'subtasks' de la tarea padre
              ? { ...t, subtasks: [...(t.subtasks || []), res.data] }
              : t,
          ),
        ),
      )
      .then(cancelAddSubtask)
      .finally(() => setAddingSubtaskId(null));
  }

  // Pedir a la IA que categorice una tarea
  function handleCategorize(task) {
    // 1. Confirmación de seguridad
    if (!window.confirm(`¿Pedir a la IA que categorice "${task.title}"?`)) return;
    
    // 2. Feedback visual (cambiamos el cursor a "esperando")
    document.body.style.cursor = "wait"; 

    // 3. Llamada al endpoint que creamos en Django
    axios
      .post(getApiUrl(`/api/tasks/${task.id}/categorize/`), {}, {
        headers: getAuthHeaders(token),
      })
      .then((res) => {
        // 4. Éxito: Mostramos qué decidió la IA
        const { message } = res.data;
        alert(message); 
        
        // 5. Recargamos la tabla para que aparezca la nueva categoría
        // (Usamos la referencia que explicamos antes)
        if (refresh?.current) refresh.current();
      })
      .catch((err) => {
        console.error(err);
        const errorMsg = err.response?.data?.error || "Error al consultar la IA";
        alert(errorMsg);
      })
      .finally(() => {
        // 6. Restauramos el cursor
        document.body.style.cursor = "default";
      });
  }

  // =======================================================================
  // MANEJADORES DE ACCIONES (SUBTAREAS EXISTENTES)
  // =======================================================================

  function startEditSubtask(st) {
    setEditingSubtaskId(st.id);
    setEditSubtaskDraft({
      title: st.title,
      description: st.description || "",
      due_date: toInputDate(st.due_date || st.created_at),
      category: st.category ?? "",
    });
  }
  function cancelEditSubtask() {
    setEditingSubtaskId(null);
    setEditSubtaskDraft(null);
  }
  function updateSubtaskDraft(field, value) {
    setEditSubtaskDraft((prev) => (prev ? { ...prev, [field]: value } : null));
  }

  function saveSubtaskEdit(st, task) {
    if (!editSubtaskDraft || editingSubtaskId !== st.id) return;
    const title = editSubtaskDraft.title?.trim();
    if (!title) return;
    setSavingSubtaskId(st.id);
    axios
      .patch(
        getApiUrl(`/api/subtasks/${st.id}/`),
        {
          title,
          description: editSubtaskDraft.description?.trim() || null,
          due_date: editSubtaskDraft.due_date || null,
          category: editSubtaskDraft.category
            ? Number(editSubtaskDraft.category)
            : null,
        },
        { headers: getAuthHeaders(token) },
      )
      .then((res) =>
        // Actualizamos la subtarea específica dentro del array subtasks del padre
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) =>
                    s.id === st.id ? res.data : s,
                  ),
                }
              : t,
          ),
        ),
      )
      .then(cancelEditSubtask)
      .finally(() => setSavingSubtaskId(null));
  }

  function handleDeleteSubtask(st, task) {
    if (!window.confirm(`¿Eliminar la subtarea "${st.title}"?`)) return;
    setDeletingSubtaskId(st.id);
    axios
      .delete(getApiUrl(`/api/subtasks/${st.id}/`), {
        headers: getAuthHeaders(token),
      })
      .then(() =>
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).filter((s) => s.id !== st.id),
                }
              : t,
          ),
        ),
      )
      .finally(() => setDeletingSubtaskId(null));
  }

  function handleToggleSubtaskCompleted(st, task) {
    setTogglingSubtaskId(st.id);
    axios
      .patch(
        getApiUrl(`/api/subtasks/${st.id}/`),
        { completed: !st.completed },
        { headers: getAuthHeaders(token) },
      )
      .then((res) =>
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) =>
                    s.id === st.id
                      ? { ...s, completed: res.data.completed }
                      : s,
                  ),
                }
              : t,
          ),
        ),
      )
      .finally(() => setTogglingSubtaskId(null));
  }

  // =======================================================================
  // LÓGICA DE FILTRADO Y ORDENAMIENTO (Cliente)
  // =======================================================================
  
  const displayedTasks = [...tasks]
    .filter((task) => {
      // Filtro Completadas
      if (filterCompleted === "true" && !task.completed) return false;
      if (filterCompleted === "false" && task.completed) return false;
      // Filtro Categoría
      if (filterCategory && String(task.category) !== String(filterCategory))
        return false;
      // Filtro Búsqueda (Texto)
      if (filterSearch.trim()) {
        const q = filterSearch.trim().toLowerCase();
        if (
          !(task.title || "").toLowerCase().includes(q) &&
          !(task.description || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Lógica de ordenamiento dinámico por columna
      if (!sortBy) return 0;
      const mul = sortOrder === "asc" ? 1 : -1;
      let va = a[sortBy],
        vb = b[sortBy];
      if (sortBy === "due_date" || sortBy === "created_at") {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
        return mul * (va - vb);
      }
      if (sortBy === "completed")
        return mul * (Number(!!a.completed) - Number(!!b.completed));
      va = (va ?? "").toString().toLowerCase();
      vb = (vb ?? "").toString().toLowerCase();
      return mul * va.localeCompare(vb);
    });

  function handleSort(column) {
    if (sortBy === column) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortOrder("asc");
    }
  }
  function clearFilters() {
    setFilterSearch("");
    setFilterCompleted("");
    setFilterCategory("");
    setSortBy("");
    setSortOrder("asc");
  }

  // Icono helper para headers
  const SortIcon = ({ col }) =>
    sortBy !== col ? (
      <span className="opacity-40">↕</span>
    ) : sortOrder === "asc" ? (
      " ↑"
    ) : (
      " ↓"
    );

  // =======================================================================
  // RENDERIZADO
  // =======================================================================

  if (loading)
    return <div className="py-4 text-gray-500 text-sm">Cargando tareas…</div>;
  if (tasks.length === 0)
    return (
      <div className="py-4 text-gray-500 text-sm">
        No hay tareas. Agrega una arriba.
      </div>
    );

  return (
    <div className="w-full">
      {/* BARRA DE FILTROS */}
      <div className="flex flex-wrap items-center gap-3 mb-3 p-3 bg-gray-50 rounded border border-gray-200">
        <input
          type="text"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder="Buscar en título o descripción"
          className={`${inputClasses} max-w-[220px] mb-0`}
        />
        <select
          value={filterCompleted}
          onChange={(e) => setFilterCompleted(e.target.value)}
          className={selectClasses}
          style={{ width: "auto", minWidth: "140px" }}
        >
          <option value="">Todas</option>
          <option value="false">Pendientes</option>
          <option value="true">Completadas</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={selectClasses}
          style={{ width: "auto", minWidth: "140px" }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={clearFilters}
          className={buttonClasses}
        >
          Limpiar filtros
        </button>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="w-10 px-3 py-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSort("completed")}
                  className="bg-transparent inline-flex items-center justify-center whitespace-nowrap"
                >
                  ✓ <SortIcon col="completed" />
                </button>
              </th>
              <th className="px-3 py-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSort("title")}
                  className="bg-transparent inline-flex items-center justify-center whitespace-nowrap"
                >
                  Nombre <SortIcon col="title" />
                </button>
              </th>
              <th className="px-3 py-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSort("description")}
                  className="bg-transparent inline-flex items-center justify-center whitespace-nowrap"
                >
                  Descripción <SortIcon col="description" />
                </button>
              </th>
              <th className="px-3 py-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSort("category_name")}
                  className="bg-transparent inline-flex items-center justify-center whitespace-nowrap"
                >
                  Categoría <SortIcon col="category_name" />
                </button>
              </th>
              <th className="px-3 py-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSort("due_date")}
                  className="bg-transparent inline-flex items-center justify-center whitespace-nowrap"
                >
                  Fecha <SortIcon col="due_date" />
                </button>
              </th>
              <th className="px-3 py-2 text-xs min-w-[200px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayedTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-gray-500 text-sm"
                >
                  Ninguna tarea coincide con los filtros.
                </td>
              </tr>
            ) : (
              displayedTasks.map((task) => {
                const isEditing = editingId === task.id;
                const draft = isEditing ? editDraft : null;
                return (
                  <Fragment key={task.id}>
                    {/* FILA DE TAREA PADRE */}
                    <tr
                      className={
                        task.completed
                          ? "bg-gray-50 opacity-80"
                          : "hover:bg-gray-50"
                      }
                    >
                      {/* Checkbox Completado */}
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleted(task)}
                          disabled={togglingId === task.id}
                          className="bg-white w-5 h-5 p-0 rounded border border-gray-400 flex items-center justify-center disabled:opacity-50"
                        >
                          {task.completed && (
                            <span className="text-green-600 text-sm leading-none">
                              ✓
                            </span>
                          )}
                        </button>
                      </td>
                      {/* Título (Editable) */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={draft?.title ?? ""}
                              onChange={(e) =>
                                updateDraft("title", e.target.value)
                              }
                              className={`${inputClasses} ${editError ? "border-red-500" : ""}`}
                              placeholder="Título"
                              aria-invalid={!!editError}
                            />
                            {editError && (
                              <p className="text-red-600 text-xs mt-0.5">
                                {editError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span
                            className={
                              task.completed
                                ? "line-through text-gray-500"
                                : "font-medium text-gray-900"
                            }
                          >
                            {task.title}
                          </span>
                        )}
                      </td>
                      {/* Descripción */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <input
                            type="text"
                            value={draft?.description ?? ""}
                            onChange={(e) =>
                              updateDraft("description", e.target.value)
                            }
                            className={inputClasses}
                            placeholder="Descripción"
                          />
                        ) : (
                          <span className="text-gray-600 max-w-xs truncate block">
                            {task.description || "—"}
                          </span>
                        )}
                      </td>
                      {/* Categoría */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <select
                            value={draft?.category ?? ""}
                            onChange={(e) =>
                              updateDraft("category", e.target.value)
                            }
                            className={selectClasses}
                          >
                            <option value="">Sin categoría</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-500">
                            {task.category_name || "—"}
                          </span>
                        )}
                      </td>
                      {/* Fecha */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <input
                            type="date"
                            value={draft?.due_date ?? ""}
                            onChange={(e) =>
                              updateDraft("due_date", e.target.value)
                            }
                            className={inputClasses}
                          />
                        ) : (
                          <span className="text-gray-500 whitespace-nowrap">
                            {formatDate(task.due_date || task.created_at)}
                          </span>
                        )}
                      </td>
                      {/* Botones de Acción */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={
                                savingId === task.id || !draft?.title?.trim()
                              }
                              className="text-xs p-2 rounded-sm bg-green-600 text-white hover:bg-green-800"
                            >
                              {savingId === task.id ? "…" : "Guardar"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={savingId === task.id}
                              className={buttonClasses}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => startEdit(task)}
                              className={buttonClasses}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => startAddSubtask(task)}
                              disabled={addSubtaskTaskId != null}
                              className="text-xs p-2 rounded-sm bg-zinc-700 text-white hover:bg-zinc-900 disabled:opacity-50"
                            >
                              + subtarea
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCategorize(task)}
                              className={buttonClasses}
                              title="Categorizar con IA (próximamente)"
                            >
                              Categorizar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(task)}
                              disabled={deletingId === task.id}
                              className={buttonDeleteClasses}
                            >
                              {deletingId === task.id ? "…" : "Eliminar"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    {/* FILAS DE SUBTAREAS */}
                    {(task.subtasks || []).map((st) => {
                      const isEditingSt = editingSubtaskId === st.id;
                      const draftSt = isEditingSt ? editSubtaskDraft : null;
                      return (
                        <tr key={st.id} className="bg-gray-50/80">
                          <td className="px-3 py-1.5 w-10">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleSubtaskCompleted(st, task)
                              }
                              disabled={togglingSubtaskId === st.id}
                              className="ml-5 bg-white w-5 h-5 p-0 rounded border border-gray-400 flex items-center justify-center disabled:opacity-50"
                            >
                              {st.completed ? "✓" : ""}
                            </button>
                          </td>
                          <td className="px-3 py-1.5 pl-8">
                            {isEditingSt ? (
                              <input
                                type="text"
                                value={draftSt?.title ?? ""}
                                onChange={(e) =>
                                  updateSubtaskDraft("title", e.target.value)
                                }
                                className={`${inputClasses} max-w-[180px]`}
                                placeholder="Título"
                              />
                            ) : (
                              <span
                                className={
                                  st.completed
                                    ? "line-through text-gray-500"
                                    : "text-gray-600"
                                }
                              >
                                {st.title}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            {isEditingSt ? (
                              <input
                                type="text"
                                value={draftSt?.description ?? ""}
                                onChange={(e) =>
                                  updateSubtaskDraft(
                                    "description",
                                    e.target.value,
                                  )
                                }
                                className={`${inputClasses} max-w-[180px]`}
                                placeholder="Descripción"
                              />
                            ) : (
                              <span className="text-gray-500 max-w-xs truncate block">
                                {st.description || "—"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            {isEditingSt ? (
                              <select
                                value={draftSt?.category ?? ""}
                                onChange={(e) =>
                                  updateSubtaskDraft("category", e.target.value)
                                }
                                className={`${selectClasses} max-w-[120px]`}
                              >
                                <option value="">Sin categoría</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-gray-500">
                                {st.category_name || "—"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            {isEditingSt ? (
                              <input
                                type="date"
                                value={draftSt?.due_date ?? ""}
                                onChange={(e) =>
                                  updateSubtaskDraft("due_date", e.target.value)
                                }
                                className={`${inputClasses} max-w-[140px]`}
                              />
                            ) : (
                              <span className="text-gray-500 whitespace-nowrap">
                                {formatDate(st.due_date || st.created_at)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            {isEditingSt ? (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => saveSubtaskEdit(st, task)}
                                  disabled={
                                    savingSubtaskId === st.id ||
                                    !draftSt?.title?.trim()
                                  }
                                  className="text-xs p-2 rounded-sm bg-green-600 text-white hover:bg-green-800 disabled:opacity-50"
                                >
                                  {savingSubtaskId === st.id ? "…" : "Guardar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditSubtask}
                                  disabled={savingSubtaskId === st.id}
                                  className={buttonClasses}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditSubtask(st)}
                                  className={buttonClasses}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubtask(st, task)}
                                  disabled={deletingSubtaskId === st.id}
                                  className={buttonDeleteClasses}
                                >
                                  {deletingSubtaskId === st.id
                                    ? "…"
                                    : "Eliminar"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* FORMULARIO AGREGAR SUBTAREA (INLINE) */}
                    {addSubtaskTaskId === task.id && (
                      <tr className="bg-blue-50/50">
                        <td colSpan={6} className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={subtaskDraft.title}
                              onChange={(e) =>
                                setSubtaskDraft((p) => ({
                                  ...p,
                                  title: e.target.value,
                                }))
                              }
                              className={`${inputClasses} max-w-[200px]`}
                              placeholder="Título de la subtarea"
                            />
                            <input
                              type="text"
                              value={subtaskDraft.description}
                              onChange={(e) =>
                                setSubtaskDraft((p) => ({
                                  ...p,
                                  description: e.target.value,
                                }))
                              }
                              className={`${inputClasses} max-w-[200px]`}
                              placeholder="Descripción (opcional)"
                            />
                            <select
                              value={subtaskDraft.category}
                              onChange={(e) =>
                                setSubtaskDraft((p) => ({
                                  ...p,
                                  category: e.target.value,
                                }))
                              }
                              className={`${selectClasses} max-w-[140px]`}
                            >
                              <option value="">Sin categoría</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={subtaskDraft.due_date}
                              onChange={(e) =>
                                setSubtaskDraft((p) => ({
                                  ...p,
                                  due_date: e.target.value,
                                }))
                              }
                              className={`${inputClasses} max-w-[140px]`}
                              aria-label="Fecha"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSubtask(task)}
                              disabled={
                                addingSubtaskId === task.id ||
                                !subtaskDraft.title?.trim()
                              }
                              className="text-xs p-2 rounded-sm bg-zinc-700 text-white hover:bg-zinc-900 disabled:opacity-50"
                            >
                              {addingSubtaskId === task.id ? "…" : "Agregar"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelAddSubtask}
                              disabled={addingSubtaskId === task.id}
                              className={buttonClasses}
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
