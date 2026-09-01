import json
import os
import sys
import time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from rag import RAGAssistant
from eval_logging import judge_faithfulness, judge_correctness, answer_relevancy

GOLDEN_SET_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "golden_set.json"
)

# Pause between questions to stay well under Groq's per-minute token
# limit -- each question makes up to 3 LLM calls (answer, faithfulness
# judge, correctness judge).
PACING_SECONDS = 8


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

            reranked_pages = result["reranked_pages"]
            relevant_in_topk = sum(
                1 for p in reranked_pages if p == item["expected_page"]
            )
            precision_at_k = relevant_in_topk / len(reranked_pages)

            relevancy = answer_relevancy(item["question"], result["answer"])

            faithful, faithful_verdict = judge_faithfulness(
                item["question"],
                result["context"],
                result["answer"]
            )

            correct, correctness_verdict = judge_correctness(
                item["question"],
                item["expected_answer"],
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
                    "precision_at_k": precision_at_k,
                    "relevancy": relevancy,
                    "faithful": faithful,
                    "faithful_verdict": faithful_verdict,
                    "correct": correct,
                    "correctness_verdict": correctness_verdict
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

        time.sleep(PACING_SECONDS)

    print("=" * 70)
    print("CONTENT QUESTIONS")
    print("=" * 70)

    for r in content_results:

        status = "PASS" if (
            r["retrieval_hit"] and r["faithful"] and r["correct"]
        ) else "FAIL"

        print(f"\n[{status}] {r['id']}: {r['question']}")
        print(f"  retrieval hit:  expected page {r['expected_page']}, got {r['retrieved_pages']}")
        print(f"  precision@k:    {r['precision_at_k']:.2f}")
        print(f"  relevancy:      {r['relevancy']:.2f}")
        print(f"  faithful:       {r['faithful']} ({r['faithful_verdict'][:90]})")
        print(f"  correct:        {r['correct']} ({r['correctness_verdict'][:90]})")
        print(f"  answer:         {r['answer'][:150]}")

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
    correct_count = sum(1 for r in content_results if r["correct"])
    avg_precision = sum(r["precision_at_k"] for r in content_results) / total
    avg_relevancy = sum(r["relevancy"] for r in content_results) / total

    print(f"n = {total} content questions (golden set, single document)")
    print(f"retrieval hit-rate (recall@k): {retrieval_hits}/{total} ({retrieval_hits/total:.0%})")
    print(f"precision@k (avg):            {avg_precision:.2f}")
    print(f"answer relevancy (avg cos-sim): {avg_relevancy:.2f}")
    print(f"faithfulness rate:             {faithful_count}/{total} ({faithful_count/total:.0%})")
    print(f"answer correctness rate:       {correct_count}/{total} ({correct_count/total:.0%})")
    print(f"edge cases logged:             {len(edge_case_results)} (review above)")


if __name__ == "__main__":
    run()
