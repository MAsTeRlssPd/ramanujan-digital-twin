"""
Custom Gemini embedding function for ChromaDB integration.
"""
from chromadb import Documents, EmbeddingFunction, Embeddings
from google import genai
from google.genai import types

import config


class GeminiEmbeddingFunction(EmbeddingFunction):
    """Wraps Gemini embedding API for use with ChromaDB."""

    def __init__(
        self,
        api_key: str = None,
        model_name: str = None,
        dimensionality: int = None,
        task_type: str = "RETRIEVAL_DOCUMENT",
    ):
        self._api_key = api_key or config.GOOGLE_API_KEY
        self._model_name = model_name or config.EMBEDDING_MODEL
        self._dimensionality = dimensionality or config.EMBEDDING_DIMENSIONS
        self._task_type = task_type
        self._client = genai.Client(api_key=self._api_key)

    def __call__(self, input: Documents) -> Embeddings:
        """Embed a list of documents, with retry on transient server errors."""
        import time
        all_embeddings = []

        for doc in input:
            last_err = None
            for attempt in range(5):  # up to 5 retries
                try:
                    result = self._client.models.embed_content(
                        model=self._model_name,
                        contents=doc,
                        config=types.EmbedContentConfig(
                            output_dimensionality=self._dimensionality,
                            task_type=self._task_type,
                        ),
                    )
                    all_embeddings.append(result.embeddings[0].values)
                    time.sleep(0.7)  # Avoid 100 RPM rate limit
                    last_err = None
                    break
                except Exception as e:
                    last_err = e
                    wait = 5 * (2 ** attempt)  # 5, 10, 20, 40, 80 s
                    print(f"    [embed] Attempt {attempt + 1} failed ({e}). Retrying in {wait}s...")
                    time.sleep(wait)
            if last_err is not None:
                raise last_err

        return all_embeddings


def get_document_embedder() -> GeminiEmbeddingFunction:
    """Get an embedding function configured for document ingestion."""
    return GeminiEmbeddingFunction(task_type="RETRIEVAL_DOCUMENT")


def get_query_embedder() -> GeminiEmbeddingFunction:
    """Get an embedding function configured for query retrieval."""
    return GeminiEmbeddingFunction(task_type="RETRIEVAL_QUERY")
