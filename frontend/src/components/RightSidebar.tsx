import { useEffect, useRef } from "react";
import { Folder, Upload } from "lucide-react";
import { getDocuments, uploadDocument } from "../api/api";

type Document = {
  id: number;
  filename: string;
  file_type: string;
  path: string;
};

type Props = {
  selectedDocument: number | null;
  setSelectedDocument: React.Dispatch<React.SetStateAction<number | null>>;
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  setFilterDocument: React.Dispatch<React.SetStateAction<number | null>>;
};

export default function RightSidebar({
  selectedDocument,
  setSelectedDocument,
  documents,
  setDocuments,
  setFilterDocument,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadDocuments() {
    const docs = await getDocuments();
    setDocuments(docs);
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!e.target.files?.length) return;

    await uploadDocument(e.target.files[0]);

    loadDocuments();
  }

  return (
    <div className="h-full bg-gradient-to-b from-zinc-950 to-zinc-900/60 p-5">

      <button
        onClick={() => fileInputRef.current?.click()}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-3 hover:bg-zinc-800"
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
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
            />

            <div className="flex flex-col">

              <span>{doc.filename}</span>

              <span className="text-xs text-zinc-500">
                {doc.file_type.toUpperCase()}
              </span>

            </div>
          </div>
        ))}

      </div>

    </div>
  );
}