"""Projects app views"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter projects by team if team_id is provided"""
        queryset = Project.objects.all()
        team_id = self.request.query_params.get('team_id')
        if team_id:
            queryset = queryset.filter(team_id=team_id)
        return queryset
