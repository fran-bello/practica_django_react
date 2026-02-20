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

