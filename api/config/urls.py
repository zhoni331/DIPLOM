"""Main URL configuration for renovation platform API"""
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.views.static import serve
from django.http import JsonResponse
from django.conf import settings
import os


def health_check(request):
    """Health check endpoint"""
    return JsonResponse({'status': 'healthy'})


def serve_spa(request, path=''):
    """Serve React SPA - fall back to index.html for routes"""
    file_path = os.path.join(settings.STATIC_ROOT, path)
    if path and os.path.isfile(file_path):
        return serve(request, path, document_root=settings.STATIC_ROOT)
    else:
        return serve(request, 'index.html', document_root=settings.STATIC_ROOT)


api_patterns = [
    # Auth endpoints
    path('auth/', include('apps.authentication.urls')),
    
    # Teams endpoints
    path('teams/', include('apps.teams.urls')),
    
    # Reviews endpoints
    path('reviews/', include('apps.reviews.urls')),
    
    # Projects endpoints
    path('projects/', include('apps.projects.urls')),
    
    # Health check
    path('health/', health_check, name='health'),
]

urlpatterns = [
    # API routes with /api prefix
    path('api/', include(api_patterns)),
    
    # JWT tokens
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Serve frontend - all other routes go to index.html for SPA
    path('', serve_spa, name='index'),
    path('<path:path>', serve_spa),
]

