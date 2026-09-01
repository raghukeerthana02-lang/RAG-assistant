from groq import Groq, RateLimitError
from config import LLM_MODEL


class LLMRateLimitedError(Exception):
    pass


# The SDK's default max_retries=2 silently retries rate-limited requests
# with backoff, which can add 10-20+ seconds of dead silence before the
# caller ever hears back. Fail fast instead and let the caller decide.
client = Groq(max_retries=0)

def generate_answer(prompt):

    try:

        response = client.chat.completions.create(
            model=LLM_MODEL,
            temperature=0,
            messages=[
                {
                    "role":"user",
                    "content":prompt
                }
            ]
        )

        return response.choices[0].message.content

    except RateLimitError:

        raise LLMRateLimitedError(
            "We're getting a lot of requests right now. Please wait a moment and try again."
        )

    except Exception:

        raise Exception(
            "AI service unavailable"
        )