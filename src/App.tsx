import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/b810d65e-d7e1-458a-82e5-3e2ee7febcdc";
const PROFILE_URL = "https://functions.poehali.dev/d2b89cf3-65e5-49b8-9a63-3b03059cddb0";

async function apiAuth(action: string, body?: object, token?: string) {
  const res = await fetch(`${AUTH_URL}?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function apiProfile(action: string, body?: object, token?: string) {
  const res = await fetch(`${PROFILE_URL}?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

type Page = "feed" | "profile" | "chats" | "friends" | "notifications" | "search" | "settings" | "communities";
type OnlineStatus = "online" | "away" | "busy" | "offline";

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  status: OnlineStatus;
  customStatus: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
}

interface Post {
  id: number;
  user: User;
  content: string;
  likes: number;
  comments: number;
  time: string;
  liked: boolean;
}

interface Message {
  id: number;
  text: string;
  fromMe: boolean;
  time: string;
}

interface Chat {
  id: number;
  user: User;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
}

const STATUS_COLORS: Record<OnlineStatus, string> = {
  online: "bg-green-500",
  away: "bg-yellow-400",
  busy: "bg-red-500",
  offline: "bg-gray-500",
};

const STATUS_LABELS: Record<OnlineStatus, string> = {
  online: "В сети",
  away: "Отошёл",
  busy: "Не беспокоить",
  offline: "Не в сети",
};

const MOCK_USERS: User[] = [
  { id: 1, name: "Алексей Громов", username: "gromov", avatar: "АГ", status: "online", customStatus: "🎸 Слушаю музыку", bio: "Разработчик, меломан, любитель гор", followers: 1240, following: 340, posts: 87 },
  { id: 2, name: "Мария Светлова", username: "svetlova", avatar: "МС", status: "away", customStatus: "📚 Читаю книгу", bio: "Дизайнер UI/UX из Москвы", followers: 3200, following: 210, posts: 156 },
  { id: 3, name: "Дмитрий Крас", username: "dkras", avatar: "ДК", status: "busy", customStatus: "🎯 На совещании", bio: "Продуктовый менеджер", followers: 890, following: 450, posts: 43 },
  { id: 4, name: "Анна Лесова", username: "lesova", avatar: "АЛ", status: "online", customStatus: "✈️ В путешествии", bio: "Фотограф, путешественница", followers: 5600, following: 120, posts: 312 },
  { id: 5, name: "Кирилл Нов", username: "novkirill", avatar: "КН", status: "offline", customStatus: "", bio: "Стартапер, технарь", followers: 420, following: 380, posts: 29 },
];

const ME: User = { id: 0, name: "Артём Звёздный", username: "artem_star", avatar: "АЗ", status: "online", customStatus: "🚀 Запускаю ракету", bio: "Фронтенд-разработчик и космический энтузиаст", followers: 842, following: 267, posts: 54 };

const MOCK_POSTS: Post[] = [
  { id: 1, user: MOCK_USERS[1], content: "Закончила новый проект — редизайн мобильного приложения для доставки еды. Очень довольна результатом! 🎨", likes: 47, comments: 12, time: "2 мин назад", liked: false },
  { id: 2, user: MOCK_USERS[0], content: "Только что вернулся с концерта — было невероятно! Живая музыка — это совсем другое ощущение. Кто ещё любит ходить на концерты?", likes: 83, comments: 24, time: "15 мин назад", liked: true },
  { id: 3, user: MOCK_USERS[3], content: "Горы встречают рассветом. Нет ничего лучше тишины и панорамного вида на 3000 метрах над уровнем моря 🏔️", likes: 156, comments: 38, time: "1 час назад", liked: false },
  { id: 4, user: MOCK_USERS[2], content: "Провели продуктовый спринт — 3 дня, 24 фичи в бэклоге, одна главная мысль: меньше совещаний, больше делать!", likes: 29, comments: 7, time: "3 часа назад", liked: false },
];

const MOCK_CHATS: Chat[] = [
  { id: 1, user: MOCK_USERS[1], lastMessage: "Спасибо, посмотрю сегодня!", time: "2 мин", unread: 2, messages: [
    { id: 1, text: "Привет! Как твой проект?", fromMe: true, time: "14:20" },
    { id: 2, text: "Всё отлично, заканчиваю дизайн!", fromMe: false, time: "14:22" },
    { id: 3, text: "Скинь посмотреть когда будет готово", fromMe: true, time: "14:23" },
    { id: 4, text: "Спасибо, посмотрю сегодня!", fromMe: false, time: "14:25" },
  ]},
  { id: 2, user: MOCK_USERS[0], lastMessage: "Да, был там — просто огонь 🔥", time: "15 мин", unread: 0, messages: [
    { id: 1, text: "Ты был на концерте?", fromMe: true, time: "13:10" },
    { id: 2, text: "Да, был там — просто огонь 🔥", fromMe: false, time: "13:45" },
  ]},
  { id: 3, user: MOCK_USERS[3], lastMessage: "Следующая вылазка в горы — через месяц!", time: "1 ч", unread: 1, messages: [
    { id: 1, text: "Классные фото из поездки!", fromMe: true, time: "10:00" },
    { id: 2, text: "Следующая вылазка в горы — через месяц!", fromMe: false, time: "10:05" },
  ]},
  { id: 4, user: MOCK_USERS[4], lastMessage: "Надо обсудить партнёрство", time: "вчера", unread: 0, messages: [
    { id: 1, text: "Надо обсудить партнёрство", fromMe: false, time: "вчера" },
  ]},
];

function AuthScreen({ onAuth }: { onAuth: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ login: "", username: "", email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await apiAuth("login", { login: form.login, password: form.password });
      } else {
        data = await apiAuth("register", { username: form.username, email: form.email, password: form.password, name: form.name });
      }
      if (data.error) { setError(data.error); return; }
      const u = data.user;
      const mapped: User = {
        id: u.id, name: u.name, username: u.username,
        avatar: u.avatar_initials || u.name.slice(0,2).toUpperCase(),
        status: (u.online_status as OnlineStatus) || "online",
        customStatus: u.custom_status || "",
        bio: u.bio || "",
        followers: u.followers_count || 0,
        following: u.following_count || 0,
        posts: u.posts_count || 0,
      };
      onAuth(mapped, data.token);
    } catch {
      setError("Ошибка соединения. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
            <span className="text-white font-black text-2xl">Н</span>
          </div>
          <h1 className="text-2xl font-black text-foreground">Нексус</h1>
          <p className="text-muted-foreground text-sm mt-1">Социальная сеть нового поколения</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Имя</label>
                  <input value={form.name} onChange={e => set("name", e.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Логин</label>
                  <input value={form.username} onChange={e => set("username", e.target.value)}
                    placeholder="ivan_ivanov"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Email</label>
                  <input value={form.email} onChange={e => set("email", e.target.value)}
                    placeholder="ivan@example.com" type="email"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
                </div>
              </>
            )}
            {mode === "login" && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Логин или Email</label>
                <input value={form.login} onChange={e => set("login", e.target.value)}
                  placeholder="ivan_ivanov"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Пароль</label>
              <input value={form.password} onChange={e => set("password", e.target.value)}
                placeholder="••••••••" type="password"
                onKeyDown={e => e.key === "Enter" && submit()}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
            </div>
          </div>

          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button onClick={submit} disabled={loading}
            className="w-full mt-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all hover:scale-[1.01] disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : null}
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </div>
      </div>
    </div>
  );
}

const AVATAR_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-purple-500 to-violet-600",
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function Avatar({ user, size = "md", showStatus = false }: { user: User; size?: "sm" | "md" | "lg" | "xl"; showStatus?: boolean }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base", xl: "w-20 h-20 text-xl" };
  const dotSizes = { sm: "w-2.5 h-2.5 -bottom-0.5 -right-0.5", md: "w-3 h-3 -bottom-0.5 -right-0.5", lg: "w-3.5 h-3.5 bottom-0 right-0", xl: "w-4 h-4 bottom-0.5 right-0.5" };
  return (
    <div className="relative inline-flex shrink-0">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${getAvatarColor(user.name)} flex items-center justify-center font-bold text-white`}>
        {user.avatar}
      </div>
      {showStatus && (
        <span className={`absolute ${dotSizes[size]} ${STATUS_COLORS[user.status]} rounded-full border-2 border-[hsl(225,18%,8%)]`} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: OnlineStatus }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
      <span className="text-muted-foreground">{STATUS_LABELS[status]}</span>
    </span>
  );
}

function FeedPage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState("");

  const toggleLike = (id: number) => {
    setPosts(ps => ps.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex gap-3 items-start">
          <Avatar user={ME} showStatus />
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="Что у тебя нового?"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground min-h-[80px]"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-primary/10">
                  <Icon name="Image" size={16} /> Фото
                </button>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-primary/10">
                  <Icon name="Smile" size={16} /> Эмодзи
                </button>
              </div>
              <button
                onClick={() => setNewPost("")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-1.5 rounded-lg text-sm font-semibold transition-all hover:scale-105 disabled:opacity-40"
                disabled={!newPost.trim()}
              >
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      </div>

      {posts.map((post, i) => (
        <div key={post.id} className="bg-card border border-border rounded-2xl p-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex gap-3 mb-3">
            <Avatar user={post.user} showStatus />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{post.user.name}</span>
                <span className="text-muted-foreground text-xs">@{post.user.username}</span>
                {post.user.customStatus && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{post.user.customStatus}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{post.time}</span>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors ml-auto">
              <Icon name="MoreHorizontal" size={18} />
            </button>
          </div>
          <p className="text-foreground text-sm leading-relaxed mb-4">{post.content}</p>
          <div className="flex items-center gap-4 pt-3 border-t border-border/50">
            <button
              onClick={() => toggleLike(post.id)}
              className={`flex items-center gap-1.5 text-sm transition-all hover:scale-105 ${post.liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}
            >
              <Icon name="Heart" size={17} />
              <span>{post.likes}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Icon name="MessageCircle" size={17} />
              <span>{post.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Icon name="Share2" size={17} />
              <span>Поделиться</span>
            </button>
            <button className="ml-auto text-muted-foreground hover:text-primary transition-colors">
              <Icon name="Bookmark" size={17} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfilePage({ user, isMe = false }: { user: User; isMe?: boolean }) {
  const [activeTab, setActiveTab] = useState<"posts" | "media" | "friends">("posts");
  const myPosts = MOCK_POSTS.filter(p => p.user.id === user.id).slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
        <div className="h-32 bg-gradient-to-r from-violet-600/40 via-indigo-600/40 to-cyan-600/40 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,hsl(var(--primary)/0.2),transparent_70%)]" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <Avatar user={user} size="xl" />
              <span className={`absolute bottom-1 right-1 w-4 h-4 ${STATUS_COLORS[user.status]} rounded-full border-2 border-card`} />
            </div>
            {isMe ? (
              <button className="bg-muted hover:bg-muted/80 text-foreground text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-border">
                Редактировать
              </button>
            ) : (
              <div className="flex gap-2">
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  Добавить
                </button>
                <button className="bg-muted hover:bg-muted/80 text-foreground text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-border">
                  Написать
                </button>
              </div>
            )}
          </div>
          <div className="mb-3">
            <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
            <span className="text-muted-foreground text-sm">@{user.username}</span>
          </div>
          {user.customStatus && (
            <div className="inline-flex items-center gap-2 bg-muted/60 text-sm text-foreground px-3 py-1.5 rounded-full mb-3 border border-border/50">
              <span>{user.customStatus}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status={user.status} />
          </div>
          <p className="text-sm text-muted-foreground mb-4">{user.bio}</p>
          <div className="flex gap-6">
            {[["Посты", user.posts], ["Подписчики", user.followers], ["Подписки", user.following]].map(([label, val]) => (
              <div key={label as string} className="text-center">
                <div className="text-lg font-bold text-foreground">{Number(val).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{label as string}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-border">
          {(["posts", "media", "friends"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab === "posts" ? "Посты" : tab === "media" ? "Медиа" : "Друзья"}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === "posts" && (
            myPosts.length > 0 ? myPosts.map(post => (
              <div key={post.id} className="py-3 border-b border-border/50 last:border-0">
                <p className="text-sm text-foreground">{post.content}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="Heart" size={12} />{post.likes}</span>
                  <span className="flex items-center gap-1"><Icon name="MessageCircle" size={12} />{post.comments}</span>
                  <span>{post.time}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground text-sm">Нет постов</div>
            )
          )}
          {activeTab === "media" && (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-xl" />
              ))}
            </div>
          )}
          {activeTab === "friends" && (
            <div className="grid grid-cols-2 gap-3">
              {MOCK_USERS.slice(0, 4).map(u => (
                <div key={u.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                  <Avatar user={u} size="sm" showStatus />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatsPage() {
  const [chats] = useState(MOCK_CHATS);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const openChat = (chat: Chat) => {
    setActiveChat(chat);
    setMessages(chat.messages);
  };

  const sendMessage = () => {
    if (!message.trim() || !activeChat) return;
    const newMsg: Message = { id: messages.length + 1, text: message, fromMe: true, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, newMsg]);
    setMessage("");
  };

  return (
    <div className="flex gap-0 bg-card border border-border rounded-2xl overflow-hidden animate-fade-in" style={{ height: "calc(100vh - 120px)" }}>
      <div className={`w-72 shrink-0 border-r border-border flex flex-col ${activeChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Поиск чатов..." className="w-full bg-muted border border-border rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => openChat(chat)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left ${activeChat?.id === chat.id ? "bg-primary/10 border-r-2 border-primary" : ""}`}
            >
              <Avatar user={chat.user} showStatus />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm text-foreground truncate">{chat.user.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground truncate">{chat.lastMessage}</span>
                  {chat.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-1">{chat.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeChat ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <button onClick={() => setActiveChat(null)} className="md:hidden text-muted-foreground hover:text-foreground transition-colors mr-1">
              <Icon name="ChevronLeft" size={20} />
            </button>
            <Avatar user={activeChat.user} showStatus />
            <div>
              <div className="font-semibold text-foreground">{activeChat.user.name}</div>
              <StatusBadge status={activeChat.user.status} />
            </div>
            <div className="ml-auto flex gap-2">
              <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"><Icon name="Phone" size={18} /></button>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"><Icon name="Video" size={18} /></button>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"><Icon name="MoreVertical" size={18} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"} message-appear`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${msg.fromMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                  <p>{msg.text}</p>
                  <span className={`text-xs mt-1 block ${msg.fromMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border flex gap-3 items-center">
            <button className="text-muted-foreground hover:text-primary transition-colors"><Icon name="Paperclip" size={20} /></button>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Написать сообщение..."
              className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
            />
            <button className="text-muted-foreground hover:text-primary transition-colors"><Icon name="Smile" size={20} /></button>
            <button
              onClick={sendMessage}
              className="bg-primary hover:bg-primary/90 text-primary-foreground p-2.5 rounded-xl transition-all hover:scale-105 disabled:opacity-40"
              disabled={!message.trim()}
            >
              <Icon name="Send" size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="MessageCircle" size={28} className="text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">Выбери чат</p>
            <p className="text-muted-foreground text-sm">Выбери диалог слева, чтобы начать общение</p>
          </div>
        </div>
      )}
    </div>
  );
}

function FriendsPage() {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
        <div className="flex border-b border-border">
          {["Все друзья", "Онлайн", "Запросы"].map((tab, i) => (
            <button key={tab} className={`flex-1 py-3 text-sm font-medium transition-colors ${i === 0 ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="p-2">
          {MOCK_USERS.map((user, i) => (
            <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <Avatar user={user} showStatus />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{user.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === "online" ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABELS[user.status]}
                  </span>
                </div>
                {user.customStatus && <p className="text-xs text-muted-foreground truncate">{user.customStatus}</p>}
              </div>
              <div className="flex gap-2">
                <button className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/10">
                  <Icon name="MessageCircle" size={17} />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted">
                  <Icon name="MoreHorizontal" size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsPage() {
  const items = [
    { id: 1, user: MOCK_USERS[0], action: "лайкнул ваш пост", time: "2 мин назад", read: false },
    { id: 2, user: MOCK_USERS[1], action: "прокомментировал вашу запись", time: "15 мин назад", read: false },
    { id: 3, user: MOCK_USERS[3], action: "отправил запрос в друзья", time: "1 час назад", read: true },
    { id: 4, user: MOCK_USERS[2], action: "упомянул вас в посте", time: "3 часа назад", read: true },
    { id: 5, user: MOCK_USERS[4], action: "начал на вас подписываться", time: "вчера", read: true },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Уведомления</h2>
          <button className="text-primary text-sm hover:text-primary/80 transition-colors">Прочитать все</button>
        </div>
        <div className="divide-y divide-border/50">
          {items.map((item, i) => (
            <div key={item.id} className={`flex items-start gap-3 p-4 transition-colors hover:bg-muted/30 animate-fade-in ${!item.read ? "bg-primary/5" : ""}`} style={{ animationDelay: `${i * 50}ms` }}>
              <Avatar user={item.user} />
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{item.user.name}</span>
                  {" "}<span className="text-muted-foreground">{item.action}</span>
                </p>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
              {!item.read && <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const filtered = query.length > 0
    ? MOCK_USERS.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.username.toLowerCase().includes(query.toLowerCase()))
    : MOCK_USERS;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="relative">
          <Icon name="Search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск людей, сообществ, постов..."
            className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">{query ? "Результаты поиска" : "Все пользователи"}</span>
        </div>
        <div className="p-2">
          {filtered.map((user, i) => (
            <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <Avatar user={user} showStatus />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">{user.name}</div>
                <div className="text-xs text-muted-foreground">@{user.username} · {user.bio}</div>
              </div>
              <StatusBadge status={user.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommunitiesPage() {
  const communities = [
    { id: 1, name: "Разработчики RU", description: "Обсуждаем код, технологии, карьеру", members: 12400, icon: "💻", color: "from-indigo-500 to-violet-600" },
    { id: 2, name: "Дизайн & UI", description: "Вдохновение, кейсы, обратная связь", members: 8700, icon: "🎨", color: "from-pink-500 to-rose-600" },
    { id: 3, name: "Стартапы & Бизнес", description: "Идеи, инвестиции, нетворкинг", members: 5200, icon: "🚀", color: "from-orange-500 to-amber-600" },
    { id: 4, name: "Путешествия", description: "Маршруты, советы, фотографии", members: 19800, icon: "✈️", color: "from-cyan-500 to-blue-600" },
    { id: 5, name: "Музыка & Культура", description: "Рецензии, концерты, обсуждения", members: 7100, icon: "🎸", color: "from-emerald-500 to-teal-600" },
    { id: 6, name: "Спорт & Здоровье", description: "Тренировки, питание, мотивация", members: 14300, icon: "💪", color: "from-purple-500 to-violet-600" },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {communities.map((c, i) => (
          <div key={c.id} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer animate-fade-in group" style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform`}>
              {c.icon}
            </div>
            <h3 className="font-semibold text-foreground mb-1">{c.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{c.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{c.members.toLocaleString()} участников</span>
              <button className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg transition-all">
                Вступить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage({ user, token, setUser }: { user: User; token: string | null; setUser: (u: User) => void }) {
  const [status, setStatus] = useState<OnlineStatus>(user.status);
  const [customStatus, setCustomStatus] = useState(user.customStatus);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name.trim()) { setError("Имя не может быть пустым"); return; }
    setError("");
    setSaving(true);
    try {
      const body: Record<string, string> = {
        name: name.trim(),
        bio: bio.trim(),
        custom_status: customStatus.trim(),
        online_status: status,
      };
      if (newPassword) {
        body.new_password = newPassword;
        body.current_password = currentPassword;
      }
      const data = await apiProfile("update", body, token || undefined);
      if (data.error) { setError(data.error); return; }
      const u = data.user;
      setUser({
        ...user,
        name: u.name,
        bio: u.bio || "",
        customStatus: u.custom_status || "",
        status: (u.online_status as OnlineStatus) || "online",
        avatar: u.avatar_initials || u.name.slice(0, 2).toUpperCase(),
      });
      setCurrentPassword("");
      setNewPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Ошибка сохранения. Попробуй ещё раз.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in space-y-4">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="User" size={18} className="text-primary" />Профиль
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${["from-violet-500 to-indigo-600","from-pink-500 to-rose-600","from-cyan-500 to-blue-600"][user.name.charCodeAt(0) % 3]} flex items-center justify-center text-white font-bold text-lg`}>
              {user.avatar}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Отображаемое имя</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">О себе</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Расскажи немного о себе..."
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground resize-none placeholder:text-muted-foreground" rows={3} />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Activity" size={18} className="text-primary" />Статус присутствия
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(["online", "away", "busy", "offline"] as OnlineStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm ${status === s ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[s]}`} />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Кастомный статус</label>
          <input
            value={customStatus}
            onChange={e => setCustomStatus(e.target.value)}
            placeholder="Например: 🎮 Играю в игры"
            className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Lock" size={18} className="text-primary" />Смена пароля
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Текущий пароль</label>
            <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              type="password" placeholder="••••••••"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Новый пароль</label>
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
              type="password" placeholder="Минимум 6 символов"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Bell" size={18} className="text-primary" />Уведомления
        </h3>
        <div className="space-y-3">
          {["Лайки и комментарии", "Новые сообщения", "Запросы в друзья", "Упоминания"].map(item => (
            <div key={item} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{item}</span>
              <button className="w-10 h-6 bg-primary rounded-full relative transition-colors">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <Icon name="CheckCircle" size={16} /> Изменения сохранены
        </div>
      )}

      <button onClick={save} disabled={saving}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all hover:scale-[1.01] disabled:opacity-60 flex items-center justify-center gap-2">
        {saving && <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
        {saving ? "Сохраняю..." : "Сохранить изменения"}
      </button>
    </div>
  );
}

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: "feed", label: "Лента", icon: "Home" },
  { id: "search", label: "Поиск", icon: "Search" },
  { id: "chats", label: "Чаты", icon: "MessageCircle" },
  { id: "friends", label: "Друзья", icon: "Users" },
  { id: "communities", label: "Сообщества", icon: "Globe" },
  { id: "notifications", label: "Уведомления", icon: "Bell" },
  { id: "profile", label: "Профиль", icon: "User" },
  { id: "settings", label: "Настройки", icon: "Settings" },
];

export default function App() {
  const [page, setPage] = useState<Page>("feed");
  const [me, setMe] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved === null ? true : saved === "true";
  });

  const toggleSidebar = () => setSidebarOpen(o => {
    const next = !o;
    localStorage.setItem("sidebarOpen", String(next));
    return next;
  });

  useEffect(() => {
    const saved = localStorage.getItem("nexus_token");
    if (!saved) { setAuthLoading(false); return; }
    apiAuth("me", undefined, saved).then(data => {
      if (data.user) {
        const u = data.user;
        setMe({
          id: u.id, name: u.name, username: u.username,
          avatar: u.avatar_initials || u.name.slice(0, 2).toUpperCase(),
          status: (u.online_status as OnlineStatus) || "online",
          customStatus: u.custom_status || "",
          bio: u.bio || "",
          followers: u.followers_count || 0,
          following: u.following_count || 0,
          posts: u.posts_count || 0,
        });
        setToken(saved);
      }
    }).finally(() => setAuthLoading(false));
  }, []);

  const handleAuth = (user: User, t: string) => {
    localStorage.setItem("nexus_token", t);
    setToken(t);
    setMe(user);
  };

  const handleLogout = async () => {
    if (token) await apiAuth("logout", {}, token);
    localStorage.removeItem("nexus_token");
    setToken(null);
    setMe(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!me) return <AuthScreen onAuth={handleAuth} />;

  const unreadChats = MOCK_CHATS.reduce((s, c) => s + c.unread, 0);
  const unreadNotifs = 2;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} shrink-0 bg-[hsl(225,18%,8%)] border-r border-border flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-xs">Н</span>
            </div>
            <span className="font-black text-lg text-foreground tracking-tight">Нексус</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                page === item.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
              {item.id === "chats" && unreadChats > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadChats}</span>
              )}
              {item.id === "notifications" && unreadNotifs > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadNotifs}</span>
              )}
            </button>
          ))}
        </nav>

        <div
          className="p-3 border-t border-border cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => setPage("profile")}
        >
          <div className="flex items-center gap-3 px-2 py-1">
            <Avatar user={me!} size="sm" showStatus />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{me!.name}</div>
              {me!.customStatus ? (
                <div className="text-xs text-muted-foreground truncate">{me!.customStatus}</div>
              ) : (
                <StatusBadge status={me!.status} />
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); handleLogout(); }}
              title="Выйти"
              className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-muted"
            >
              <Icon name="LogOut" size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted">
              <Icon name={sidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={18} />
            </button>
            <div>
              <h1 className="font-bold text-foreground text-lg">
                {NAV_ITEMS.find(n => n.id === page)?.label}
              </h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("ru", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage("search")} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted">
              <Icon name="Search" size={18} />
            </button>
            <button onClick={() => setPage("notifications")} className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted">
              <Icon name="Bell" size={18} />
              {unreadNotifs > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {page === "feed" && <FeedPage />}
          {page === "profile" && <ProfilePage user={me!} isMe />}
          {page === "chats" && <ChatsPage />}
          {page === "friends" && <FriendsPage />}
          {page === "notifications" && <NotificationsPage />}
          {page === "search" && <SearchPage />}
          {page === "communities" && <CommunitiesPage />}
          {page === "settings" && <SettingsPage user={me!} token={token} setUser={(u) => setMe(u)} />}
        </div>
      </main>
    </div>
  );
}