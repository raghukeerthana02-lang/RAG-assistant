from supabase_client import supabase
import mimetypes


BUCKET_NAME = "documents"


def upload_document(
    file_path: str,
    storage_path: str
):

    mime_type = (
        mimetypes.guess_type(file_path)[0]
        or "application/octet-stream"
    )


    with open(file_path, "rb") as file:

        response = (
            supabase
            .storage
            .from_(BUCKET_NAME)
            .upload(
                path=storage_path,
                file=file,
                file_options={
                    "content-type": mime_type
                }
            )
        )

    return response