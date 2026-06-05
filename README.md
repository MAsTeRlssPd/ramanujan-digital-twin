# Ramanujan Digital Twin

> *"An equation has no meaning to me unless it expresses a thought of God."* — Srinivasa Ramanujan

A Digital Twin of **Srinivasa Ramanujan (1887–1920)**, the self-taught mathematical genius from Tamil Nadu. This AI agent faithfully emulates Ramanujan's voice, mathematical knowledge, and reasoning style, grounded in his actual notebooks, papers, and letters via a RAG pipeline, with persistent memory across sessions.

## ✨ Features

- **Authentic Persona**: Speaks as Ramanujan in first person, humble, spiritual, mathematically profound
- **RAG Pipeline**: Grounded in ~19 curated documents from Ramanujan's actual work (notebooks, papers, letters, biographical sources)
- **Interactive Source Citations**: Answers are grounded in local documents, with expandable panels that reveal the exact source text directly in the chat UI
- **Dual Memory System**: Short-term conversation history + long-term persistent memory across sessions
- **Streaming Chat**: Real-time WebSocket streaming for natural conversation flow
- **Math Rendering**: LaTeX formulas rendered beautifully via KaTeX
- **Handwriting Generation**: For complex mathematical queries, Ramanujan dynamically generates and renders his answers as vintage handwritten notes
- **Voice Capabilities**: Talk to Ramanujan using live Indian-English speech recognition, and hear him reply via Text-to-Speech
- **Interactive Graphing**: 2D and 3D visualizations of mathematical functions using function-plot and Plotly.js
- **Memory Dashboard**: Visual display of what Ramanujan "remembers" about you
- **Life Timeline**: Interactive timeline of Ramanujan's life (1887–1920)
- **Timeline Awareness**: Gracefully handles questions about post-1920 events

## 🏗️ Architecture

```
Frontend (Browser)                     Backend (FastAPI)
┌──────────────────┐                  ┌──────────────────────────────┐
│  Chat UI         │ ◄──WebSocket──► │  Chat Handler                │
│  Memory Dashboard│ ◄──REST API──►  │    ├── RAG Retriever         │
│  Life Timeline   │                  │    │    └── ChromaDB          │
│  KaTeX Rendering │                  │    ├── Memory Manager         │
└──────────────────┘                  │    │    └── SQLite            │
                                      │    ├── Persona Engine         │
                                      │    └── Gemini 2.5 Flash      │
                                      └──────────────────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- A Google Gemini API key ([get one here](https://aistudio.google.com/apikey))

### 2. Setup
```bash
# Clone the repository
git clone <repo-url>
cd "Rag bot"

# Install dependencies
pip install -r requirements.txt

# Configure your API key
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

### 3. Ingest the Knowledge Base
```bash
python -m rag.ingest
```
This processes all corpus documents into ChromaDB embeddings (~19 documents, ~200+ chunks).

### 4. Run
```bash
python run.py
```
Open **http://localhost:8000** in your browser.

## 📁 Project Structure

```
├── corpus/              # RAG source documents (~19 curated files)
├── rag/                 # RAG pipeline (embeddings, chunker, vector store)
├── memory/              # Memory system (short-term + long-term, SQLite)
├── persona/             # Persona engine (system prompt, templates)
├── app/                 # FastAPI backend + frontend
│   ├── main.py          # Routes & WebSocket
│   ├── chat_handler.py  # Chat orchestration
│   └── static/          # HTML/CSS/JS frontend
├── data/                # Runtime data (ChromaDB, SQLite) - gitignored
├── config.py            # Central configuration
├── run.py               # Entry point
└── requirements.txt     # Dependencies
```

## 🧠 How It Works

1. **User sends a message** via WebSocket
2. **RAG Retriever** searches ChromaDB for relevant passages from Ramanujan's notebooks/papers
3. **Memory Manager** recalls long-term facts from past sessions
4. **Persona Engine** assembles the system prompt with context + memory
5. **Gemini 2.5 Flash** generates a streaming response in Ramanujan's voice
6. **Memory Extractor** (background) extracts and stores memorable facts for future sessions

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| LLM | Gemini 2.5 Flash |
| Embeddings | Gemini Embedding 2 (768-dim) |
| Vector Store | ChromaDB |
| Backend | FastAPI + WebSocket |
| Memory | SQLite (aiosqlite) |
| Frontend | Vanilla HTML/CSS/JS |
| Math Rendering | KaTeX |

## 📜 License

This project is for educational purposes. Ramanujan's published works (1927 Collected Papers) are in the public domain.
