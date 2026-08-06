import { supabase } from "./supabase";


const API_URL = "http://localhost:8000";


export async function apiFetch(
    endpoint:string,
    options:RequestInit = {}
){

    const {
        data
    } = await supabase.auth.getSession();


    const token = data.session?.access_token;
    if(!token){
        throw new Error("No active sessions");
    }


    return fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,

            headers:{
                ...(options.headers || {}),

                Authorization:
                `Bearer ${token}`,

            }
        }
    );

}

export function getDocumentFileUrl(documentId: number) {
    return `${API_URL}/documents/${documentId}/file`;
}

export async function fetchDocumentFile(documentId: number) {
    const response = await apiFetch(`/documents/${documentId}/file`);

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
    const response = await apiFetch("/documents");
    return await response.json();
}

export async function uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiFetch("/upload", {
        method: "POST",
        body: formData,
    });

    return await response.json();
}

export async function askQuestion(
    documentId: number,
    question: string
) {
    const response = await apiFetch("/chat", {
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
