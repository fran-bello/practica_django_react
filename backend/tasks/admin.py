from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Task, Category, Profile, Subtask

# 1. Definimos un "Inline" para editar el Perfil dentro del Usuario
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'

# 2. Extendemos el UserAdmin oficial
class CustomUserAdmin(UserAdmin):
    inlines = (ProfileInline, )
    # Agregamos 'id' a la lista de columnas visibles
    list_display = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff')
    # Opcional: poner el ID clickeable para entrar a editar
    list_display_links = ('id', 'username')

# 3. Des-registramos el User original y registramos el nuestro
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# Decorador @admin.register: Es la forma moderna de decirle a Django "usa esta clase para administrar el modelo Task"
class SubtaskInline(admin.TabularInline):
    model = Subtask
    extra = 0


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    inlines = (SubtaskInline,)
    list_display = ('title', 'user', 'category', 'completed', 'due_date', 'created_at')
    
    # list_filter: Agrega una barra lateral derecha para filtrar datos rápidamente.
    # Podrás hacer clic en "Completed: Yes" o elegir una categoría específica.
    list_filter = ('completed', 'category')
    
    # search_fields: Agrega una barra de búsqueda arriba.
    # Buscará texto dentro del título O la descripción.
    search_fields = ('title', 'description')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)


@admin.register(Subtask)
class SubtaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'task', 'category', 'completed', 'due_date', 'created_at')
    list_filter = ('completed', 'category')
    search_fields = ('title', 'description')
    list_select_related = ('task', 'category')
    autocomplete_fields = ('task', 'category')