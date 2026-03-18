import os
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def gemini_document_embedding(text: str) -> list[float]:
    try:
        response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=text,
            config={
                "output_dimensionality": 384,
                "task_type": "RETRIEVAL_DOCUMENT",
            },
        )
        return response.embeddings[0].values
    except Exception as e:
        raise RuntimeError(f"embedding generation failed: {e}")


def gemini_query_embedding(text: str) -> list[float]:
    try:
        response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=text,
            config={
                "output_dimensionality": 384,
                "task_type": "RETRIEVAL_QUERY",
            },
        )
        return response.embeddings[0].values
    except Exception as e:
        raise RuntimeError(f"embedding generation failed: {e}")
