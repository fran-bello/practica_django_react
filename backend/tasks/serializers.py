from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task, Category, Profile

# 1. Serializer para Perfil (para mostrar avatar/rol junto al usuario)
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['role', 'avatar', 'bio']

# 2. Serializer para Usuario
class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True) # Incluimos el perfil anidado

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile']

# 3. Serializer para Categoría
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

# 4. Serializer para Tarea
class TaskSerializer(serializers.ModelSerializer):
    # Campo extra para mostrar el username sin tener que pedir todo el objeto user
    user_username = serializers.ReadOnlyField(source='user.username')
    
    # Para mostrar el nombre de la categoría en GET, pero usar ID en POST
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'completed', 
            'user', 'user_username', 
            'category', 'category_name', 
            'ai_classification', 'created_at'
        ]
        read_only_fields = ['user', 'ai_classification', 'created_at']