# Proyecto de Gestión de Tareas (Django + React)

Este proyecto es una aplicación web completa para la gestión de tareas, construida con Django (Backend) y React (Frontend), contenerizada con Docker.

## Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu sistema:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads)

## Instalación y Configuración

Sigue estos pasos para levantar el proyecto desde cero:

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd practica_django_react
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo para crear tu archivo de configuración local:

```bash
cp .env.example .env
```

**IMPORTANTE:** Abre el archivo `.env` recién creado y asegúrate de configurar tu `OPENAI_API_KEY`. Esta clave es necesaria para que las funcionalidades de Inteligencia Artificial (LangChain) funcionen correctamente (sugerencias de tareas, categorización, etc.).

```env
OPENAI_API_KEY=sk-tu-clave-api-aqui
```

### 3. Construir y Levantar los Contenedores

Ejecuta el siguiente comando para construir las imágenes y levantar los servicios:

```bash
docker-compose up --build
```

Esto iniciará tres servicios:
- **db**: Base de datos PostgreSQL.
- **backend**: API Django (puerto 8000).
- **frontend**: Aplicación React (puerto 5173).

Espera unos momentos hasta que todos los servicios estén listos.

### 4. Crear un Superusuario

Para acceder al panel de administración de Django y poder iniciar sesión en el frontend (ya que utiliza el mismo sistema de usuarios), necesitas crear un superusuario.

En una nueva terminal, ejecuta:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Sigue las instrucciones para ingresar un nombre de usuario, correo electrónico y contraseña.

### 5. Poblar Categorías Iniciales

Para que la aplicación funcione correctamente y puedas clasificar tus tareas, es necesario crear al menos las categorías básicas ("Personal" y "Trabajo").

Ejecuta el siguiente comando para crearlas automáticamente:

```bash
docker-compose exec backend python manage.py shell -c "from tasks.models import Category; Category.objects.get_or_create(name='Personal'); Category.objects.get_or_create(name='Trabajo'); print('Categorías creadas exitosamente.')"
```

## Uso de la Aplicación

Una vez completados los pasos anteriores, puedes acceder a la aplicación:

- **Frontend (Aplicación Principal):** [http://localhost:5173](http://localhost:5173)
  - Usa las credenciales del superusuario que creaste para iniciar sesión.
- **Backend (Admin Panel):** [http://localhost:8000/admin](http://localhost:8000/admin)
- **API Browser:** [http://localhost:8000/api/](http://localhost:8000/api/)

## Comandos Útiles de Docker

- **Detener los contenedores:**
  ```bash
  docker-compose down
  ```

- **Ver logs del backend:**
  ```bash
  docker-compose logs -f backend
  ```

- **Ejecutar migraciones manualmente (si fuera necesario):**
  ```bash
  docker-compose exec backend python manage.py migrate
  ```
