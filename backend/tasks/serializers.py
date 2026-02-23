from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task, Category, Profile, Subtask

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

# 4. Serializer para Subtarea (anidado en Task)
class SubtaskSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Subtask
        fields = ['id', 'title', 'description', 'completed', 'category', 'category_name', 'due_date', 'created_at']
        read_only_fields = ['created_at']


# 5. Serializer para Tarea
class TaskSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    category_name = serializers.ReadOnlyField(source='category.name')
    subtasks = SubtaskSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'completed',
            'user', 'user_username',
            'category', 'category_name',
            'ai_classification', 'created_at', 'due_date',
            'subtasks',
        ]
        read_only_fields = ['user', 'ai_classification', 'created_at']