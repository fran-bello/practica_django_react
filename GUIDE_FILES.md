# GUÍA DE ARCHIVOS A CREAR Y MODIFICAR (BACKEND Y FRONTEND)

Esta guía detalla, archivo por archivo, qué debes crear o modificar para levantar el proyecto desde cero. Además, explica la arquitectura y lógica de negocio para que puedas replicar este patrón en otros proyectos.

## 1. Configuración Inicial (Fase 0 y 1)

### `.env` (Raíz)
Variables de entorno para credenciales.
```text
DB_NAME=taskdb
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
OPENAI_API_KEY=tu_clave_aqui
```

### `backend/requirements.txt`
Dependencias de Python.
```text
django>=5.0
djangorestframework>=3.14
psycopg2-binary>=2.9
django-cors-headers>=4.3
python-dotenv>=1.0
```

### `backend/Dockerfile`
Instrucciones para construir la imagen del backend.
```dockerfile
FROM python:3.12-slim
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### `docker-compose.yml` (Raíz)
Orquestación de contenedores (DB + Backend).
```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - db

volumes:
  postgres_data:
```

---

## 2. Configuración de Django (Fase 2)

### `backend/config/settings.py`
Registrar apps y configurar middleware.

1.  **INSTALLED_APPS**:
    ```python
    INSTALLED_APPS = [
        # ... (apps por defecto)
        'rest_framework',
        'rest_framework.authtoken', # Para autenticación
        'corsheaders',              # Para frontend
        'tasks',                    # Tu app
    ]
    ```

2.  **MIDDLEWARE**: Agregar al inicio.
    ```python
    MIDDLEWARE = [
        'corsheaders.middleware.CorsMiddleware', # <--- PRIMERO
        # ...
    ]
    ```

3.  **Configuración Extra** (al final):
    ```python
    CORS_ALLOW_ALL_ORIGINS = True
    CSRF_TRUSTED_ORIGINS = ["http://localhost:8000"]
    REST_FRAMEWORK = {
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework.authentication.TokenAuthentication',
        ],
        'DEFAULT_PERMISSION_CLASSES': [
            'rest_framework.permissions.IsAuthenticated',
        ],
    }
    ```

---

## 3. Modelos y Admin (Fase 2)

### `backend/tasks/models.py`
Definición de tablas.
```python
from django.db import models
from django.contrib.auth.models import User

# Extensión de Usuario (Perfil)
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=[('admin', 'Admin'), ('user', 'User')], default='user')
    avatar = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True)

class Category(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name

class Task(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    completed = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    ai_classification = models.CharField(max_length=50, blank=True, null=True)
    due_date = models.DateTimeField(blank=True, null=True) # Agregado recientemente
    created_at = models.DateTimeField(auto_now_add=True)

class Subtask(models.Model): # Agregado recientemente
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    completed = models.BooleanField(default=False)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    due_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 4. API REST (Fase 3)

### `backend/tasks/serializers.py`
Transformación de datos (Model -> JSON).
```python
from rest_framework import serializers
from .models import Task, Category, Subtask

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    subtasks = SubtaskSerializer(many=True, read_only=True) # Incluye subtareas anidadas
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'completed', 'category', 'category_name', 'due_date', 'subtasks', 'created_at']
        read_only_fields = ['created_at']
```

### `backend/tasks/views.py`
Lógica de negocio (Controladores).
Se añadieron ViewSets para Subtasks.
```python
# ... imports ...
from .models import Task, Category, Subtask
from .serializers import TaskSerializer, CategorySerializer, SubtaskSerializer

class SubtaskViewSet(viewsets.ModelViewSet):
    serializer_class = SubtaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Subtask.objects.filter(task__user=self.request.user)
    # ... perform_create similar a Task ...

# ... TaskViewSet y CategoryViewSet ...
```

---

## 5. Frontend: Configuración Básica (Fase 4)

### `frontend/package.json`
Dependencias clave.
```json
{
  "dependencies": {
    "axios": "^1.7.9",
    "react": "^19.2.0",
    "react-router-dom": "^7.13.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.19",
    # ...
  }
}
```

---

## 6. Arquitectura Frontend y Lógica de Negocio (PASO A PASO PARA REPLICAR)

Esta sección explica cómo está construida la lógica del frontend para que puedas usarla como plantilla con cualquier otra entidad (ej. Productos, Usuarios, Pedidos).

### A. Gestión de Autenticación (`src/context/AuthContext.jsx`)
Usamos React Context API + `localStorage` para manejar la sesión globalmente.

1.  **Estado (`initialState`)**: Guarda el `token` y el `email` del usuario.
2.  **Reducer (`authReducer`)**: Maneja acciones predecibles:
    - `LOGIN`: Guarda token/email en estado.
    - `LOGOUT`: Limpia el estado.
    - `INIT`: Carga datos desde `localStorage` al iniciar la app.
3.  **Persistencia (`useEffect`)**:
    - Al cargar (`[]`), lee `localStorage` y dispara `INIT`.
    - Al cambiar el estado (`[state.token]`), guarda o borra en `localStorage`.
4.  **Uso (`useAuth`)**: Hook personalizado que expone `{ token, isAuthenticated, dispatch }` a cualquier componente.

### B. Cliente API Centralizado (`src/api/client.js`)
Evita repetir URLs y headers en cada llamada.

1.  `getApiUrl(path)`: Concatena la URL base (ej. `http://localhost:8000`) con el path relativo.
2.  `getAuthHeaders(token)`: Devuelve `{ Authorization: "Token ..." }` si existe el token.

### C. Patrón de Lista de Datos (`src/components/TareasList.jsx`)
Este componente implementa un CRUD completo en una sola vista. Para replicarlo con otra entidad (ej. "Productos"):

1.  **Estado Local**:
    - `data`: Array principal (ej. `tasks`).
    - `auxData`: Datos relacionados (ej. `categories` para selects).
    - `loading`: Booleano para mostrar spinners.
    - `filters`: Estados para inputs de búsqueda/filtros.
    - `drafts`: Objetos temporales para edición/creación (ej. `editDraft`).

2.  **Carga de Datos (`useEffect`)**:
    - Llama a `axios.get` usando `getApiUrl` y `getAuthHeaders(token)`.
    - Guarda la respuesta en `data`.
    - Maneja errores (ej. setea array vacío).

3.  **Filtrado y Ordenamiento (Cliente)**:
    - No recargues la API para filtrar si tienes pocos datos (<1000).
    - Usa `displayedTasks = tasks.filter(...).sort(...)` en el render.
    - Filtros: Coincidencia de texto (`includes`), comparación exacta (IDs), rangos.

4.  **Operaciones CRUD (Patrón Optimista)**:
    - **Crear**: POST a API -> Al éxito, agregar respuesta al estado: `setTasks([...prev, res.data])`.
    - **Editar**: PATCH a API -> Al éxito, mapear estado: `setTasks(prev => prev.map(t => t.id === id ? res.data : t))`.
    - **Eliminar**: DELETE a API -> Al éxito, filtrar estado: `setTasks(prev => prev.filter(t => t.id !== id))`.

5.  **Sub-listas (Relaciones 1:N)**:
    - Si tu entidad tiene hijos (ej. Tarea -> Subtareas), manéjalos como un array dentro del objeto padre.
    - Al actualizar un hijo, busca el padre en el estado y actualiza su array `subtasks`.

### D. Integración en Vistas (`src/views/Tareas.jsx`)
La vista actúa como contenedor "inteligente":
1.  Verifica autenticación (vía rutas protegidas en `App.jsx`).
2.  Renderiza el formulario de creación (`TareasForm`) y la lista (`TareasList`).
3.  **Comunicación entre componentes**: Usa una referencia (`useRef`) pasada como prop (`refresh`) para que el Formulario pueda decirle a la Lista que recargue los datos tras una creación exitosa.
