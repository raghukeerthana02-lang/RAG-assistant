from dotenv import load_dotenv

load_dotenv()

from rag import RAGAssistant

rag = RAGAssistant(
    "C://Users//Keerthana Raghuraman//OneDrive//Documents//RAG-assistant//RAG_pdf.pdf"
)

print("PDF Loaded Successfully!\n")

while True:

    query = input("Ask your question> ")

    if query.lower() == "exit":
        break

    answer = rag.ask(query)

    print("\nAnswer:\n")
    print(answer)
    print("-" * 60)