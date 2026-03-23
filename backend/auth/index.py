import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p62738679_user_profile_chat_ap")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        f"""SELECT u.id, u.username, u.email, u.name, u.bio, u.custom_status,
                   u.online_status, u.avatar_initials, u.followers_count, u.following_count, u.posts_count
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    cols = ["id", "username", "email", "name", "bio", "custom_status",
            "online_status", "avatar_initials", "followers_count", "following_count", "posts_count"]
    return dict(zip(cols, row))


def handler(event: dict, context) -> dict:
    """Аутентификация: регистрация, вход, выход, получение текущего пользователя. action передаётся в query: ?action=register|login|logout|me"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    token = headers.get("X-Authorization", "").replace("Bearer ", "").strip()
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "me")

    conn = get_conn()

    # GET ?action=me
    if method == "GET" and action == "me":
        if not token:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
        user = get_user_by_token(conn, token)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия истекла"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # POST ?action=register
    if method == "POST" and action == "register":
        username = (body.get("username") or "").strip().lower()
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""
        name = (body.get("name") or "").strip()

        if not username or not email or not password or not name:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}
        if len(password) < 6:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

        initials = "".join([w[0].upper() for w in name.split()[:2]])
        pw_hash = hash_password(password)
        cur = conn.cursor()

        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE username = %s OR email = %s", (username, email))
        if cur.fetchone():
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Логин или email уже занят"})}

        cur.execute(
            f"""INSERT INTO {SCHEMA}.users (username, email, password_hash, name, avatar_initials, online_status)
                VALUES (%s, %s, %s, %s, %s, 'online') RETURNING id""",
            (username, email, pw_hash, name, initials)
        )
        user_id = cur.fetchone()[0]

        session_token = make_token()
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)",
            (user_id, session_token)
        )
        conn.commit()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "token": session_token,
                "user": {
                    "id": user_id, "username": username, "email": email,
                    "name": name, "bio": "", "custom_status": "",
                    "online_status": "online", "avatar_initials": initials,
                    "followers_count": 0, "following_count": 0, "posts_count": 0
                }
            })
        }

    # POST ?action=login
    if method == "POST" and action == "login":
        login = (body.get("login") or "").strip().lower()
        password = body.get("password") or ""

        if not login or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Введите логин и пароль"})}

        pw_hash = hash_password(password)
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id, username, email, name, bio, custom_status,
                       online_status, avatar_initials, followers_count, following_count, posts_count
                FROM {SCHEMA}.users
                WHERE (username = %s OR email = %s) AND password_hash = %s""",
            (login, login, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный логин или пароль"})}

        cols = ["id", "username", "email", "name", "bio", "custom_status",
                "online_status", "avatar_initials", "followers_count", "following_count", "posts_count"]
        user = dict(zip(cols, row))

        cur.execute(f"UPDATE {SCHEMA}.users SET online_status = 'online', last_seen_at = NOW() WHERE id = %s", (user["id"],))
        session_token = make_token()
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user["id"], session_token))
        conn.commit()

        user["online_status"] = "online"
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": session_token, "user": user})}

    # POST ?action=logout
    if method == "POST" and action == "logout":
        if token:
            cur = conn.cursor()
            cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE token = %s", (token,))
            row = cur.fetchone()
            if row:
                cur.execute(f"UPDATE {SCHEMA}.users SET online_status = 'offline' WHERE id = %s", (row[0],))
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
            conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}