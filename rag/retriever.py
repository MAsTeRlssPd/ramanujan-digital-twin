"""
RAG retriever — fetches relevant context from the knowledge base
for a given query, with source attribution.
"""
import config
from rag.vector_store import VectorStore


class Retriever:
    """Retrieves relevant context from the Ramanujan knowledge base."""

    def __init__(self):
        self._store = VectorStore()

    def retrieve(
        self,
        query: str,
        n_results: int = None,
        doc_type: str = None,
    ) -> list[dict]:
        """
        Retrieve relevant chunks for a query.

        Args:
            query: User's question or topic.
            n_results: Max results to return.
            doc_type: Filter by type (math/biography/personality/letter).

        Returns:
            List of dicts with 'text', 'source', 'topic', 'type', 'distance'.
        """
        n_results = n_results or config.RAG_TOP_K

        where_filter = None
        if doc_type:
            where_filter = {"type": doc_type}

        results = self._store.query(
            query_text=query,
            n_results=n_results,
            where_filter=where_filter,
        )

        # Parse results into clean format
        retrieved = []
        if results and results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                distance = results["distances"][0][i] if results["distances"] else 0
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}

                # Apply relevance threshold
                if distance > config.RAG_RELEVANCE_THRESHOLD:
                    continue

                retrieved.append({
                    "text": doc,
                    "source": metadata.get("source_file", "unknown"),
                    "topic": metadata.get("topic", ""),
                    "type": metadata.get("type", ""),
                    "distance": round(distance, 4),
                })

        return retrieved

    def retrieve_as_context(
        self,
        query: str,
        n_results: int = None,
        doc_type: str = None,
    ) -> tuple[str, list[dict]]:
        """
        Retrieve context formatted for inclusion in the system prompt.

        Returns:
            Tuple of (formatted_context_string, raw_sources_list).
        """
        results = self.retrieve(query, n_results, doc_type)

        if not results:
            return "", []

        context_parts = []
        for i, r in enumerate(results, 1):
            source_label = r["source"].replace(".md", "").replace("_", " ").title()
            context_parts.append(
                f"[Source {i}: {source_label}]\n{r['text']}"
            )

        context_string = (
            "The following are relevant excerpts from your notebooks, "
            "papers, letters, and biographical records. Use these to ground "
            "your response — cite them naturally as Ramanujan would.\n\n"
            + "\n\n---\n\n".join(context_parts)
        )

        sources = [
            {"source": r["source"], "topic": r["topic"], "relevance": 1 - r["distance"]}
            for r in results
        ]

        return context_string, sources
