import os

import psycopg2
from dotenv import load_dotenv

load_dotenv()


def main() -> None:
    dsn = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                embedding vector(1536)
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS rag_chunks (
                id SERIAL PRIMARY KEY,
                source TEXT,
                chunk_index INT,
                text TEXT NOT NULL,
                embedding vector(1536)
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS token_usage (
                id BIGSERIAL PRIMARY KEY,
                day TEXT NOT NULL,
                endpoint TEXT NOT NULL,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                prompt_tokens INT NOT NULL DEFAULT 0,
                completion_tokens INT NOT NULL DEFAULT 0,
                total_tokens INT NOT NULL DEFAULT 0,
                cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute(
            "CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage (created_at DESC);"
        )
        cur.execute(
            "CREATE INDEX IF NOT EXISTS idx_token_usage_provider ON token_usage (provider);"
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS node_progress (
                node_id TEXT PRIMARY KEY,
                day INT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT FALSE,
                completed_at TIMESTAMPTZ
            );
            """
        )
        cur.execute(
            "CREATE INDEX IF NOT EXISTS idx_node_progress_day ON node_progress (day);"
        )
    conn.close()
    print("DB initialized")


if __name__ == "__main__":
    main()
