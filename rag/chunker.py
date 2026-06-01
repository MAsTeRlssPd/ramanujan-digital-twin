"""
Text chunking utilities for RAG document processing.
Splits documents into overlapping chunks while preserving
mathematical expressions and section structure.
"""
import re
from dataclasses import dataclass, field
from typing import List

import config


@dataclass
class Chunk:
    """A chunk of text with metadata."""
    text: str
    metadata: dict = field(default_factory=dict)
    chunk_index: int = 0


class RecursiveTextChunker:
    """
    Splits text recursively using multiple separators,
    preserving mathematical expressions as atomic units.
    """

    def __init__(
        self,
        chunk_size: int = None,
        chunk_overlap: int = None,
        separators: List[str] = None,
    ):
        self.chunk_size = chunk_size or config.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or config.CHUNK_OVERLAP
        self.separators = separators or ["\n\n", "\n", ". ", " "]

    def _protect_math_blocks(self, text: str) -> tuple[str, dict]:
        """Replace LaTeX blocks with placeholders to prevent splitting mid-formula."""
        placeholders = {}
        counter = 0

        # Protect display math: $$...$$
        for match in re.finditer(r'\$\$.*?\$\$', text, re.DOTALL):
            placeholder = f"__MATH_BLOCK_{counter}__"
            placeholders[placeholder] = match.group()
            text = text.replace(match.group(), placeholder, 1)
            counter += 1

        # Protect inline math: $...$
        for match in re.finditer(r'\$[^$]+?\$', text):
            placeholder = f"__MATH_BLOCK_{counter}__"
            placeholders[placeholder] = match.group()
            text = text.replace(match.group(), placeholder, 1)
            counter += 1

        return text, placeholders

    def _restore_math_blocks(self, text: str, placeholders: dict) -> str:
        """Restore LaTeX blocks from placeholders."""
        for placeholder, original in placeholders.items():
            text = text.replace(placeholder, original)
        return text

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        """Recursively split text using the separator hierarchy."""
        if not separators:
            return [text]

        separator = separators[0]
        remaining_separators = separators[1:]

        parts = text.split(separator)

        chunks = []
        current_chunk = ""

        for part in parts:
            # If adding this part would exceed chunk_size
            test_chunk = current_chunk + separator + part if current_chunk else part

            if len(test_chunk) <= self.chunk_size:
                current_chunk = test_chunk
            else:
                # Save current chunk if it has content
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())

                # If the part itself is too large, split it further
                if len(part) > self.chunk_size and remaining_separators:
                    sub_chunks = self._split_text(part, remaining_separators)
                    chunks.extend(sub_chunks)
                    current_chunk = ""
                else:
                    current_chunk = part

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    def _add_overlap(self, chunks: List[str]) -> List[str]:
        """Add overlap between consecutive chunks."""
        if len(chunks) <= 1 or self.chunk_overlap <= 0:
            return chunks

        overlapped = []
        for i, chunk in enumerate(chunks):
            if i > 0:
                # Get the tail of the previous chunk as overlap
                prev_chunk = chunks[i - 1]
                overlap_text = prev_chunk[-self.chunk_overlap:]
                # Find a clean break point (space or newline)
                clean_break = overlap_text.find(" ")
                if clean_break > 0:
                    overlap_text = overlap_text[clean_break + 1:]
                chunk = overlap_text + " " + chunk
            overlapped.append(chunk)

        return overlapped

    def chunk_document(
        self,
        text: str,
        source_file: str = "",
        topic: str = "",
        doc_type: str = "",
    ) -> List[Chunk]:
        """
        Split a document into chunks with metadata.

        Args:
            text: The document text to chunk.
            source_file: Source filename for metadata.
            topic: Topic label for metadata.
            doc_type: Type label (biography/math/personality/letter).

        Returns:
            List of Chunk objects with text and metadata.
        """
        # Strip YAML frontmatter if present
        text_body = text
        extracted_topic = topic
        extracted_type = doc_type

        frontmatter_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
        if frontmatter_match:
            frontmatter = frontmatter_match.group(1)
            text_body = text[frontmatter_match.end():]

            # Extract metadata from frontmatter
            for line in frontmatter.split("\n"):
                if line.startswith("topic:") and not topic:
                    extracted_topic = line.split(":", 1)[1].strip()
                elif line.startswith("type:") and not doc_type:
                    extracted_type = line.split(":", 1)[1].strip()

        # Protect math blocks
        protected_text, placeholders = self._protect_math_blocks(text_body)

        # Split into chunks
        raw_chunks = self._split_text(protected_text, self.separators)

        # Add overlap
        overlapped_chunks = self._add_overlap(raw_chunks)

        # Restore math and create Chunk objects
        chunks = []
        for i, chunk_text in enumerate(overlapped_chunks):
            restored_text = self._restore_math_blocks(chunk_text, placeholders)
            if restored_text.strip():
                chunks.append(
                    Chunk(
                        text=restored_text.strip(),
                        metadata={
                            "source_file": source_file,
                            "topic": extracted_topic,
                            "type": extracted_type,
                            "chunk_index": i,
                            "total_chunks": len(overlapped_chunks),
                        },
                        chunk_index=i,
                    )
                )

        return chunks
