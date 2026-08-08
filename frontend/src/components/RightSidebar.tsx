import { useEffect, useRef } from "react";
import { Eye, Folder, Upload } from "lucide-react";
import { fetchDocumentFile, getDocuments, uploadDocument } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Document = {
  id: string;
  filename: string;
  file_type: string;
  path: string;
};

type Props = {
  selectedDocument: string | null;
  setSelectedDocument: React.Dispatch<React.SetStateAction<string | null>>;
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  setFilterDocument: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function RightSidebar({
  selectedDocument,
  setSelectedDocument,
  documents,
  setDocuments,
  setFilterDocument,
}: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadDocuments() {
    const docs = await getDocuments();
    setDocuments(docs);
  }

  async function handleOpenFile(doc: Document) {
    try {
      const blob = await fetchDocumentFile(doc.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      alert("Document no longer available, please re-upload");
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      loadDocuments();
    }
  }

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      return;
    }

    loadDocuments();
  }, [user]);

  const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".pptx"];

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    e.target.value = "";

    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      alert("Only PDF, DOCX, and PPTX files are supported");
      return;
    }

    const alreadyUploaded = documents.some(
      (doc) => doc.filename.toLowerCase() === file.name.toLowerCase()
    );

    if (alreadyUploaded) {
      alert("Already uploaded");
      return;
    }

    try {
      await uploadDocument(file);
      loadDocuments();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to upload document"
      );
    }
  }

  return (
    <div className="h-full bg-gradient-to-b from-zinc-950 to-zinc-900/60 p-5">

      <button
        onClick={() => fileInputRef.current?.click()}
        className="mb-3 w-full rounded-xl bg-black border border-white/70 hover:bg-white/10 py-3 font-medium flex items-center justify-center gap-2 transition"
      >
        <Upload className="h-5 w-5" />
        Upload Document
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.pptx,.docx"
        hidden
        onChange={handleUpload}
      />

      <h2 className="mb-5 text-lg font-semibold">
        Documents
      </h2>

      <div className="space-y-2">

        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => {
              setSelectedDocument(doc.id);
              setFilterDocument(doc.id);
            }}
            className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition
              ${
                selectedDocument === doc.id
                  ? "bg-gradient-to-br from-blue-700/60 to-blue-800/60 border border-blue-500/10"
                  : "hover:bg-zinc-900"
              }`}
          >
            <Folder
              className="h-5 w-5 text-yellow-400 shrink-0"
              fill="currentColor"
            />

            <div className="flex flex-col flex-1 min-w-0">

              <span className="truncate">{doc.filename}</span>

              <span className="text-xs text-zinc-500">
                {doc.file_type.toUpperCase()}
              </span>

            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenFile(doc);
              }}
              className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              aria-label={`Open ${doc.filename}`}
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ))}

      </div>

    </div>
  );
}