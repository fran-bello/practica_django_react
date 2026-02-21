import { useState } from 'react'

function Tareas() {
    return (
        <div>
            <h1>Tareas</h1>
            <form>
                <input type="text" placeholder="Título" />
                <input type="text" placeholder="Descripción" />
                <button type="submit">Agregar</button>
            </form>
        </div>
    )
}

export default Tareas