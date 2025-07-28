import os
from fastapi import APIRouter, UploadFile, File
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "media")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    unique_id = uuid.uuid4().hex
    file_path = f"uploads/{unique_id}_{file.filename}"
    contents = await file.read()

    res = supabase.storage.from_(SUPABASE_BUCKET).upload(
        path=file_path,
        file=contents,
        file_options={"content-type": file.content_type}
    )

    # Fix: Check the response object attributes instead of treating as dict
    if hasattr(res, 'status_code') and res.status_code == 200 and getattr(res, 'error', None) is None:
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{file_path}"
        return {"url": public_url}
    else:
        # Try to get error message, fallback to string representation
        error_msg = getattr(res, 'error', None)
        if error_msg is None:
            error_msg = str(res)
        return {"error": error_msg}
