from supabase import create_client, Client
from config import settings

class SupabaseClient:
    _instance: Client = None

    @classmethod
    def get_instance(cls) -> Client:
        if cls._instance is None:
            cls._instance = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_KEY
            )
        return cls._instance

def get_supabase() -> Client:
    """Dependency for FastAPI to inject Supabase client"""
    return SupabaseClient.get_instance()
