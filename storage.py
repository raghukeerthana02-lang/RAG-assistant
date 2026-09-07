from supabase_client import supabase
import mimetypes


BUCKET_NAME = "documents"


def upload_document(
    file_path: str,
    storage_path: str
):

    extension = file_path.lower().split(".")[-1]

    mime_types = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }

    mime_type = mime_types.get(
        extension,
        "application/octet-stream"
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