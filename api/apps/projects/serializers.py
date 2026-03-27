"""Projects app serializers"""
from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'id', 'team', 'title', 'description', 'status',
            'budget', 'start_date', 'end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
