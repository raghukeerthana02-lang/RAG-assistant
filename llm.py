from groq import Groq
from config import LLM_MODEL
client = Groq()



def generate_answer(prompt):
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content