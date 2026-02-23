import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.output_parsers import JsonOutputParser


def suggest_category(title: str, description: str, categories: list[str]) -> str:
    # 1. Preparamos la lista de categorías como un string separado por comas
    #    Ej: "Trabajo, Personal, Salud"
    categories_str = ", ".join(categories)

    # 2. Inicializamos el modelo de chat (GPT-4o mini es rápido y económico)
    #    temperature=0 hace que sea determinista (siempre responde lo mismo ante el mismo input)
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    # 3. Definimos la plantilla del prompt (Instrucciones para la IA)
    prompt = ChatPromptTemplate.from_messages([
        # Rol del sistema: Define comportamiento general
        ("system", "Eres un asistente experto en productividad. Tu trabajo es categorizar tareas."),
        
        # Mensaje del usuario: Le damos el contexto (categorías disponibles) y la tarea
        ("user", f"Tengo las siguientes categorías disponibles: {categories_str}.\n"
                 "Clasifica la siguiente tarea EN UNA de esas categorías exactas.\n"
                 "Si ninguna encaja perfectamente, elige la más cercana o 'General'.\n"
                 "Responde SOLO con el nombre de la categoría, sin puntos ni explicaciones extra.\n\n"
                 "Tarea: {title}\n"
                 "Descripción: {description}")
    ])

    # 4. Creamos la "cadena" (Chain): Prompt -> Modelo -> Parser de Texto
    #    El Parser asegura que obtengamos un string limpio en lugar de un objeto mensaje complejo
    chain = prompt | llm | StrOutputParser()
    
    try:
        # 5. Ejecutamos la cadena enviando los datos dinámicos
        response = chain.invoke({
            "title": title, 
            "description": description
        })
        return response.strip() # Limpiamos espacios en blanco extra
    except Exception as e:
        # Si falla (ej. sin internet, API key inválida), devolvemos una categoría por defecto
        print(f"Error al categorizar la tarea: {e}")
        return "General"

def suggest_next_subtask(task_title, existing_subtasks=[]) -> dict:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.4) 

    existing_str = ", ".join(existing_subtasks) if existing_subtasks else "Ninguna"

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Eres un experto en gestión de proyectos."),
        ("user", f"Tarea principal: '{task_title}'.\n"
                 f"Subtareas ya completadas/existentes: {existing_str}.\n"
                 "Piensa cuál es el SIGUIENTE paso lógico necesario.\n"
                 "Responde EXCLUSIVAMENTE con un objeto JSON con dos campos: 'title' (corto y accionable) y 'description' (breve explicación).\n"
                 "Ejemplo: {{ \"title\": \"Investigar librerías\", \"description\": \"Comparar opciones en Github\" }}")
    ])

    chain = prompt | llm | JsonOutputParser()

    try:
        response = chain.invoke({})
        return response 
    except Exception as e:
        print(f"Error AI Next Subtask: {e}")
        return None