from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, CategoryViewSet

router = DefaultRouter()
# Agregamos basename='task' porque TaskViewSet no tiene queryset estático
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'categories', CategoryViewSet)

# URLS de la API
urlpatterns = [
    path('', include(router.urls)),
]