"""Teams app serializers"""
from rest_framework import serializers
from .models import Team


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'description', 'rating', 'review_count',
            'verified', 'trust_score', 'logo_url', 'website', 'phone',
            'email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'trust_score']


class TeamCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['name', 'description', 'logo_url', 'website', 'phone', 'email']
