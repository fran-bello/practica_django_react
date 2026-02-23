from django.db import models
from django.contrib.auth.models import User # Importamos el modelo de Usuario que ya viene en Django
from .ai_service import suggest_category
from rest_framework.decorators import action

# Tabla Category (Categorías de tareas)
class Category(models.Model):
    # Nombre de la categoría (ej: "Trabajo", "Personal")
    name = models.CharField(max_length=100)
    
    # Fecha de creación automática (se pone sola al crear)
    created_at = models.DateTimeField(auto_now_add=True)

    # Representación en texto para humanos (ej: en el admin)
    def __str__(self):
        return self.name

# Tabla Task (Tareas)
class Task(models.Model):
    # Opciones para el estado (aunque usamos BooleanField, esto es útil para documentación)
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]

    # Título obligatorio (max 200 caracteres)
    title = models.CharField(max_length=200)
    
    # Descripción opcional (puede ser vacía o NULL en la DB)
    description = models.TextField(blank=True, null=True)
    
    # Estado: completada o no (por defecto False = pendiente)
    completed = models.BooleanField(default=False)
    
    # Relación 1 a N con Usuario. 
    # on_delete=CASCADE: Si borras el usuario, se borran sus tareas.
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    
    # Relación 1 a N con Categoría (opcional).
    # on_delete=SET_NULL: Si borras la categoría, la tarea queda sin categoría (NULL), no se borra.
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    
    # Campo opcional para guardar qué dijo la IA ("urgent", "personal", etc.)
    ai_classification = models.CharField(max_length=50, blank=True, null=True)
    
    # Fecha de creación automática
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Fecha límite / recordatorio (para usar como agenda)
    due_date = models.DateField(null=True, blank=True)

    # Representación: "Comprar pan (juanperez)"
    def __str__(self):
        return f"{self.title} ({self.user.username})"


# Subtareas (relacionadas 1 N con Task)
class Subtask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    completed = models.BooleanField(default=False)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='subtasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} (subtask de {self.task_id})"

# ... (imports)

# Tabla Profile (Perfiles de usuario)
class Profile(models.Model):
    # Relación 1 a 1 con Usuario.
    # on_delete=CASCADE: Si borras el usuario, se borra el perfil.
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    # Rol del usuario (admin o user)
    role = models.CharField(max_length=20, choices=[('admin', 'Admin'), ('user', 'User')], default='user')
    # Avatar del usuario (URL)
    avatar = models.URLField(blank=True, null=True)
    # Biografía del usuario
    bio = models.TextField(blank=True)

    # Representación: "Perfil de juanperez"
    def __str__(self):
        return f"Profile of {self.user.username}"

# ... (modelos Category y Task siguen igual)