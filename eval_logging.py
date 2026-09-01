import logging

import numpy as np

from llm import generate_answer
from embedding import embed_query

logger = logging.getLogger(__name__)


def judge_correctness(question, expected_answer, actual_answer):

    judge_prompt = f"""You are checking whether an AI-generated answer is factually correct compared to a known-correct reference answer. Minor differences in wording or extra detail are fine as long as the core fact is correct. Reply with exactly one word, "yes" or "no", followed by a brief one-sentence reason.

Question:
{question}

Reference (known-correct) answer:
{expected_answer}

AI-generated answer:
{actual_answer}

Is the AI-generated answer factually correct compared to the reference?"""

    verdict = generate_answer(judge_prompt)

    correct = verdict.strip().lower().startswith("yes")

    return correct, verdict


def answer_relevancy(question, answer):

    question_embedding = embed_query(question)
    answer_embedding = embed_query(answer)

    similarity = np.dot(question_embedding, answer_embedding.T) / (
        np.linalg.norm(question_embedding) * np.linalg.norm(answer_embedding)
    )

    return float(similarity[0][0])


def judge_faithfulness(question, context, answer):

    judge_prompt = f"""You are checking whether an AI-generated answer is fully supported by the given context. Reply with exactly one word, "yes" or "no", followed by a brief one-sentence reason.

Context:
{context}

Question:
{question}

Answer:
{answer}

Is the answer fully supported by the context?"""

    verdict = generate_answer(judge_prompt)

    supported = verdict.strip().lower().startswith("yes")

    return supported, verdict


def log_faithfulness_sample(
    document_id,
    question,
    context,
    answer
):

    if not context or not answer:
        return

    try:
        supported, verdict = judge_faithfulness(question, context, answer)

    except Exception:
        logger.exception("Faithfulness judge call failed")
        return

    logger.info(
        "faithfulness_check document_id=%s supported=%s verdict=%s",
        document_id,
        supported,
        verdict.replace("\n", " ")[:200]
    )
