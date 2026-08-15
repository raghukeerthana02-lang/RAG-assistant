import logging

from llm import generate_answer

logger = logging.getLogger(__name__)


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
