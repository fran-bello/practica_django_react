import { useRef } from 'react'
import { TareasForm, TareasList } from '../components'

function Tareas() {
    // Referencia "puente" para comunicar el Formulario con la Lista.
    // TareasList guardará aquí su función de recarga (fetchTasks).
    const listRefreshRef = useRef(null)

    return (
        // Contenedor principal centrado
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto px-4 md:px-0">
            <h2 className="text-base font-bold mt-4">Agregar Tarea</h2>
            
            {/* 
                Formulario de creación.
                onSuccess: Cuando se cree una tarea, ejecuta la función guardada en la referencia.
                El operador ?.() asegura que solo se ejecute si la referencia no es null.
            */}
            <TareasForm onSuccess={() => listRefreshRef.current?.()} />
            
            <h2 className="text-base font-bold mt-6 mb-2">Lista de tareas</h2>
            
            {/* 
                Lista de tareas.
                Le pasamos la referencia 'refresh' para que el componente hijo (TareasList)
                pueda "exponer" su función de recarga hacia el padre.
            */}
            <TareasList refresh={listRefreshRef} />
        </div>
    )
}

export default Tareas