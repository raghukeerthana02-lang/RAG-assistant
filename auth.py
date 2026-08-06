from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase_client import supabase
security=HTTPBearer()

def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:
        response = supabase.auth.get_user(token)

        user = response.user

        if not user:
            raise Exception()

        return user.id


    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )