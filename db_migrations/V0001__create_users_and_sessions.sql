
CREATE TABLE IF NOT EXISTS t_p62738679_user_profile_chat_ap.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    bio TEXT DEFAULT '',
    custom_status VARCHAR(100) DEFAULT '',
    online_status VARCHAR(20) DEFAULT 'offline',
    avatar_initials VARCHAR(4) DEFAULT '',
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p62738679_user_profile_chat_ap.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p62738679_user_profile_chat_ap.users(id),
    token VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON t_p62738679_user_profile_chat_ap.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON t_p62738679_user_profile_chat_ap.sessions(user_id);
