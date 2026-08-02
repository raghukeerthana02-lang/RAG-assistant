const API = "http://127.0.0.1:8000";

export async function getDocuments() {
    const response = await fetch(`${API}/documents`);
    return await response.json();
}

export async function uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
    });

    return await response.json();
}

export async function askQuestion(
    documentId: number,
    question: string
) {
    const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            document_id: documentId,
            question,
        }),
    });

    return await response.json();
}