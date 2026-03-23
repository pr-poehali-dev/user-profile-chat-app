import json
import os
import hashlib
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p62738679_user_profile_chat_ap")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        f"""SELECT u.id FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None


def fetch_user(conn, user_id: int) -> dict:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT id, username, email, name, bio, custom_status,
                   online_status, avatar_initials, followers_count, following_count, posts_count
            FROM {SCHEMA}.users WHERE id = %s""",
        (user_id,)
    )
    row = cur.fetchone()
    if not row:
        return {}
    cols = ["id", "username", "email", "name", "bio", "custom_status",
            "online_status", "avatar_initials", "followers_count", "following_count", "posts_count"]
    return dict(zip(cols, row))


def handler(event: dict, context) -> dict:
    """Профиль пользователя: обновление данных. action=update — обновить профиль, action=get — получить профиль."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    token = headers.get("X-Authorization", "").replace("Bearer ", "").strip()
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "get")

    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    conn = get_conn()
    user_id = get_user_by_token(conn, token)
    if not user_id:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия истекла"})}

    # GET ?action=get
    if method == "GET" or action == "get":
        user = fetch_user(conn, user_id)
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}

    # POST ?action=update
    if method == "POST" and action == "update":
        body = {}
        if event.get("body"):
            body = json.loads(event["body"])

        name = (body.get("name") or "").strip()
        bio = (body.get("bio") or "").strip()
        custom_status = (body.get("custom_status") or "").strip()
        online_status = (body.get("online_status") or "").strip()
        new_password = (body.get("new_password") or "").strip()
        current_password = (body.get("current_password") or "").strip()

        valid_statuses = {"online", "away", "busy", "offline"}
        if online_status and online_status not in valid_statuses:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверный статус"})}

        cur = conn.cursor()
        updates = []
        params = []

        if name:
            initials = "".join([w[0].upper() for w in name.split()[:2]])
            updates += ["name = %s", "avatar_initials = %s"]
            params += [name, initials]
        if bio is not None:
            updates.append("bio = %s")
            params.append(bio)
        if custom_status is not None:
            updates.append("custom_status = %s")
            params.append(custom_status)
        if online_status:
            updates.append("online_status = %s")
            params.append(online_status)

        if new_password:
            if len(new_password) < 6:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Новый пароль минимум 6 символов"})}
            if not current_password:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Введите текущий пароль"})}
            cur.execute(f"SELECT password_hash FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            if not row or row[0] != hashlib.sha256(current_password.encode()).hexdigest():
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Неверный текущий пароль"})}
            updates.append("password_hash = %s")
            params.append(hashlib.sha256(new_password.encode()).hexdigest())

        if updates:
            params.append(user_id)
            cur.execute(
                f"UPDATE {SCHEMA}.users SET {', '.join(updates)} WHERE id = %s",
                params
            )
            conn.commit()

        user = fetch_user(conn, user_id)
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
