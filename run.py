"""
Entry point for the Ramanujan Digital Twin.
Usage: python run.py
"""
import uvicorn
from config import HOST, PORT


def main():
    print("=" * 60)
    print("  Ramanujan Digital Twin")
    print("  Starting server...")
    print(f"  Open http://localhost:{PORT} in your browser")
    print("=" * 60)
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)


if __name__ == "__main__":
    main()
