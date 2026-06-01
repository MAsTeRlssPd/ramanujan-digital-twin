"""
ChromaDB vector store wrapper for the Ramanujan knowledge base.
"""
import chromadb

import config
from rag.embeddings import get_document_embedder, get_query_embedder


class VectorStore:
    """Manages the ChromaDB collection for Ramanujan's knowledge base."""

    def __init__(self):
        self._client = chromadb.PersistentClient(
            path=str(config.CHROMA_DB_DIR)
        )
        self._doc_embedder = get_document_embedder()
        self._query_embedder = get_query_embedder()
        self._collection = self._client.get_or_create_collection(
            name=config.CHROMA_COLLECTION_NAME,
            embedding_function=self._doc_embedder,
            metadata={"hnsw:space": "cosine"},
        )

    @property
    def collection(self):
        return self._collection

    def add_chunks(self, chunks, batch_size: int = 50):
        """
        Add document chunks to the collection.

        Args:
            chunks: List of Chunk objects from the chunker.
            batch_size: Number of chunks to add per batch.
        """
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            self._collection.add(
                documents=[c.text for c in batch],
                metadatas=[c.metadata for c in batch],
                ids=[
                    f"{c.metadata.get('source_file', 'unknown')}_{c.chunk_index}"
                    for c in batch
                ],
            )

    def query(
        self,
        query_text: str,
        n_results: int = None,
        where_filter: dict = None,
    ) -> dict:
        """
        Query the collection for relevant chunks.

        Args:
            query_text: The search query.
            n_results: Number of results to return.
            where_filter: Optional metadata filter (e.g., {"type": "math"}).

        Returns:
            ChromaDB query results dict with ids, documents, metadatas, distances.
        """
        n_results = n_results or config.RAG_TOP_K

        # Use the query embedder (RETRIEVAL_QUERY task type)
        query_embedding = self._query_embedder([query_text])

        kwargs = {
            "query_embeddings": query_embedding,
            "n_results": min(n_results, self._collection.count() or 1),
        }
        if where_filter:
            kwargs["where"] = where_filter

        return self._collection.query(**kwargs)

    def clear(self):
        """Delete and recreate the collection."""
        self._client.delete_collection(config.CHROMA_COLLECTION_NAME)
        self._collection = self._client.get_or_create_collection(
            name=config.CHROMA_COLLECTION_NAME,
            embedding_function=self._doc_embedder,
            metadata={"hnsw:space": "cosine"},
        )

    def get_stats(self) -> dict:
        """Get collection statistics."""
        count = self._collection.count()
        return {
            "total_chunks": count,
            "collection_name": config.CHROMA_COLLECTION_NAME,
        }
