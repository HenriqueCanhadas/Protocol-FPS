"""
supabase_client.py — Wrapper for Supabase client initialization
"""
import os
from supabase import create_client, Client

_client: Client | None = None


def get_supabase() -> Client:
    """Get or create a Supabase client instance."""
    global _client
    
    if _client is not None:
        return _client
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        raise ValueError(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables"
        )
    
    _client = create_client(url, key)
    return _client
