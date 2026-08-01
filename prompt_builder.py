def build_prompt(context, query):
    prompt = f""" You are a helpful AI assistant.
    Answer using ONLY the provided context and provide a complete answer using all relevant information from the context.
    Context:
    {context}
    Question:
    {query}
    Answer:"""
    return prompt
