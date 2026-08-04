export const API = "http://127.0.0.1:8000";

export function getDocumentFileUrl(documentId: number) {
    return `${API}/documents/${documentId}/file`;
}

export async function fetchDocumentFile(documentId: number) {
    const response = await fetch(getDocumentFileUrl(documentId));

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? "Failed to open document");
    }

    return await response.blob();
}

export async function openDocumentAtPage(documentId: number, page: number) {
    const blob = await fetchDocumentFile(documentId);
    const url = URL.createObjectURL(blob);

    const target =
        blob.type === "application/pdf" ? `${url}#page=${page}` : url;

    window.open(target, "_blank");
}

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

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? "Failed to get an answer");
    }

    return await response.json();
}
