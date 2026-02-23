"""
Pruebas unitarias para la API de tareas (tasks.views).

Cubre el TaskViewSet y el comportamiento de seguridad/negocio:
- Al crear una tarea vía POST /api/tasks/, el usuario autenticado se asigna
  como dueño (perform_create), de modo que cada usuario solo ve y edita sus tareas.

Ejecución:
  python manage.py test                    — todas las pruebas del proyecto
  python manage.py test tasks             — solo la app tasks
  python manage.py test tasks.tests.TaskViewSetTests.test_create_task_assigns_authenticated_user

  (en Docker, desde la raíz del proyecto:)
  docker compose exec backend python manage.py test tasks
"""

from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Task


class TaskViewSetTests(APITestCase):
    """Pruebas del TaskViewSet (API REST de tareas)."""

    def setUp(self):
        """Usuario de prueba para autenticación en las peticiones."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

    def test_create_task_assigns_authenticated_user(self):
        """
        Al crear una tarea vía API, el usuario autenticado queda asignado como dueño.

        Verifica que perform_create() en TaskViewSet asigna request.user a la tarea,
        garantizando que cada usuario solo pueda ver y modificar sus propias tareas.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/tasks/",
            {"title": "Mi primera tarea", "description": "Descripción de prueba"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task = Task.objects.get(pk=response.data["id"])
        self.assertEqual(task.user_id, self.user.id)
        self.assertEqual(task.title, "Mi primera tarea")
