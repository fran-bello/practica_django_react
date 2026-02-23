/**
 * GUÍA RÁPIDA: MANIPULACIÓN DE ARRAYS EN REACT (CON ESTADO PREVIO)
 * ================================================================
 * Patrones genéricos para cualquier tipo de dato (Productos, Usuarios, Tareas, etc.)
 * 
 * Variable: 'items' (tu lista de datos)
 * Función:  'setItems' (tu actualizador de estado)
 * Hook:     const [items, setItems] = useState([]);
 */

// =========================================================================
// 1. AGREGAR UN ELEMENTO (CREATE)
// =========================================================================
// Agrega un objeto nuevo al final de la lista.

const handleCreate = (newItem) => {
  setItems((prev) => {
    // Retornamos un nuevo array con todo lo anterior + el nuevo
    return [...prev, newItem];
  });
};

// =========================================================================
// 2. ELIMINAR UN ELEMENTO (DELETE)
// =========================================================================
// Elimina el elemento que coincida con el ID.

const handleDelete = (itemIdToDelete) => {
  setItems((prev) => {
    // "Fíltrame la lista y quédate con todo lo que NO sea este ID"
    return prev.filter((item) => item.id !== itemIdToDelete);
  });
};

// =========================================================================
// 3. ACTUALIZAR UN ELEMENTO (UPDATE)
// =========================================================================
// Modifica una propiedad de un elemento específico.

const handleUpdate = (itemIdToUpdate, newData) => {
  setItems((prev) => {
    return prev.map((item) => {
      // ¿Es este el elemento que buscamos?
      if (item.id === itemIdToUpdate) {
        // SÍ: Retornamos una copia con los datos actualizados
        return { ...item, ...newData };
      }
      // NO: Retornamos el elemento original sin cambios
      return item;
    });
  });
};

// =========================================================================
// 4. ACTUALIZAR UN ELEMENTO ANIDADO (NESTED UPDATE)
// =========================================================================
// Ejemplo: Editar un "hijo" dentro de un "padre" (ej. Talla dentro de Producto, Comentario en Post).
// Requiere un .map() dentro de otro .map().

const handleUpdateChild = (parentId, childId, newChildData) => {
  setItems((prev) => {
    return prev.map((parent) => {
      // 1. Buscamos al padre
      if (parent.id === parentId) {
        return {
          ...parent,
          // 2. Mapeamos su lista de hijos (ej. 'children', 'subItems')
          children: parent.children.map((child) => {
            if (child.id === childId) {
              // 3. Actualizamos al hijo
              return { ...child, ...newChildData };
            }
            return child;
          }),
        };
      }
      return parent; // No es el padre, seguimos
    });
  });
};

// =========================================================================
// 5. ELIMINAR UN ELEMENTO ANIDADO (NESTED DELETE)
// =========================================================================
// Ejemplo: Borrar un hijo de un padre.
// Usamos .map() para hallar al padre y .filter() para borrar al hijo.

const handleDeleteChild = (parentId, childIdToDelete) => {
  setItems((prev) => {
    return prev.map((parent) => {
      // 1. Buscamos al padre
      if (parent.id === parentId) {
        return {
          ...parent,
          // 2. Filtramos la lista de hijos (borramos el que coincide)
          children: parent.children.filter((child) => child.id !== childIdToDelete),
        };
      }
      return parent;
    });
  });
};

// =========================================================================
// 6. AGREGAR UN ELEMENTO ANIDADO (NESTED ADD)
// =========================================================================
// Ejemplo: Agregar un nuevo hijo a un padre existente.

const handleAddChild = (parentId, newChild) => {
  setItems((prev) => {
    return prev.map((parent) => {
      // 1. Buscamos al padre
      if (parent.id === parentId) {
        return {
          ...parent,
          // 2. Creamos nueva lista de hijos: los anteriores + el nuevo
          children: [...parent.children, newChild],
        };
      }
      return parent;
    });
  });
};

export const cheatsheet = {
  handleCreate,
  handleDelete,
  handleUpdate,
  handleUpdateChild,
  handleDeleteChild,
  handleAddChild
};
