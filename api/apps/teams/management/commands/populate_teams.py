from django.core.management.base import BaseCommand
from apps.teams.models import Team


class Command(BaseCommand):
    help = 'Populate database with sample teams for testing'

    def handle(self, *args, **options):
        # Clear existing teams
        Team.objects.all().delete()
        
        # Sample teams data
        teams_data = [
            {
                'name': 'Elite Renovations',
                'description': 'Professional renovation team specializing in kitchen and bathroom remodels',
                'rating': 4.8,
                'review_count': 25,
                'verified': True,
                'trust_score': 87.5,
                'logo_url': 'https://example.com/logo1.png',
                'website': 'https://eliterenovations.kz',
                'phone': '+7 (727) 123-45-67',
                'email': 'info@eliterenovations.kz'
            },
            {
                'name': 'Modern Home Solutions',
                'description': 'Full-service home renovation company with 15+ years experience',
                'rating': 4.6,
                'review_count': 42,
                'verified': True,
                'trust_score': 82.3,
                'logo_url': 'https://example.com/logo2.png',
                'website': 'https://modernhomes.kz',
                'phone': '+7 (727) 234-56-78',
                'email': 'contact@modernhomes.kz'
            },
            {
                'name': 'Kazakhstan Builders',
                'description': 'Local construction and renovation experts',
                'rating': 4.4,
                'review_count': 18,
                'verified': False,
                'trust_score': 65.7,
                'logo_url': 'https://example.com/logo3.png',
                'website': 'https://kazakhbuilders.kz',
                'phone': '+7 (727) 345-67-89',
                'email': 'hello@kazakhbuilders.kz'
            },
            {
                'name': 'Premium Interiors',
                'description': 'Luxury interior design and renovation services',
                'rating': 4.9,
                'review_count': 31,
                'verified': True,
                'trust_score': 91.2,
                'logo_url': 'https://example.com/logo4.png',
                'website': 'https://premiuminteriors.kz',
                'phone': '+7 (727) 456-78-90',
                'email': 'design@premiuminteriors.kz'
            },
            {
                'name': 'Fast Fix Contractors',
                'description': 'Quick and reliable home repair services',
                'rating': 4.2,
                'review_count': 12,
                'verified': False,
                'trust_score': 58.9,
                'logo_url': 'https://example.com/logo5.png',
                'website': 'https://fastfix.kz',
                'phone': '+7 (727) 567-89-01',
                'email': 'service@fastfix.kz'
            }
        ]
        
        # Create teams
        for team_data in teams_data:
            team = Team.objects.create(**team_data)
            self.stdout.write(
                self.style.SUCCESS(f'Created team: {team.name} (ID: {team.id})')
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {len(teams_data)} sample teams')
        )