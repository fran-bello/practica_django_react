from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import viewsets, permissions
from .models import Task, Category
from .serializers import TaskSerializer, CategorySerializer
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