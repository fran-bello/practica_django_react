# ======================================================================================
# GUÍA DE EJECUCIÓN PASO A PASO (WINDOWS/POWERSHELL)
# ======================================================================================
# Este archivo documenta todos los comandos ejecutados para levantar el proyecto desde cero.
# Úsalo como referencia para reproducir el entorno o para entender el flujo de trabajo.

# --------------------------------------------------------------------------------------
# FASE 0: PREPARACIÓN DEL ENTORNO
# --------------------------------------------------------------------------------------

# 1. Crear estructura de carpetas
mkdir technical-test-practice
cd technical-test-practice
mkdir backend
mkdir frontend

# 2. Crear archivos de configuración iniciales (manual o con editor)
# - .env
# - .env.example
# - backend/requirements.txt
# - backend/Dockerfile
# - docker-compose.yml

# --------------------------------------------------------------------------------------
# FASE 1: INFRAESTRUCTURA DOCKER Y BACKEND BASE
# --------------------------------------------------------------------------------------

# 1. Construir las imágenes de Docker
docker compose build

# 2. Generar el proyecto Django (crea manage.py y carpeta config)
#    Nota: Usamos 'run --rm' para levantar un contenedor temporal que genere los archivos
#    y se borre al terminar. El punto '.' al final es crucial para no crear subcarpeta.
docker compose run --rm backend django-admin startproject config .

# 3. Levantar los servicios en segundo plano (detached mode)
#    Ahora que existe manage.py, el contenedor backend arrancará correctamente.
docker compose up -d

# 4. Verificar que los contenedores están corriendo
docker compose ps

# --------------------------------------------------------------------------------------
# FASE 2: CREACIÓN DE LA APP Y MODELOS
# --------------------------------------------------------------------------------------

# 1. Crear la app 'tasks' dentro del contenedor
docker compose exec backend python manage.py startapp tasks

# 2. Configurar settings.py (MANUALMENTE)
#    - Agregar 'rest_framework', 'corsheaders', 'tasks' a INSTALLED_APPS
#    - Agregar 'corsheaders.middleware.CorsMiddleware' a MIDDLEWARE
#    - Configurar CORS_ALLOW_ALL_ORIGINS = True

# 3. Definir modelos en tasks/models.py (MANUALMENTE)
#    - Crear clases Category y Task

# 4. Crear las migraciones (archivos que describen los cambios en la DB)
docker compose exec backend python manage.py makemigrations

# 5. Aplicar las migraciones (crear tablas en Postgres)
docker compose exec backend python manage.py migrate

# 6. Crear un superusuario para acceder al admin de Django
docker compose exec backend python manage.py createsuperuser
#    (Seguir instrucciones interactivas: user, email, password)

# --------------------------------------------------------------------------------------
# FASE 2.1: MEJORAS AL MODELO DE USUARIO (OPTIONAL PERO RECOMENDADO)
# --------------------------------------------------------------------------------------

# 1. Definir modelo Profile en tasks/models.py
#    - OneToOne con User, agregar campos avatar, role, bio

# 2. Configurar tasks/admin.py
#    - Usar InlineAdmin para ver Profile dentro de User
#    - Mostrar ID en las listas

# 3. Crear y aplicar migraciones para Profile
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# --------------------------------------------------------------------------------------
# FASE 3: API REST (DRF) Y AUTENTICACIÓN
# --------------------------------------------------------------------------------------

# 1. Configurar Autenticación por Token en settings.py
#    - Agregar 'rest_framework.authtoken' a INSTALLED_APPS
#    - Configurar REST_FRAMEWORK con TokenAuthentication y IsAuthenticated

# 2. Aplicar migraciones de authtoken (crea tabla para guardar tokens)
docker compose exec backend python manage.py migrate

# 3. Crear endpoints de la API (MANUALMENTE)
#    - tasks/serializers.py: Definir TaskSerializer, CategorySerializer
#    - tasks/views.py: 
#      - Definir TaskViewSet (con get_queryset dinámico para filtrar por user)
#      - Definir CategoryViewSet
#      - Definir CustomAuthToken (Login personalizado con email)
#    - tasks/urls.py: Registrar rutas con DefaultRouter (usar basename='task'!)
#    - config/urls.py: Incluir 'tasks.urls' y 'api-token-auth' (usando CustomAuthToken)

# 4. Probar la API
#    - Obtener token: POST /api-token-auth/ { email, password }
#    - Usar API: GET /api/tasks/ (Header: Authorization: Token <token>)

# --------------------------------------------------------------------------------------
# FASE 4: FRONTEND REACT
# --------------------------------------------------------------------------------------

# 1. Instalar Tailwind CSS (dentro del contenedor frontend)
#    Desde la raíz del repo: ejecutar en el contenedor para que node_modules quede en /app (montado)
docker compose exec frontend npm install -D tailwindcss@3 postcss autoprefixer

# 2. Crear archivos de configuración de Tailwind y PostCSS (dentro del contenedor)
docker compose exec frontend npx tailwindcss init -p
#    Crea: frontend/tailwind.config.js y frontend/postcss.config.js (gracias al volumen ./frontend:/app)

# 3. Configurar manualmente:
#    - frontend/tailwind.config.js: en "content" poner ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
#    - frontend/src/index.css: agregar al inicio las directivas:
#      @tailwind base;
#      @tailwind components;
#      @tailwind utilities;

# 4. Verificar: levantar frontend y en cualquier componente usar className="p-4 bg-blue-500 text-white"
#    Si se ve el estilo, Tailwind está funcionando.
#    (Opcional) npm audit: las vulnerabilidades en devDependencies suelen ser aceptables en práctica.

# --------------------------------------------------------------------------------------
# FASE 5: MEJORAS UI Y FUNCIONALIDAD TAREAS
# --------------------------------------------------------------------------------------

# 1. Actualización de Componentes de Lista
#    - frontend/src/components/TareasList.jsx: Se expandió la funcionalidad para incluir:
#      - Tabla HTML estilizada con Tailwind.
#      - Subtareas anidadas (expandibles/editables inline).
#      - Filtros (Estado, Categoría, Búsqueda).
#      - Ordenamiento por columnas (headers clickeables sin saltos de línea).

# 2. Integración
#    - frontend/src/views/Tareas.jsx: Usa TareasList actualizado.
#    - frontend/src/components/index.js: Exporta los componentes actualizados.

# --------------------------------------------------------------------------------------
# EJECUTAR COMANDOS DENTRO DE LOS CONTENEDORES DOCKER
# --------------------------------------------------------------------------------------
# Siempre desde la raíz del proyecto (donde está docker-compose.yml).

# --- BACKEND (Django) ---
# Cualquier comando de manage.py:
docker compose exec backend python manage.py <comando>

# Ejemplos:
docker compose exec backend python manage.py test                    # Todas las pruebas
docker compose exec backend python manage.py test tasks              # Solo app tasks
docker compose exec backend python manage.py test tasks.tests.TaskViewSetTests.test_create_task_assigns_authenticated_user
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py shell

# --- FRONTEND (Node/React) ---
# Cualquier comando npm:
docker compose exec frontend npm <comando>

# Ejemplos:
docker compose exec frontend npm run test                            # Pruebas unitarias (Vitest)
docker compose exec frontend npm run test:watch                      # Pruebas en modo watch
docker compose exec frontend npm install                             # Instalar dependencias
docker compose exec frontend npm run build
docker compose exec frontend npm run lint

# --- BASE DE DATOS (Postgres) ---
# Conectar a la consola de PostgreSQL (opcional):
docker compose exec db psql -U $env:DB_USER -d $env:DB_NAME
# En CMD: docker compose exec db psql -U %DB_USER% -d %DB_NAME%

# --- RESUMEN RÁPIDO ---
# Backend:  docker compose exec backend python manage.py <comando>
# Frontend: docker compose exec frontend npm run <script>
# DB:       docker compose exec db psql -U <user> -d <dbname>
