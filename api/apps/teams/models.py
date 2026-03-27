"""Teams app models"""
from django.db import models

class Team(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    rating = models.FloatField(default=0.0)
    review_count = models.IntegerField(default=0)
    verified = models.BooleanField(default=False)
    trust_score = models.FloatField(default=0.0)
    logo_url = models.URLField(null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-trust_score']
    
    def __str__(self):
        return self.name
