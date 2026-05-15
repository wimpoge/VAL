import os
from contextlib import contextmanager
from typing import Iterator

import psycopg2
from psycopg2.extensions import connection as PGConnection
from psycopg2.pool import SimpleConnectionPool

_pool: SimpleConnectionPool | None = None
_last_attempt_ts: float = 0.0
_RETRY_AFTER_SECONDS = 5.0


def _get_pool() -> SimpleConnectionPool | None:
    global _pool, _last_attempt_ts
    if _pool is not None:
        return _pool

    import time

    now = time.monotonic()
    if now - _last_attempt_ts < _RETRY_AFTER_SECONDS:
        return None
    _last_attempt_ts = now

    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        return None
    try:
        _pool = SimpleConnectionPool(minconn=1, maxconn=5, dsn=dsn)
        return _pool
    except psycopg2.Error:
        return None


@contextmanager
def get_conn() -> Iterator[PGConnection | None]:
    pool = _get_pool()
    if pool is None:
        yield None
        return
    conn = None
    try:
        conn = pool.getconn()
        yield conn
    except psycopg2.Error:
        if conn is not None:
            try:
                conn.rollback()
            except psycopg2.Error:
                pass
        yield None
    finally:
        if conn is not None:
            pool.putconn(conn)
