"""
Web scraper for external Ramanujan sources.
Fetches content from URLs (Wikipedia, arXiv, archive.org, YouTube, etc.)
and converts them into markdown files for the RAG corpus.

Usage: python -m rag.web_scraper
"""
import sys
import re
import time
import json
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import requests

# ──────────────────────────────────────────────────────────────────────────────
# URL Catalogue  (add / remove entries freely)
# ──────────────────────────────────────────────────────────────────────────────
SOURCES = [
    # ── Books & Notebooks ────────────────────────────────────────────────────
    {
        "url": "https://archive.org/details/pli.kerala.rare.28155",
        "output": "book_kerala_rare_28155.md",
        "topic": "Ramanujan notebooks Kerala rare",
        "type": "book",
        "method": "archive_org_metadata",
    },
    {
        "url": "https://archive.org/details/srinivasaramanuj0000unse",
        "output": "book_srinivasa_ramanujan_biography.md",
        "topic": "Ramanujan biography",
        "type": "book",
        "method": "archive_org_metadata",
    },
    {
        "url": "https://archive.org/details/lost-notebook",
        "output": "book_lost_notebook.md",
        "topic": "Ramanujan lost notebook",
        "type": "book",
        "method": "archive_org_metadata",
    },
    {
        "url": "https://archive.org/details/pli.kerala.rare.37877",
        "output": "book_kerala_rare_37877.md",
        "topic": "Ramanujan Kerala rare manuscript",
        "type": "book",
        "method": "archive_org_metadata",
    },
    # ── Research Papers ──────────────────────────────────────────────────────
    {
        "url": "https://arxiv.org/abs/2103.09654",
        "output": "paper_ramanujan_computing_technology.md",
        "topic": "Ramanujan in computing technology pi series Ramanujan graphs",
        "type": "paper",
        "method": "arxiv_abstract",
        "arxiv_id": "2103.09654",
    },
    {
        "url": "https://en.wikipedia.org/wiki/Ramanujan%27s_sum",
        "output": "paper_ramanujan_sum_wiki.md",
        "topic": "Ramanujan sum number theory arithmetic functions",
        "type": "paper",
        "method": "wikipedia_api",
        "wiki_title": "Ramanujan%27s_sum",
    },
    {
        "url": "https://en.wikipedia.org/wiki/Ramanujan%27s_lost_notebook",
        "output": "paper_lost_notebook_wiki.md",
        "topic": "Ramanujan lost notebook mathematics",
        "type": "paper",
        "method": "wikipedia_api",
        "wiki_title": "Ramanujan%27s_lost_notebook",
    },
    {
        "url": "https://en.wikipedia.org/wiki/Srinivasa_Ramanujan",
        "output": "web_wikipedia_ramanujan.md",
        "topic": "Srinivasa Ramanujan biography mathematics life",
        "type": "biography",
        "method": "wikipedia_api",
        "wiki_title": "Srinivasa_Ramanujan",
    },
    # ── Lectures / Courses ───────────────────────────────────────────────────
    {
        "url": "https://ramanujanexplained.org/",
        "output": "web_ramanujan_explained.md",
        "topic": "Ramanujan explained lectures mathematics education",
        "type": "lecture",
        "method": "html_scrape",
    },
    {
        "url": "https://www.youtube.com/watch?v=NVVhGtFVpEU",
        "output": "lecture_youtube_NVVhGtFVpEU.md",
        "topic": "Ramanujan lecture video transcript",
        "type": "lecture",
        "method": "youtube_transcript",
        "video_id": "NVVhGtFVpEU",
    },
    {
        "url": "https://sites.google.com/site/math4raghuram/videos",
        "output": "web_math4raghuram_videos.md",
        "topic": "Ramanujan mathematics videos Raghuram",
        "type": "lecture",
        "method": "html_scrape",
    },
    # ── Documentaries ────────────────────────────────────────────────────────
    {
        "url": "https://archive.org/details/SrinivasaRamanujan-TheMathematicianandHisLegacy-20170518webm",
        "output": "doc_ramanujan_legacy_documentary.md",
        "topic": "Ramanujan documentary mathematician legacy",
        "type": "documentary",
        "method": "archive_org_metadata",
    },
    # ── Institutional Pages ──────────────────────────────────────────────────
    {
        "url": "https://www.imsc.res.in/~rao/ramanujan/index.html",
        "output": "web_imsc_ramanujan.md",
        "topic": "Ramanujan IMSC Institute of Mathematical Sciences",
        "type": "biography",
        "method": "html_scrape",
    },
    {
        "url": "https://en.wikipedia.org/wiki/Ramanujan_conjecture",
        "output": "web_ramanujan_conjecture_wiki.md",
        "topic": "Ramanujan conjecture tau function modular forms",
        "type": "paper",
        "method": "wikipedia_api",
        "wiki_title": "Ramanujan_conjecture",
    },
]

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def clean_text(text: str) -> str:
    """Strip excessive whitespace, HTML remnants, and normalise unicode."""
    # Remove HTML tags if any slipped through
    text = re.sub(r"<[^>]+>", " ", text)
    # Collapse whitespace runs
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()
    return text


def make_frontmatter(source_url: str, topic: str, doc_type: str, title: str = "") -> str:
    return (
        f"---\n"
        f"source_url: {source_url}\n"
        f"topic: {topic}\n"
        f"type: {doc_type}\n"
        f"title: {title}\n"
        f"---\n\n"
    )


# ──────────────────────────────────────────────────────────────────────────────
# Scrapers
# ──────────────────────────────────────────────────────────────────────────────

def scrape_wikipedia_api(source: dict) -> str:
    """Use the Wikipedia REST API (clean wikitext → plain text)."""
    title = source["wiki_title"]
    api = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
    r = requests.get(api, headers=HEADERS, timeout=20)
    r.raise_for_status()
    summary = r.json()

    # Also grab full sections via the Extracts API
    params = {
        "action": "query",
        "titles": title.replace("_", " "),
        "prop": "extracts",
        "explaintext": True,
        "exsectionformat": "plain",
        "format": "json",
    }
    r2 = requests.get("https://en.wikipedia.org/w/api.php", params=params,
                       headers=HEADERS, timeout=30)
    r2.raise_for_status()
    pages = r2.json()["query"]["pages"]
    page = next(iter(pages.values()))
    full_text = page.get("extract", "")

    title_str = summary.get("title", title)
    description = summary.get("description", "")
    intro = summary.get("extract", "")

    content = f"# {title_str}\n\n"
    if description:
        content += f"**{description}**\n\n"
    if full_text:
        content += full_text
    else:
        content += intro
    return clean_text(content)


def scrape_arxiv_abstract(source: dict) -> str:
    """Fetch arXiv abstract via the arXiv API, with retry on 429/503."""
    arxiv_id = source.get("arxiv_id", "")
    if not arxiv_id:
        m = re.search(r"arxiv\.org/(?:abs|pdf)/([0-9]+\.[0-9]+)", source["url"])
        arxiv_id = m.group(1) if m else ""

    if not arxiv_id:
        raise ValueError(f"Cannot parse arXiv ID from {source['url']}")

    api = f"https://export.arxiv.org/api/query?id_list={arxiv_id}"
    last_err = None
    for attempt in range(4):
        try:
            r = requests.get(api, headers=HEADERS, timeout=30)
            r.raise_for_status()
            xml = r.text
            break
        except Exception as e:
            last_err = e
            wait = 15 * (attempt + 1)  # 15, 30, 45, 60 s
            print(f"    [arXiv] Attempt {attempt + 1} failed ({e}). Waiting {wait}s...")
            time.sleep(wait)
    else:
        raise last_err

    # Parse title
    title_m = re.search(r"<title>(.*?)</title>", xml, re.DOTALL)
    title = title_m.group(1).strip() if title_m else f"arXiv {arxiv_id}"
    title = re.sub(r"^ArXiv[^:]*:\s*", "", title, flags=re.I)

    # Parse summary
    summary_m = re.search(r"<summary>(.*?)</summary>", xml, re.DOTALL)
    abstract = clean_text(summary_m.group(1)) if summary_m else ""

    # Parse authors
    authors = re.findall(r"<name>(.*?)</name>", xml)
    author_str = ", ".join(authors)

    content = f"# {title}\n\n"
    if author_str:
        content += f"**Authors:** {author_str}\n\n"
    content += f"**arXiv:** {arxiv_id}\n\n"
    content += f"## Abstract\n\n{abstract}\n"
    return content


def scrape_archive_org_metadata(source: dict) -> str:
    """Fetch metadata for an Internet Archive item."""
    # Extract item ID from URL  e.g. .../details/lost-notebook → lost-notebook
    m = re.search(r"/details/([^/?#]+)", source["url"])
    if not m:
        raise ValueError(f"Cannot parse archive.org item ID from {source['url']}")
    item_id = m.group(1)

    api = f"https://archive.org/metadata/{item_id}"
    r = requests.get(api, headers=HEADERS, timeout=30)
    r.raise_for_status()
    data = r.json()
    meta = data.get("metadata", {})

    title = _first(meta, "title") or item_id
    creator = _first(meta, "creator") or _first(meta, "uploader") or ""
    description = _first(meta, "description") or ""
    subject = meta.get("subject", [])
    if isinstance(subject, str):
        subject = [subject]
    date = _first(meta, "date") or ""
    publisher = _first(meta, "publisher") or ""
    language = _first(meta, "language") or ""
    notes = _first(meta, "notes") or ""

    # Build content
    content = f"# {title}\n\n"
    if creator:
        content += f"**Creator/Author:** {creator}\n\n"
    if publisher:
        content += f"**Publisher:** {publisher}\n\n"
    if date:
        content += f"**Date:** {date}\n\n"
    if language:
        content += f"**Language:** {language}\n\n"
    if description:
        desc_clean = re.sub(r"<[^>]+>", " ", description)
        content += f"## Description\n\n{clean_text(desc_clean)}\n\n"
    if subject:
        content += f"## Subjects / Keywords\n\n{', '.join(subject)}\n\n"
    if notes:
        notes_clean = re.sub(r"<[^>]+>", " ", notes)
        content += f"## Notes\n\n{clean_text(notes_clean)}\n\n"
    content += f"**Internet Archive ID:** {item_id}\n"
    content += f"**Source URL:** {source['url']}\n"
    return content


def _first(d: dict, key: str):
    v = d.get(key)
    if isinstance(v, list):
        return v[0] if v else ""
    return v or ""


def scrape_youtube_transcript(source: dict) -> str:
    """Download YouTube transcript using youtube_transcript_api v1.x."""
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled

    video_id = source.get("video_id", "")
    if not video_id:
        m = re.search(r"[?&]v=([A-Za-z0-9_-]{11})", source["url"])
        video_id = m.group(1) if m else ""
    if not video_id:
        raise ValueError(f"Cannot parse YouTube video ID from {source['url']}")

    # v1.x: instantiate the class, then call fetch()
    ytt = YouTubeTranscriptApi()
    try:
        fetched = ytt.fetch(video_id, languages=["en", "en-US", "en-GB"])
    except (NoTranscriptFound, TranscriptsDisabled):
        # Fall back to any available language
        fetched = ytt.fetch(video_id)

    # FetchedTranscript is iterable; each element has a .text attribute
    segments = []
    for seg in fetched:
        txt = getattr(seg, "text", None) or seg.get("text", "") if isinstance(seg, dict) else seg.text
        txt = txt.strip()
        if txt:
            segments.append(txt)

    full_transcript = " ".join(segments)
    if not full_transcript:
        raise ValueError("Transcript was empty after parsing")

    content = "# YouTube Lecture Transcript\n\n"
    content += f"**Video ID:** {video_id}\n"
    content += f"**URL:** {source['url']}\n\n"
    content += f"## Transcript\n\n{full_transcript}\n"
    return content


def scrape_html(source: dict) -> str:
    """Fallback: raw HTTP GET + basic HTML stripping."""
    r = requests.get(source["url"], headers=HEADERS, timeout=30, allow_redirects=True)
    r.raise_for_status()
    html = r.text

    # Extract <title>
    title_m = re.search(r"<title[^>]*>(.*?)</title>", html, re.DOTALL | re.I)
    title = clean_text(title_m.group(1)) if title_m else source["url"]

    # Remove script / style blocks
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.I)
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", html)
    text = clean_text(text)

    # Trim very long content to ~25 000 chars to keep chunks manageable
    if len(text) > 25000:
        text = text[:25000] + "\n\n[Content truncated for length]"

    return f"# {title}\n\n{text}\n"


# ──────────────────────────────────────────────────────────────────────────────
# Dispatch
# ──────────────────────────────────────────────────────────────────────────────

SCRAPERS = {
    "wikipedia_api": scrape_wikipedia_api,
    "arxiv_abstract": scrape_arxiv_abstract,
    "archive_org_metadata": scrape_archive_org_metadata,
    "youtube_transcript": scrape_youtube_transcript,
    "html_scrape": scrape_html,
}


def fetch_source(source: dict) -> str:
    method = source.get("method", "html_scrape")
    scraper = SCRAPERS.get(method, scrape_html)
    return scraper(source)


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def scrape_all():
    import config

    corpus_dir = config.CORPUS_DIR
    corpus_dir.mkdir(parents=True, exist_ok=True)

    success, failed = [], []

    for i, source in enumerate(SOURCES, 1):
        url = source["url"]
        output_name = source["output"]
        output_path = corpus_dir / output_name

        print(f"\n[{i}/{len(SOURCES)}] {output_name}")
        print(f"  URL    : {url}")
        print(f"  Method : {source['method']}")

        try:
            content = fetch_source(source)
            if not content or len(content.strip()) < 50:
                raise ValueError("Scraped content too short / empty")

            # Prepend YAML frontmatter (chunker will strip it automatically)
            frontmatter = make_frontmatter(
                source_url=url,
                topic=source.get("topic", ""),
                doc_type=source.get("type", "general"),
                title=output_name.replace(".md", "").replace("_", " "),
            )
            final = frontmatter + content

            output_path.write_text(final, encoding="utf-8")
            char_count = len(content)
            print(f"  [OK] Saved {char_count:,} chars -> corpus/{output_name}")
            success.append(output_name)

        except Exception as e:
            print(f"  [FAIL] FAILED: {e}")
            traceback.print_exc()
            failed.append((output_name, str(e)))

        # Be polite – don't hammer servers
        time.sleep(1.2)

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print(f"Scraping complete:  {len(success)} succeeded,  {len(failed)} failed")
    if failed:
        print("\nFailed sources:")
        for name, err in failed:
            print(f"  - {name}: {err}")
    print("=" * 60)


if __name__ == "__main__":
    scrape_all()
