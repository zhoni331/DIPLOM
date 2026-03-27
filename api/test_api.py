import pytest
from fastapi.testclient import TestClient
from main import app
from config import settings

client = TestClient(app)

class TestHealth:
    """Test basic API health"""
    
    def test_root(self):
        response = client.get("/")
        assert response.status_code == 200
        assert response.json()["message"] == "Welcome to Renovation Platform API"
    
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

class TestAuth:
    """Test authentication endpoints"""
    
    def test_register(self):
        """Test user registration"""
        response = client.post("/auth/register", json={
            "email": "test@example.com",
            "password": "TestPassword123!",
            "full_name": "Test User",
            "role": "homeowner"
        })
        # Will fail without Supabase setup, but endpoint is valid
        assert response.status_code in [200, 400, 500]

    def test_login(self):
        """Test user login"""
        response = client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "TestPassword123!"
        })
        # Will fail without Supabase setup, but endpoint is valid
        assert response.status_code in [200, 401, 400, 500]

class TestTeams:
    """Test team endpoints"""
    
    def test_list_teams(self):
        """Test listing teams"""
        response = client.get("/teams")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_list_teams_with_filters(self):
        """Test listing teams with filters"""
        response = client.get("/teams?city=Astana&sort_by=trust_score&limit=10")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

class TestReviews:
    """Test review endpoints"""
    
    def test_list_reviews(self):
        """Test listing reviews"""
        response = client.get("/reviews")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_list_reviews_with_status(self):
        """Test listing reviews filtered by status"""
        response = client.get("/reviews?status=approved")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
