import os
from supabase import create_client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)
print('key value:', SUPABASE_KEY[:20])