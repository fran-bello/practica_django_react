# GUÍA DE ARCHIVOS A CREAR Y MODIFICAR (BACKEND)

Esta guía detalla, archivo por archivo, qué debes crear o modificar para levantar el backend desde cero.

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
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 4. API REST (Fase 3)

### `backend/tasks/serializers.py`
Transformación de datos (Model -> JSON).
```python
from rest_framework import serializers
from .models import Task, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'completed', 'category', 'category_name', 'created_at']
        read_only_fields = ['created_at']
```

### `backend/tasks/views.py`
Lógica de negocio (Controladores).
```python
from rest_framework import viewsets, permissions
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Task, Category
from .serializers import TaskSerializer, CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtra tareas por el usuario logueado
        return Task.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Asigna el usuario logueado al crear
        serializer.save(user=self.request.user)

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        # Lógica de login con email en vez de username
        # ... (ver código completo en proyecto)
```

### `backend/tasks/urls.py`
Rutas internas de la app.
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

### `backend/config/urls.py`
Rutas principales del proyecto.
```python
from django.contrib import admin
from django.urls import path, include
from tasks.views import CustomAuthToken

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tasks.urls')),
    path('api-token-auth/', CustomAuthToken.as_view()),
]
```

---

## 5. Frontend: Tailwind CSS (Fase 4)

### Comandos (ejecutar desde la raíz del repo, contra el contenedor frontend)
```powershell
docker compose exec frontend npm install -D tailwindcss@3 postcss autoprefixer
docker compose exec frontend npx tailwindcss init -p
```

### `frontend/tailwind.config.js`
Tras `npx tailwindcss init -p`, asegurar que `content` incluya los archivos donde usas clases:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### `frontend/postcss.config.js`
Generado por `tailwindcss init -p`. Debe quedar:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### `frontend/src/index.css`
Agregar al inicio del archivo (o reemplazar el contenido por) las directivas de Tailwind:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
Opcional: estilos base para body:
```css
@layer base {
  body {
    @apply min-h-screen bg-gray-50 text-gray-900;
  }
}
```

### Verificación
- `npm run dev` (o levantar con `docker compose up frontend`) y usar en un componente: `className="p-4 bg-blue-500 text-white rounded-lg"`.
- Si el bloque se ve con estilo, Tailwind está activo.
