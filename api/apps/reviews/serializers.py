"""Reviews app serializers"""
from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'team', 'rating', 'comment', 'verified', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
