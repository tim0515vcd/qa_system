from google import genai
from app.core.settings import settings

client = genai.Client(api_key=settings.gemini_api_key)


def gemini_document_embedding(text: str) -> list[float]:
    try:
        response = client.models.embed_content(
            model=settings.gemini_embedding_model,
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
            model=settings.gemini_embedding_model,
            contents=text,
            config={
                "output_dimensionality": 384,
                "task_type": "RETRIEVAL_QUERY",
            },
        )
        return response.embeddings[0].values
    except Exception as e:
        raise RuntimeError(f"embedding generation failed: {e}")
