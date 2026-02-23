from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from .models import Task, Category, Subtask
from .serializers import TaskSerializer, CategorySerializer, SubtaskSerializer
from .ai_service import suggest_category
from django.contrib.auth.models import User


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated] # Solo logueados

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 1. Filtrar: Cada usuario solo ve SUS tareas
    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by('-created_at')

    # 2. Crear: Asignar automáticamente el usuario logueado como dueño
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def categorize(self, request, pk=None):
        """
        Endpoint: POST /api/tasks/{id}/categorize/
        Usa IA para sugerir una categoría y actualizar la tarea.
        """
        task = self.get_object()
        
        # 1. Obtenemos las categorías existentes para que la IA elija una válida
        existing_categories = list(Category.objects.values_list('name', flat=True))
        
        if not existing_categories:
            return Response({"error": "No hay categorías creadas."}, status=400)

        # 2. Llamamos al servicio de IA
        #    Le pasamos título, descripción y la lista de opciones
        suggested_name = suggest_category(task.title, task.description, existing_categories)
        
        if not suggested_name:
            return Response({"error": "Error al consultar la IA."}, status=500)

        # 3. Buscamos la categoría en la BD (case-insensitive)
        category = Category.objects.filter(name__iexact=suggested_name).first()
        
        if category:
            # ¡Éxito! Encontramos una coincidencia.
            # Actualizamos la tarea con la nueva categoría
            task.category = category
            task.save()
            
            return Response({
                "message": f"Categoría asignada: {category.name}",
                "suggested_category": category.name
            })
        else:
            # La IA sugirió algo que no pudimos mapear exactamente (raro si usamos el prompt correcto)
            return Response({
                "message": f"La IA sugirió '{suggested_name}' pero no coincide exactamente.",
                "suggested_category": suggested_name
            }, status=200)


class SubtaskViewSet(viewsets.ModelViewSet):
    serializer_class = SubtaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subtask.objects.filter(task__user=self.request.user).order_by("created_at")

    def perform_create(self, serializer):
        task_id = self.request.data.get("task")
        task = Task.objects.filter(user=self.request.user, pk=task_id).first()
        if not task:
            raise ValidationError({"task": "Tarea no encontrada o no pertenece al usuario."})
        serializer.save(task=task)


class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        # 1. Obtenemos email y password del JSON
        email = request.data.get('email')
        password = request.data.get('password')

        # 2. Buscamos al usuario por su email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
             return Response({'error': 'email no encontrado'}, status=400)

        # 3. Verificamos la contraseña
        if not user.check_password(password):
            return Response({'error': 'contraseña incorrecta'}, status=400)

        # 4. Si todo OK, generamos o recuperamos el token
        token, created = Token.objects.get_or_create(user=user)
        
        # 5. Devolvemos token, id y email (útil para el frontend)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })