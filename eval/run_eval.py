import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from rag import RAGAssistant
from eval_logging import judge_faithfulness

GOLDEN_SET_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "golden_set.json"
)


def run():

    with open(GOLDEN_SET_PATH, "r", encoding="utf-8") as f:
        golden_set = json.load(f)

    rag_cache = {}

    content_results = []
    edge_case_results = []

    for item in golden_set:

        store_dir = item["store_dir"]

        if store_dir not in rag_cache:
            rag_cache[store_dir] = RAGAssistant.from_store(store_dir)

        rag = rag_cache[store_dir]

        result = rag.ask(item["question"])

        if item["type"] == "content":

            retrieved_pages = {
                source["page"] for source in result["sources"]
            }

            retrieval_hit = item["expected_page"] in retrieved_pages

            supported, verdict = judge_faithfulness(
                item["question"],
                result["context"],
                result["answer"]
            )

            content_results.append(
                {
                    "id": item["id"],
                    "question": item["question"],
                    "answer": result["answer"],
                    "expected_page": item["expected_page"],
                    "retrieved_pages": sorted(retrieved_pages),
                    "retrieval_hit": retrieval_hit,
                    "faithful": supported,
                    "verdict": verdict
                }
            )

        else:

            edge_case_results.append(
                {
                    "id": item["id"],
                    "type": item["type"],
                    "question": item["question"],
                    "answer": result["answer"]
                }
            )

    print("=" * 70)
    print("CONTENT QUESTIONS")
    print("=" * 70)

    for r in content_results:

        status = "PASS" if r["retrieval_hit"] and r["faithful"] else "FAIL"

        print(f"\n[{status}] {r['id']}: {r['question']}")
        print(f"  retrieval: expected page {r['expected_page']}, got {r['retrieved_pages']}")
        print(f"  faithful: {r['faithful']} ({r['verdict'][:100]})")
        print(f"  answer: {r['answer'][:150]}")

    print()
    print("=" * 70)
    print("EDGE CASES (review manually — no auto pass/fail)")
    print("=" * 70)

    for r in edge_case_results:
        print(f"\n[{r['type']}] {r['id']}: {r['question']}")
        print(f"  answer: {r['answer']}")

    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)

    total = len(content_results)
    retrieval_hits = sum(1 for r in content_results if r["retrieval_hit"])
    faithful_count = sum(1 for r in content_results if r["faithful"])

    print(f"retrieval hit-rate: {retrieval_hits}/{total} ({retrieval_hits/total:.0%})")
    print(f"faithfulness rate:  {faithful_count}/{total} ({faithful_count/total:.0%})")
    print(f"edge cases logged:  {len(edge_case_results)} (review above)")


if __name__ == "__main__":
    run()
