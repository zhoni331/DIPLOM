"""Teams app views"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Team
from .serializers import TeamSerializer, TeamCreateSerializer


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TeamCreateSerializer
        return TeamSerializer
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get team analytics"""
        team = self.get_object()
        return Response({
            'team_id': team.id,
            'name': team.name,
            'rating': team.rating,
            'review_count': team.review_count,
            'trust_score': team.trust_score,
            'verified': team.verified,
        })
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending teams"""
        teams = Team.objects.order_by('-trust_score')[:10]
        serializer = self.get_serializer(teams, many=True)
        return Response(serializer.data)
