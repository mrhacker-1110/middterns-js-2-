import { useState, useReducer, useCallback, useMemo, createContext, useContext } from "react";

// ============================================================
// STORE CONTEXT — useDispatch / useSelector
// ============================================================
const StoreContext = createContext(null);
function StoreProvider({ store, children }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
function useDispatch() {
  return useContext(StoreContext).dispatch;
}
function useSelector(selector) {
  const { state } = useContext(StoreContext);
  return useMemo(() => selector(state), [state, selector]);
}

// ============================================================
// MIDDLEWARE
// ============================================================
const loggerMW = (action) => {
  console.group(`%c⚡ ${action.type}`, "color:#818cf8;font-weight:bold");
  console.log("payload:", action.payload);
  console.groupEnd();
};
const authMW = (action, state) => {
  const guarded = ["TOGGLE_LIKE","TOGGLE_FAVORITE","ADD_RATING",
    "ADD_TODO","DELETE_TODO","UPDATE_TODO","TOGGLE_TODO",
    "ADD_TO_CART","REMOVE_FROM_CART","SUBMIT_ORDER","SET_RENTAL_DAYS"];
  if (guarded.includes(action.type) && !state.auth.user)
    return { blocked: true, error: "Войдите в аккаунт" };
  return { blocked: false };
};
const validationMW = (action) => {
  if (action.type === "REGISTER_USER") {
    const { email, password, username } = action.payload;
    if (!email.includes("@"))  return { blocked: true, error: "Некорректный email" };
    if (password.length < 6)   return { blocked: true, error: "Пароль минимум 6 символов" };
    if (username.length < 2)   return { blocked: true, error: "Имя минимум 2 символа" };
  }
  if (action.type === "ADD_RATING") {
    const { rating } = action.payload;
    if (rating < 1 || rating > 5) return { blocked: true, error: "Оценка 1–5" };
  }
  return { blocked: false };
};
function applyMW(action, state, rawDispatch) {
  const v = validationMW(action);
  if (v.blocked) return { error: v.error };
  const a = authMW(action, state);
  if (a.blocked) return { error: a.error };
  loggerMW(action);
  rawDispatch(action);
  return { success: true };
}

// ============================================================
// CONSTANTS
// ============================================================
const TOGGLE_LIKE="TOGGLE_LIKE", TOGGLE_FAVORITE="TOGGLE_FAVORITE",
  ADD_RATING="ADD_RATING", ADD_TO_CART="ADD_TO_CART",
  REMOVE_FROM_CART="REMOVE_FROM_CART", SET_RENTAL_DAYS="SET_RENTAL_DAYS",
  CLEAR_ORDER="CLEAR_ORDER", SET_BOOKING_FIELD="SET_BOOKING_FIELD",
  SUBMIT_ORDER="SUBMIT_ORDER", SET_FILTER="SET_FILTER",
  REGISTER_USER="REGISTER_USER", LOGIN_USER="LOGIN_USER", LOGOUT_USER="LOGOUT_USER",
  ADD_TODO="ADD_TODO", UPDATE_TODO="UPDATE_TODO",
  DELETE_TODO="DELETE_TODO", TOGGLE_TODO="TOGGLE_TODO", SET_TODO_FILTER="SET_TODO_FILTER";

// ============================================================
// INVENTORY DATA
// ============================================================
const INVENTORY = [
  {id:1, name:"PlayStation 5",       category:"console",   pricePerDay:800,  emoji:"🎮", badge:"ХИТ",  color:"#3b82f6", specs:"825GB SSD · DualSense · 4K HDR"},
  {id:2, name:"Xbox Series X",        category:"console",   pricePerDay:750,  emoji:"🕹️", badge:"NEW",  color:"#22c55e", specs:"1TB NVMe · Game Pass · 4K"},
  {id:3, name:"Nintendo Switch OLED", category:"console",   pricePerDay:500,  emoji:"🎯", badge:null,   color:"#ef4444", specs:"7\" OLED · Портативный"},
  {id:4, name:"PlayStation 4 Pro",    category:"console",   pricePerDay:400,  emoji:"🕹️", badge:null,   color:"#6366f1", specs:"1TB · HDR · PS Plus"},
  {id:5, name:"Xbox One S",           category:"console",   pricePerDay:350,  emoji:"🎮", badge:null,   color:"#84cc16", specs:"1TB · 4K UHD · Game Pass"},
  {id:6, name:"Meta Quest 3",         category:"vr",        pricePerDay:1100, emoji:"🥽", badge:"VR",   color:"#a855f7", specs:"Mixed Reality · 4K · 128GB"},
  {id:7, name:"PlayStation VR2",      category:"vr",        pricePerDay:950,  emoji:"👓", badge:"VR",   color:"#06b6d4", specs:"OLED · Eye Tracking · Haptic"},
  {id:8, name:"Meta Quest 2",         category:"vr",        pricePerDay:700,  emoji:"🥽", badge:null,   color:"#8b5cf6", specs:"90Hz · 256GB · 50+ игр"},
  {id:9, name:"DualSense Pack",       category:"accessory", pricePerDay:200,  emoji:"🎲", badge:null,   color:"#f59e0b", specs:"2 геймпада · 5 игр"},
  {id:10,name:"Logitech G29",         category:"accessory", pricePerDay:350,  emoji:"🏎️", badge:null,   color:"#10b981", specs:"Force Feedback · Педали"},
  {id:11,name:"Guitar Hero Pack",     category:"accessory", pricePerDay:300,  emoji:"🎸", badge:null,   color:"#ec4899", specs:"2 гитары · барабаны"},
  {id:12,name:"Xbox + Kinect",        category:"accessory", pricePerDay:400,  emoji:"🕺", badge:"FUN",  color:"#f97316", specs:"Бесконтактное управление"},
  {id:13,name:"God of War Ragnarök",  category:"game",      pricePerDay:150,  emoji:"⚔️", badge:"PS5",  color:"#3b82f6", specs:"Action-RPG · PS5 · 2022"},
  {id:14,name:"Spider-Man 2",         category:"game",      pricePerDay:150,  emoji:"🕷️", badge:"PS5",  color:"#e11d48", specs:"Open World · PS5 · 2023"},
  {id:15,name:"Hogwarts Legacy",      category:"game",      pricePerDay:120,  emoji:"🧙", badge:null,   color:"#f59e0b", specs:"RPG · PS5/Xbox · 2023"},
  {id:16,name:"FIFA 24",              category:"game",      pricePerDay:100,  emoji:"⚽", badge:null,   color:"#22c55e", specs:"Спорт · PS5/Xbox · 2023"},
  {id:17,name:"Mortal Kombat 1",      category:"game",      pricePerDay:120,  emoji:"🥊", badge:null,   color:"#ef4444", specs:"Fighting · PS5/Xbox · 2023"},
  {id:18,name:"Cyberpunk 2077",       category:"game",      pricePerDay:100,  emoji:"🤖", badge:null,   color:"#facc15", specs:"RPG · PS5/Xbox"},
  {id:19,name:"Forza Horizon 5",      category:"game",      pricePerDay:110,  emoji:"🚗", badge:"XBOX", color:"#22c55e", specs:"Racing · Xbox · 4K 60fps"},
  {id:20,name:"Elden Ring",           category:"game",      pricePerDay:120,  emoji:"💀", badge:null,   color:"#d97706", specs:"Souls-like · PS5/Xbox · 2022"},
];

const getTodayStr = () => new Date().toISOString().split("T")[0];

// ============================================================
// INITIAL STATE
// ============================================================
const initialState = {
  auth: { users: [], user: null, error: null },
  inventory: { items: INVENTORY, filter: "all" },
  // ★ Изолированные данные: ключ = userId
  userdata: {
    // likes[userId]     = Set of itemIds
    // favorites[userId] = Set of itemIds
    // ratings[userId]   = { [itemId]: rating }
    // orders[userId]    = []
    // todos[userId]     = []
    likes:     {},
    favorites: {},
    ratings:   {},
    orders:    {},
    todos:     {},
  },
  // Глобальные счётчики лайков (видны всем)
  globalLikes: {},   // { [itemId]: count }
  // Глобальные рейтинги (агрегат для отображения средней оценки)
  globalRatings: {}, // { [itemId]: { total, count } }
  // Текущая корзина и бронирование — только для текущего юзера (сбрасывается при логауте)
  cart:    { items: [] },
  booking: { name: "", phone: "", date: "", success: false },
};

// ============================================================
// REDUCERS
// ============================================================
function authReducer(state, action) {
  switch (action.type) {
    case REGISTER_USER: {
      if (state.users.find(u => u.email === action.payload.email))
        return { ...state, error: "Email уже используется" };
      const u = { ...action.payload, id: "u_" + Date.now(), createdAt: new Date().toLocaleDateString("ru-RU") };
      return { ...state, users: [...state.users, u], user: u, error: null };
    }
    case LOGIN_USER: {
      const u = state.users.find(x => x.email === action.payload.email && x.password === action.payload.password);
      return u ? { ...state, user: u, error: null } : { ...state, error: "Неверный email или пароль" };
    }
    case LOGOUT_USER:
      return { ...state, user: null, error: null };
    default: return state;
  }
}

function userdataReducer(state, action) {
  switch (action.type) {

    // ── LIKE (глобальный счётчик + личная метка) ─────────────
    case TOGGLE_LIKE: {
      const { itemId, userId } = action.payload;
      const userLikes = new Set(state.likes[userId] || []);
      const already = userLikes.has(itemId);
      if (already) userLikes.delete(itemId);
      else          userLikes.add(itemId);
      return { ...state, likes: { ...state.likes, [userId]: [...userLikes] } };
    }

    // ── FAVORITE (личное избранное) ───────────────────────────
    case TOGGLE_FAVORITE: {
      const { itemId, userId } = action.payload;
      const favs = new Set(state.favorites[userId] || []);
      if (favs.has(itemId)) favs.delete(itemId);
      else                   favs.add(itemId);
      return { ...state, favorites: { ...state.favorites, [userId]: [...favs] } };
    }

    // ── RATING (личная оценка) ────────────────────────────────
    case ADD_RATING: {
      const { itemId, userId, rating } = action.payload;
      const userRatings = state.ratings[userId] || {};
      return { ...state, ratings: { ...state.ratings, [userId]: { ...userRatings, [itemId]: rating } } };
    }

    // ── ORDER (личная история заказов) ────────────────────────
    case SUBMIT_ORDER: {
      const { userId, order } = action.payload;
      const prevOrders = state.orders[userId] || [];
      return { ...state, orders: { ...state.orders, [userId]: [order, ...prevOrders] } };
    }

    // ── TODO (личные задачи) ──────────────────────────────────
    case ADD_TODO: {
      const { userId, text, priority } = action.payload;
      const prev = state.todos[userId] || [];
      const newTodo = { id: "t_" + Date.now(), text: text.trim(), completed: false, priority: priority || "medium", createdAt: new Date().toISOString() };
      return { ...state, todos: { ...state.todos, [userId]: [newTodo, ...prev] } };
    }
    case UPDATE_TODO: {
      const { userId, todoId, updates } = action.payload;
      const prev = state.todos[userId] || [];
      return { ...state, todos: { ...state.todos, [userId]: prev.map(t => t.id === todoId ? { ...t, ...updates } : t) } };
    }
    case DELETE_TODO: {
      const { userId, todoId } = action.payload;
      const prev = state.todos[userId] || [];
      return { ...state, todos: { ...state.todos, [userId]: prev.filter(t => t.id !== todoId) } };
    }
    case TOGGLE_TODO: {
      const { userId, todoId } = action.payload;
      const prev = state.todos[userId] || [];
      return { ...state, todos: { ...state.todos, [userId]: prev.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t) } };
    }

    default: return state;
  }
}

function globalLikesReducer(state, action) {
  if (action.type === TOGGLE_LIKE) {
    const { itemId, userId, wasLiked } = action.payload;
    const cur = state[itemId] || 0;
    return { ...state, [itemId]: wasLiked ? Math.max(0, cur - 1) : cur + 1 };
  }
  return state;
}

function globalRatingsReducer(state, action) {
  if (action.type === ADD_RATING) {
    const { itemId, prevRating, rating } = action.payload;
    const cur = state[itemId] || { total: 0, count: 0 };
    if (prevRating) {
      // обновить существующую оценку
      return { ...state, [itemId]: { total: cur.total - prevRating + rating, count: cur.count } };
    } else {
      return { ...state, [itemId]: { total: cur.total + rating, count: cur.count + 1 } };
    }
  }
  return state;
}

function inventoryReducer(state, action) {
  if (action.type === SET_FILTER) return { ...state, filter: action.payload };
  return state;
}

function cartReducer(state, action) {
  switch (action.type) {
    case ADD_TO_CART:
      if (state.items.find(i => i.id === action.payload.id)) return state;
      return { ...state, items: [...state.items, { ...action.payload, days: 1 }] };
    case REMOVE_FROM_CART:
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case SET_RENTAL_DAYS:
      return { ...state, items: state.items.map(i => i.id === action.payload.id ? { ...i, days: Math.max(1, action.payload.days) } : i) };
    case CLEAR_ORDER:
    case LOGOUT_USER:
      return { items: [] };
    default: return state;
  }
}

function bookingReducer(state, action) {
  switch (action.type) {
    case SET_BOOKING_FIELD: return { ...state, [action.payload.field]: action.payload.value };
    case SUBMIT_ORDER:      return { ...state, success: true };
    case CLEAR_ORDER:
    case LOGOUT_USER:       return { name: "", phone: "", date: "", success: false };
    default: return state;
  }
}

function rootReducer(state, action) {
  return {
    auth:          authReducer(state.auth, action),
    inventory:     inventoryReducer(state.inventory, action),
    userdata:      userdataReducer(state.userdata, action),
    globalLikes:   globalLikesReducer(state.globalLikes, action),
    globalRatings: globalRatingsReducer(state.globalRatings, action),
    cart:          cartReducer(state.cart, action),
    booking:       bookingReducer(state.booking, action),
  };
}

// ============================================================
// ACTION CREATORS — теперь все передают userId
// ============================================================
const toggleLike     = (itemId, userId, wasLiked) => ({ type: TOGGLE_LIKE,     payload: { itemId, userId, wasLiked } });
const toggleFavorite = (itemId, userId)           => ({ type: TOGGLE_FAVORITE, payload: { itemId, userId } });
const addRating      = (itemId, userId, rating, prevRating) => ({ type: ADD_RATING, payload: { itemId, userId, rating, prevRating } });
const registerUser   = (u, e, p) => ({ type: REGISTER_USER, payload: { username: u, email: e, password: p } });
const loginUser      = (e, p)    => ({ type: LOGIN_USER,    payload: { email: e, password: p } });
const logoutUser     = ()        => ({ type: LOGOUT_USER });
const addToCart      = i         => ({ type: ADD_TO_CART,   payload: i });
const removeFromCart = id        => ({ type: REMOVE_FROM_CART, payload: id });
const setRentalDays  = (id, d)   => ({ type: SET_RENTAL_DAYS, payload: { id, days: d } });
const clearOrder     = ()        => ({ type: CLEAR_ORDER });
const setBookingField= (f, v)    => ({ type: SET_BOOKING_FIELD, payload: { field: f, value: v } });
const submitOrderAC  = (userId, order) => ({ type: SUBMIT_ORDER, payload: { userId, order } });
const setFilter      = f         => ({ type: SET_FILTER, payload: f });
const addTodo        = (userId, text, priority) => ({ type: ADD_TODO, payload: { userId, text, priority } });
const updateTodo     = (userId, todoId, updates) => ({ type: UPDATE_TODO, payload: { userId, todoId, updates } });
const deleteTodo     = (userId, todoId)          => ({ type: DELETE_TODO, payload: { userId, todoId } });
const toggleTodo     = (userId, todoId)          => ({ type: TOGGLE_TODO, payload: { userId, todoId } });
const setTodoFilter  = f         => ({ type: SET_TODO_FILTER, payload: f });

// ============================================================
// SELECTORS — все учитывают userId
// ============================================================
const sel = {
  user:            s => s.auth.user,
  filtered:        s => s.inventory.filter === "all" ? s.inventory.items : s.inventory.items.filter(i => i.category === s.inventory.filter),
  inCart:          (s, id) => s.cart.items.some(i => i.id === id),
  cartCount:       s => s.cart.items.length,
  cartTotal:       s => s.cart.items.reduce((sum, i) => sum + i.pricePerDay * i.days, 0),
  // ★ Личные данные — изолированы по userId
  isLiked:         (s, itemId, uid) => (s.userdata.likes[uid] || []).includes(itemId),
  isFavorite:      (s, itemId, uid) => (s.userdata.favorites[uid] || []).includes(itemId),
  getUserRating:   (s, itemId, uid) => (s.userdata.ratings[uid] || {})[itemId] || 0,
  getMyFavorites:  (s, uid) => (s.userdata.favorites[uid] || []).map(id => s.inventory.items.find(i => i.id === id)).filter(Boolean),
  getMyOrders:     (s, uid) => s.userdata.orders[uid] || [],
  getMyTodos:      (s, uid) => s.userdata.todos[uid] || [],
  // ★ Глобальные данные (видны всем)
  globalLikeCount: (s, itemId) => s.globalLikes[itemId] || 0,
  getAvgRating:    (s, itemId) => {
    const r = s.globalRatings[itemId];
    if (!r || r.count === 0) return { avg: 0, count: 0 };
    return { avg: +(r.total / r.count).toFixed(1), count: r.count };
  },
  getRanked:       s => [...s.inventory.items]
    .map(item => { const r = s.globalRatings[item.id]; const avg = r && r.count > 0 ? +(r.total / r.count).toFixed(1) : 0; return { ...item, avg, ratingCount: r?.count || 0 }; })
    .filter(i => i.avg > 0).sort((a, b) => b.avg - a.avg || b.ratingCount - a.ratingCount),
  myLikeCount:     (s, uid) => (s.userdata.likes[uid] || []).length,
  myFavCount:      (s, uid) => (s.userdata.favorites[uid] || []).length,
};

// ============================================================
// HELPERS
// ============================================================
const PRIORITY = {
  high:   { label: "🔴 Высокий", color: "#ef4444", bg: "#ef444415" },
  medium: { label: "🟡 Средний", color: "#f59e0b", bg: "#f59e0b15" },
  low:    { label: "🟢 Низкий",  color: "#22c55e", bg: "#22c55e15" },
};
const fmtDate   = iso => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
const fmtDateFull = iso => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const vEmail    = v => !v.trim() ? "Введите email" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Некорректный email" : null;
const vPass     = v => !v ? "Введите пароль" : v.length < 6 ? "Минимум 6 символов" : !/[0-9]/.test(v) ? "Нужны цифры" : null;
const vName2    = v => !v.trim() ? "Введите имя" : v.length < 2 ? "Минимум 2 символа" : null;
const vName     = v => !v.trim() ? "Введите имя" : v.length < 2 ? "Коротко" : !/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(v) ? "Только буквы" : null;
const vPhone    = v => { const d = v.replace(/\D/g, ""); return !v.trim() ? "Введите номер" : d.length < 10 ? "Коротко" : d.length > 13 ? "Длинно" : null; };
const vDate     = v => !v ? "Выберите дату" : v < getTodayStr() ? "Нельзя прошедшую дату" : null;
const formatPhone = raw => {
  const d = raw.replace(/\D/g, "").slice(0, 12);
  if (d.startsWith("996")) { const r = d.slice(3); let o = "+996"; if (r.length > 0) o += " (" + r.slice(0, 3); if (r.length >= 3) o += ") " + r.slice(3, 6); if (r.length >= 6) o += "-" + r.slice(6, 9); if (r.length >= 9) o += "-" + r.slice(9, 11); return o; }
  return raw.length ? "+" + d : "";
};

// ============================================================
// STAR RATING
// ============================================================
function StarRating({ itemId, compact = false }) {
  const dispatch    = useDispatch();
  const user        = useSelector(sel.user);
  const ratingData  = useSelector(s => sel.getAvgRating(s, itemId));
  const userRating  = useSelector(s => sel.getUserRating(s, itemId, user?.id));
  const [hover, setHover] = useState(0);

  const handleRate = star => {
    if (!user) return;
    dispatch(addRating(itemId, user.id, star, userRating || 0));
  };

  const display = hover || userRating;

  if (compact) return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ display: "flex", gap: 1 }}>
        {[1,2,3,4,5].map(s => (
          <button key={s} onClick={() => handleRate(s)}
            onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            style={{ background: "none", border: "none", cursor: user ? "pointer" : "default", padding: 0, fontSize: 13, transition: "transform 0.1s", transform: hover === s ? "scale(1.3)" : "scale(1)" }}>
            <span style={{ color: s <= (display || Math.round(ratingData.avg)) ? "#f59e0b" : "#334155" }}>★</span>
          </button>
        ))}
      </div>
      <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 12 }}>{ratingData.avg > 0 ? ratingData.avg : "—"}</span>
      {ratingData.count > 0 && <span style={{ color: "#475569", fontSize: 10 }}>({ratingData.count})</span>}
    </div>
  );

  return (
    <div style={{ background: "#0f172a", borderRadius: 14, padding: "14px 16px", border: "1px solid #1e293b" }}>
      <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>ОЦЕНКА</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", borderRadius: 10, padding: "6px 12px", minWidth: 52, textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>{ratingData.avg > 0 ? ratingData.avg : "—"}</div>
          <div style={{ color: "#fff9", fontSize: 9 }}>из 5.0</div>
        </div>
        <div>
          <div style={{ display: "flex", gap: 2, marginBottom: 3 }}>
            {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 18, color: s <= Math.round(ratingData.avg) ? "#f59e0b" : "#1e293b" }}>★</span>)}
          </div>
          <div style={{ color: "#475569", fontSize: 11 }}>{ratingData.count} оценок</div>
        </div>
      </div>
      <div style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>
        {user ? (userRating ? `Ваша оценка: ${userRating} ★` : "Поставьте оценку:") : "Войдите чтобы оценить"}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5].map(s => (
          <button key={s} onClick={() => handleRate(s)}
            onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            style={{ flex: 1, padding: "8px 0", background: s <= display ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#1e293b", border: `1px solid ${s <= display ? "#f59e0b44" : "#334155"}`, borderRadius: 9, cursor: user ? "pointer" : "not-allowed", fontWeight: 800, fontSize: 15, color: s <= display ? "#fff" : "#334155", transition: "all 0.15s", transform: hover === s ? "translateY(-2px)" : "translateY(0)" }}>★</button>
        ))}
      </div>
      {userRating > 0 && <div style={{ color: "#22c55e", fontSize: 11, marginTop: 6, textAlign: "center" }}>✓ Вы оценили на {userRating} из 5</div>}
    </div>
  );
}

// ============================================================
// PRODUCT CARD
// ============================================================
function ProductCard({ item }) {
  const dispatch  = useDispatch();
  const user      = useSelector(sel.user);
  const liked     = useSelector(s => sel.isLiked(s, item.id, user?.id));
  const likeCount = useSelector(s => sel.globalLikeCount(s, item.id));
  const isFav     = useSelector(s => sel.isFavorite(s, item.id, user?.id));
  const inCart    = useSelector(s => sel.inCart(s, item.id));
  const rating    = useSelector(s => sel.getAvgRating(s, item.id));
  const [hov, setHov]             = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [likeAnim, setLikeAnim]   = useState(false);
  const [favAnim, setFavAnim]     = useState(false);

  const handleLike = () => {
    if (!user) return;
    dispatch(toggleLike(item.id, user.id, liked));
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 300);
  };
  const handleFav = () => {
    if (!user) return;
    dispatch(toggleFavorite(item.id, user.id));
    setFavAnim(true);
    setTimeout(() => setFavAnim(false), 300);
  };

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: "linear-gradient(145deg,#0f172a,#0a1628)", border: `1px solid ${hov ? item.color + "77" : "#1e293b"}`, borderRadius: 22, overflow: "hidden", display: "flex", flexDirection: "column", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)", transform: hov ? "translateY(-6px)" : "translateY(0)", boxShadow: hov ? `0 24px 48px ${item.color}22` : "0 4px 12px #00000044", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 22, opacity: hov ? 1 : 0, background: `radial-gradient(circle at top right,${item.color}0d,transparent 60%)`, transition: "opacity 0.3s", pointerEvents: "none" }} />

      {/* Top badges + actions */}
      <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
        {item.badge ? <span style={{ background: item.color, color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 20, letterSpacing: 1.5 }}>{item.badge}</span> : <span />}
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={handleLike} style={{ background: liked ? "#ef444422" : "#0f172acc", border: `1px solid ${liked ? "#ef444466" : "#1e293b"}`, borderRadius: 9, width: 30, height: 30, cursor: user ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all 0.2s", transform: likeAnim ? "scale(1.4)" : "scale(1)", backdropFilter: "blur(8px)" }}>
            <span style={{ filter: liked ? "drop-shadow(0 0 5px #ef4444)" : "none" }}>{liked ? "❤️" : "🤍"}</span>
          </button>
          <button onClick={handleFav} style={{ background: isFav ? "#f59e0b22" : "#0f172acc", border: `1px solid ${isFav ? "#f59e0b66" : "#1e293b"}`, borderRadius: 9, width: 30, height: 30, cursor: user ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all 0.2s", transform: favAnim ? "scale(1.4)" : "scale(1)", backdropFilter: "blur(8px)" }}>
            <span style={{ filter: isFav ? "drop-shadow(0 0 5px #f59e0b)" : "none" }}>{isFav ? "⭐" : "☆"}</span>
          </button>
        </div>
      </div>

      <div style={{ padding: "44px 16px 12px" }}>
        <div style={{ fontSize: 38, marginBottom: 8 }}>{item.emoji}</div>
        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{item.name}</div>
        <div style={{ color: "#475569", fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>{item.specs}</div>
        <StarRating itemId={item.id} compact />
        {likeCount > 0 && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 5 }}>❤️ {likeCount} лайков</div>}
        <div style={{ marginTop: 8 }}>
          <span style={{ color: item.color, fontWeight: 900, fontSize: 20 }}>{item.pricePerDay.toLocaleString()}</span>
          <span style={{ color: "#475569", fontSize: 12 }}> сом/день</span>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #1e293b", padding: "0 16px" }}>
        <button onClick={() => setShowRating(r => !r)} style={{ width: "100%", background: "none", border: "none", color: "#64748b", padding: "7px 0", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {showRating ? "▲ Скрыть" : "★ Оценить"}{rating.avg > 0 && ` · ${rating.avg}★`}
        </button>
        {showRating && <div style={{ paddingBottom: 12 }}><StarRating itemId={item.id} /></div>}
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <button onClick={() => !inCart && dispatch(addToCart(item))} style={{ width: "100%", background: inCart ? "#1e293b" : `linear-gradient(135deg,${item.color},${item.color}bb)`, color: inCart ? "#475569" : "#fff", border: "none", borderRadius: 11, padding: "10px 0", fontWeight: 700, fontSize: 12, cursor: inCart ? "not-allowed" : "pointer", boxShadow: inCart ? "none" : `0 4px 14px ${item.color}44` }}>
          {inCart ? "✓ В корзине" : "+ В корзину"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MY ORDERS PAGE — личная история заказов
// ============================================================
function MyOrdersPage() {
  const user   = useSelector(sel.user);
  const orders = useSelector(s => sel.getMyOrders(s, user?.id));

  return (
    <div style={{ padding: "28px 32px 80px", boxSizing: "border-box", width: "100%" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #6366f133", background: "#6366f10a", borderRadius: 100, padding: "5px 16px", color: "#818cf8", fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: 2 }}>📦 МОИ ЗАКАЗЫ</div>
        <h2 style={{ fontSize: "clamp(20px,4vw,34px)", fontWeight: 900, margin: "0 0 4px", color: "#f1f5f9", letterSpacing: -1 }}>История заказов</h2>
        <p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>Только ваши личные заказы — другие пользователи их не видят</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#334155", border: "1px dashed #1e293b", borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📦</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Заказов пока нет</div>
          <div style={{ fontSize: 12 }}>Арендуйте устройство в магазине</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order, idx) => (
            <div key={order.id} style={{ background: "linear-gradient(145deg,#0f172a,#0a1628)", border: "1px solid #1e293b", borderRadius: 18, padding: "18px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#818cf8", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>ЗАКАЗ #{order.id}</div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>📅 {fmtDateFull(order.createdAt)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#4ade80", fontWeight: 900, fontSize: 20 }}>{order.total.toLocaleString()} сом</div>
                  <div style={{ color: "#22c55e", fontSize: 11, background: "#22c55e15", border: "1px solid #22c55e33", borderRadius: 20, padding: "2px 10px", marginTop: 4 }}>✓ Оформлен</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e293b", borderRadius: 10, padding: "8px 12px" }}>
                    <span style={{ color: "#e2e8f0", fontSize: 13 }}>{item.emoji} {item.name}</span>
                    <span style={{ color: "#64748b", fontSize: 12 }}>{item.days} дн. · <span style={{ color: item.color, fontWeight: 700 }}>{(item.pricePerDay * item.days).toLocaleString()} сом</span></span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// FAVORITES PAGE
// ============================================================
function FavoritesPage() {
  const user      = useSelector(sel.user);
  const favorites = useSelector(s => sel.getMyFavorites(s, user?.id));

  return (
    <div style={{ padding: "28px 32px 80px", boxSizing: "border-box", width: "100%" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #f59e0b33", background: "#f59e0b0a", borderRadius: 100, padding: "5px 16px", color: "#f59e0b", fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: 2 }}>⭐ ИЗБРАННОЕ</div>
        <h2 style={{ fontSize: "clamp(20px,4vw,34px)", fontWeight: 900, margin: "0 0 4px", color: "#f1f5f9", letterSpacing: -1 }}>Ваше избранное</h2>
        <p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>{favorites.length} товаров · только видны вам</p>
      </div>
      {favorites.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#334155", border: "1px dashed #1e293b", borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>⭐</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Избранное пусто</div>
          <div style={{ fontSize: 12 }}>Нажмите ☆ на карточке товара</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 14 }}>
          {favorites.map(item => <ProductCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TOP RATED PAGE
// ============================================================
function TopRatedPage() {
  const ranked = useSelector(sel.getRanked);
  const user   = useSelector(sel.user);

  return (
    <div style={{ padding: "28px 32px 80px", boxSizing: "border-box", width: "100%" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #f59e0b33", background: "#f59e0b0a", borderRadius: 100, padding: "5px 16px", color: "#f59e0b", fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: 2 }}>★ ТОП РЕЙТИНГ</div>
        <h2 style={{ fontSize: "clamp(20px,4vw,34px)", fontWeight: 900, margin: "0 0 4px", color: "#f1f5f9", letterSpacing: -1 }}>Лучшие по оценкам</h2>
        <p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>Средняя оценка всех пользователей · {ranked.length} товаров</p>
      </div>
      {ranked.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#334155", border: "1px dashed #1e293b", borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>★</div>
          <div style={{ fontWeight: 700 }}>Ещё никто не оценил товары</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Перейдите в каталог и поставьте оценки!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ranked.map((item, idx) => (
            <div key={item.id} style={{ background: "linear-gradient(145deg,#0f172a,#0a1628)", border: `1px solid ${idx < 3 ? item.color + "44" : "#1e293b"}`, borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: idx === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : idx === 1 ? "linear-gradient(135deg,#94a3b8,#64748b)" : idx === 2 ? "linear-gradient(135deg,#b45309,#92400e)" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: idx < 3 ? 18 : 15, flexShrink: 0, color: "#fff" }}>
                {idx < 3 ? ["🥇","🥈","🥉"][idx] : `#${idx+1}`}
              </div>
              <div style={{ fontSize: 30 }}>{item.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 15, color: s <= Math.round(item.avg) ? "#f59e0b" : "#1e293b" }}>★</span>)}</div>
                  <span style={{ color: "#f59e0b", fontWeight: 900, fontSize: 17 }}>{item.avg}</span>
                  <span style={{ color: "#475569", fontSize: 11 }}>({item.ratingCount} оценок)</span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: item.color, fontWeight: 900, fontSize: 17 }}>{item.pricePerDay.toLocaleString()}</div>
                <div style={{ color: "#475569", fontSize: 11 }}>сом/день</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TODO PAGE
// ============================================================
function TodoPage() {
  const dispatch  = useDispatch();
  const user      = useSelector(sel.user);
  const allTodos  = useSelector(s => sel.getMyTodos(s, user?.id));
  const [filter, setFilter] = useState("all");
  const [newText, setNewText]     = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [editId, setEditId]       = useState(null);
  const [editText, setEditText]   = useState("");

  const todos = filter === "all" ? allTodos : filter === "active" ? allTodos.filter(t => !t.completed) : allTodos.filter(t => t.completed);
  const stats = { total: allTodos.length, active: allTodos.filter(t => !t.completed).length, done: allTodos.filter(t => t.completed).length };

  const handleAdd = () => {
    if (!newText.trim()) return;
    dispatch(addTodo(user.id, newText, newPriority));
    setNewText("");
  };

  return (
    <div style={{ padding: "28px 32px 80px", maxWidth: 860, margin: "0 auto", boxSizing: "border-box", width: "100%" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #6366f133", background: "#6366f10a", borderRadius: 100, padding: "5px 16px", color: "#818cf8", fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: 2 }}>📋 TODO · useDispatch · CRUD</div>
        <h2 style={{ fontSize: "clamp(20px,4vw,34px)", fontWeight: 900, margin: "0 0 4px", letterSpacing: -1, background: "linear-gradient(135deg,#f8fafc,#818cf8,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Мои задачи</h2>
        <p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>Личный список — только вы видите свои задачи</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          {[{l:"Всего",v:stats.total,c:"#818cf8"},{l:"Активных",v:stats.active,c:"#06b6d4"},{l:"Готово",v:stats.done,c:"#22c55e"}].map(s => (
            <div key={s.l} style={{ background: s.c + "15", border: `1px solid ${s.c}33`, borderRadius: 12, padding: "8px 16px", textAlign: "center" }}>
              <div style={{ color: s.c, fontWeight: 900, fontSize: 20 }}>{s.v}</div>
              <div style={{ color: "#64748b", fontSize: 11 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE */}
      <div style={{ background: "linear-gradient(145deg,#080f20,#060c18)", border: "1px solid #1e293b", borderRadius: 18, padding: 20, marginBottom: 18 }}>
        <div style={{ color: "#22c55e", fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 10 }}>ADD_TODO → dispatch(addTodo(userId, text))</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Новая задача..."
            style={{ flex: 1, background: "#0f172a", border: "1px solid #2d3f55", color: "#f1f5f9", borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none" }} />
          <button onClick={handleAdd} style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Добавить</button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(PRIORITY).map(([k, v]) => (
            <button key={k} onClick={() => setNewPriority(k)}
              style={{ flex: 1, padding: "7px 0", background: newPriority === k ? v.bg : "#0f172a", border: `1.5px solid ${newPriority === k ? v.color : "#1e293b"}`, borderRadius: 8, color: newPriority === k ? v.color : "#475569", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER */}
      <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        {[["all",`Все (${stats.total})`],["active",`Активные (${stats.active})`],["done",`Готово (${stats.done})`]].map(([f, l]) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "7px 16px", background: filter === f ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "#0f172a", color: filter === f ? "#fff" : "#64748b", border: `1px solid ${filter === f ? "transparent" : "#1e293b"}`, borderRadius: 100, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            {l}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {todos.length === 0 && (
          <div style={{ textAlign: "center", padding: "36px 0", color: "#334155", border: "1px dashed #1e293b", borderRadius: 14 }}>
            <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 8 }}>📋</div>
            <div>Нет задач в этой категории</div>
          </div>
        )}
        {todos.map(todo => {
          const p = PRIORITY[todo.priority];
          const isEdit = editId === todo.id;
          return (
            <div key={todo.id} style={{ background: "linear-gradient(145deg,#0f172a,#0a1628)", border: `1px solid ${todo.completed ? "#1e293b" : p.color + "33"}`, borderRadius: 13, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, opacity: todo.completed ? 0.7 : 1 }}>
              <button onClick={() => dispatch(toggleTodo(user.id, todo.id))}
                style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${todo.completed ? "#22c55e" : p.color}`, background: todo.completed ? "#22c55e" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                {todo.completed && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEdit ? (
                  <div style={{ display: "flex", gap: 7 }}>
                    <input value={editText} onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { dispatch(updateTodo(user.id, todo.id, { text: editText })); setEditId(null); } if (e.key === "Escape") setEditId(null); }}
                      autoFocus style={{ flex: 1, background: "#1e293b", border: "1px solid #6366f1", color: "#f1f5f9", borderRadius: 7, padding: "5px 9px", fontSize: 12, outline: "none" }} />
                    <button onClick={() => { dispatch(updateTodo(user.id, todo.id, { text: editText })); setEditId(null); }} style={{ background: "#22c55e22", border: "1px solid #22c55e44", color: "#22c55e", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>✓</button>
                  </div>
                ) : (
                  <span style={{ color: todo.completed ? "#475569" : "#f1f5f9", fontSize: 13, textDecoration: todo.completed ? "line-through" : "none" }}>{todo.text}</span>
                )}
                <div style={{ display: "flex", gap: 7, marginTop: 3 }}>
                  <span style={{ background: p.bg, color: p.color, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>{p.label}</span>
                  <span style={{ color: "#334155", fontSize: 9 }}>{fmtDate(todo.createdAt)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => { setEditId(todo.id); setEditText(todo.text); }} style={{ background: "#f59e0b18", border: "1px solid #f59e0b33", color: "#f59e0b", borderRadius: 7, width: 27, height: 27, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
                <button onClick={() => dispatch(deleteTodo(user.id, todo.id))} style={{ background: "#ef444418", border: "1px solid #ef444433", color: "#f87171", borderRadius: 7, width: 27, height: 27, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CART PANEL
// ============================================================
function CartPanel() {
  const dispatch  = useDispatch();
  const user      = useSelector(sel.user);
  const state     = useSelector(s => s);
  const cartItems = useSelector(s => s.cart.items);
  const cartTotal = useSelector(sel.cartTotal);
  const { name, phone, date, success } = state.booking;
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const touch = f => setTouched(p => ({ ...p, [f]: true }));
  const liveErr = { name: touched.name ? vName(name) : null, phone: touched.phone ? vPhone(phone) : null, date: touched.date ? vDate(date) : null };
  const iStyle = f => ({ width: "100%", boxSizing: "border-box", background: liveErr[f] ? "#1a0808" : touched[f] && !liveErr[f] ? "#081a0f" : "#0f172a", border: `1.5px solid ${liveErr[f] ? "#f87171" : touched[f] && !liveErr[f] ? "#22c55e" : "#2d3f55"}`, color: "#f1f5f9", borderRadius: 12, padding: "11px 13px 11px 38px", fontSize: 13, outline: "none", colorScheme: "dark", transition: "all 0.2s" });

  const handleBook = () => {
    setTouched({ name: true, phone: true, date: true });
    const e = { name: vName(name), phone: vPhone(phone), date: vDate(date), cart: cartItems.length === 0 ? "Корзина пуста" : null };
    setErrors(e);
    if (Object.values(e).every(v => !v)) {
      const order = {
        id: "ord_" + Date.now(),
        items: cartItems.map(i => ({ ...i })),
        total: cartTotal,
        name, date,
        createdAt: new Date().toISOString(),
      };
      dispatch(submitOrderAC(user.id, order));
    }
  };

  if (success) return (
    <div style={{ textAlign: "center", padding: "28px 0" }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
      <div style={{ color: "#4ade80", fontWeight: 900, fontSize: 20, marginBottom: 10 }}>Заказ оформлен!</div>
      <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 2.2, marginBottom: 20, background: "#0f172a", borderRadius: 14, padding: "14px 18px", border: "1px solid #1e293b" }}>
        👤 <b style={{ color: "#f1f5f9" }}>{name}</b><br />
        📅 <b style={{ color: "#f1f5f9" }}>{fmtDateFull(date + "T00:00:00")}</b><br />
        💰 <b style={{ color: "#4ade80", fontSize: 18 }}>{cartTotal.toLocaleString()} сом</b>
      </div>
      <button onClick={() => dispatch(clearOrder())} style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 26px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>← Новый заказ</button>
    </div>
  );

  return (
    <>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        🛒 Корзина
        <span style={{ background: cartItems.length ? "#6366f122" : "#1e293b", color: cartItems.length ? "#818cf8" : "#475569", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>{cartItems.length} шт.</span>
      </div>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: "center", color: "#334155", padding: "24px 0", lineHeight: 2.5, border: "1px dashed #1e293b", borderRadius: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 4 }}>🎮</div>
          <div style={{ fontSize: 12 }}>Корзина пуста</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12, maxHeight: 220, overflowY: "auto" }}>
          {cartItems.map(item => (
            <div key={item.id} style={{ background: "linear-gradient(135deg,#1e293b,#162032)", borderRadius: 12, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 7, border: "1px solid #2d3f55" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>{item.emoji} {item.name}</span>
                <button onClick={() => dispatch(removeFromCart(item.id))} style={{ background: "#334155", border: "none", color: "#94a3b8", cursor: "pointer", width: 24, height: 24, borderRadius: 6, fontSize: 12 }}>✕</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: "#64748b", fontSize: 11 }}>Дней:</span>
                <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#0f172a", borderRadius: 7, padding: "2px 5px" }}>
                  <button onClick={() => dispatch(setRentalDays(item.id, item.days - 1))} style={{ background: "#334155", border: "none", color: "#fff", width: 24, height: 24, borderRadius: 5, cursor: "pointer", fontWeight: 900 }}>−</button>
                  <span style={{ color: "#fff", fontWeight: 800, minWidth: 22, textAlign: "center", fontSize: 13 }}>{item.days}</span>
                  <button onClick={() => dispatch(setRentalDays(item.id, item.days + 1))} style={{ background: "#334155", border: "none", color: "#fff", width: 24, height: 24, borderRadius: 5, cursor: "pointer", fontWeight: 900 }}>+</button>
                </div>
                <span style={{ marginLeft: "auto", color: item.color, fontWeight: 800, fontSize: 13 }}>{(item.pricePerDay * item.days).toLocaleString()} сом</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {errors.cart && <div style={{ color: "#f87171", fontSize: 11, marginBottom: 8, background: "#f8717110", border: "1px solid #f8717133", borderRadius: 8, padding: "8px 12px" }}>⚠️ {errors.cart}</div>}

      {cartItems.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#6366f110", border: "1px solid #6366f122", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 13 }}>Итого:</span>
          <span style={{ color: "#818cf8", fontWeight: 900, fontSize: 22 }}>{cartTotal.toLocaleString()} сом</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
          <span style={{ color: "#6366f1", fontSize: 9, fontWeight: 800, letterSpacing: 2, whiteSpace: "nowrap" }}>БРОНИРОВАНИЕ</span>
          <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
        </div>
        {[
          { f: "name",  icon: "👤", ph: "Ваше имя",           t: "text", ch: e => dispatch(setBookingField("name",  e.target.value.replace(/[^а-яёА-ЯЁa-zA-Z\s-]/g, ""))) },
          { f: "phone", icon: "📱", ph: "+996 (700) 000-000",  t: "tel",  ch: e => dispatch(setBookingField("phone", formatPhone(e.target.value))) },
          { f: "date",  icon: "📅", ph: "",                    t: "date", ch: e => { dispatch(setBookingField("date", e.target.value)); touch("date"); }, min: getTodayStr() },
        ].map(({ f, icon, ph, t, ch, min }) => (
          <div key={f}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, zIndex: 1 }}>{icon}</span>
              <input type={t} placeholder={ph} value={state.booking[f]} onChange={ch} onBlur={() => touch(f)} min={min} style={iStyle(f)} />
              {touched[f] && !liveErr[f] && state.booking[f] && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#22c55e", fontSize: 14 }}>✓</span>}
            </div>
            {liveErr[f] && <div style={{ color: "#f87171", fontSize: 10, marginTop: 3 }}>⚠ {liveErr[f]}</div>}
            {f === "date" && !liveErr[f] && touched[f] && state.booking[f] && (
              <div style={{ color: "#22c55e", fontSize: 10, marginTop: 3 }}>✓ {new Date(state.booking[f]).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</div>
            )}
          </div>
        ))}
        <button onClick={handleBook}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          style={{ marginTop: 4, background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 20px #6366f155", transition: "all 0.2s" }}>
          🚀 Забронировать
        </button>
      </div>
    </>
  );
}

// ============================================================
// DEVTOOLS
// ============================================================
function DevTools() {
  const [open, setOpen] = useState(false);
  const user    = useSelector(sel.user);
  const state   = useSelector(s => s);
  const myLikes = useSelector(s => sel.myLikeCount(s, user?.id));
  const myFavs  = useSelector(s => sel.myFavCount(s, user?.id));

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", border: "none", borderRadius: 12, padding: "9px 16px", cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "monospace", boxShadow: "0 4px 20px #7c3aed55", whiteSpace: "nowrap" }}>
        ⚡ Redux DevTools
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: 48, right: 0, width: 360, background: "#0d0d1a", border: "1px solid #7c3aed55", borderRadius: 16, padding: 16, maxHeight: 460, overflowY: "auto", boxShadow: "0 20px 60px #00000099", fontFamily: "monospace" }}>
          <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>⚡ Global State (изолированные данные)</div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: "8px 10px", fontSize: 10, lineHeight: 2, marginBottom: 10 }}>
            <span style={{ color: "#4ade80" }}>validationMW</span> → <span style={{ color: "#f59e0b" }}>authMW</span> → <span style={{ color: "#818cf8" }}>loggerMW</span> → <span style={{ color: "#f1f5f9" }}>rootReducer</span>
          </div>
          <pre style={{ margin: 0, fontSize: 10, color: "#e2e8f0", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
{JSON.stringify({
  "auth.user":        user?.username || null,
  "myData.likes":     myLikes,
  "myData.favorites": myFavs,
  "myData.orders":    (state.userdata.orders[user?.id] || []).length,
  "myData.todos":     (state.userdata.todos[user?.id] || []).length,
  "globalLikes":      Object.values(state.globalLikes).reduce((s, v) => s + v, 0),
  "globalRatings":    Object.entries(state.globalRatings).map(([id, r]) => ({ id: +id, avg: +(r.total / r.count).toFixed(1), votes: r.count })),
  "cart.count":       state.cart.items.length,
}, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// AUTH PAGE
// ============================================================
function AuthPage() {
  const dispatch = useDispatch();
  const state    = useSelector(s => s);
  const [mode, setMode]     = useState("login");
  const [form, setForm]     = useState({ username: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState({});
  const [authError, setAuthError] = useState("");
  const set   = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const touch = f => setTouched(p => ({ ...p, [f]: true }));
  const errors = {
    username: touched.username ? vName2(form.username) : null,
    email:    touched.email    ? vEmail(form.email)    : null,
    password: touched.password ? vPass(form.password)  : null,
    confirm:  touched.confirm  ? (form.confirm !== form.password ? "Пароли не совпадают" : null) : null,
  };

  const handleSubmit = () => {
    setAuthError("");
    if (mode === "register") {
      setTouched({ username: true, email: true, password: true, confirm: true });
      if (Object.values(errors).some(Boolean) || !form.username || !form.email || !form.password || form.password !== form.confirm) return;
      const r = applyMW(registerUser(form.username, form.email, form.password), state, dispatch);
      if (r?.error) setAuthError(r.error);
    } else {
      setTouched({ email: true, password: true });
      if (!form.email || !form.password) return;
      dispatch(loginUser(form.email, form.password));
      setTimeout(() => {
        const newState = useSelector(s => s);
        if (!state.auth.user) setAuthError("Неверный email или пароль");
      }, 50);
    }
  };

  const iStyle = f => ({ width: "100%", boxSizing: "border-box", background: errors[f] ? "#1a0808" : "#0f172a", border: `1.5px solid ${errors[f] ? "#f87171" : "#2d3f55"}`, color: "#f1f5f9", borderRadius: 12, padding: "11px 13px 11px 38px", fontSize: 13, outline: "none", colorScheme: "dark" });

  return (
    <div style={{ background: "#020617", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "fixed", top: "20%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "#6366f108", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "20%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "#a855f708", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 420, background: "linear-gradient(145deg,#080f20,#060c18)", border: "1px solid #1e293b", borderRadius: 28, padding: "36px 32px", boxShadow: "0 24px 80px #00000088", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", borderRadius: 14, padding: "10px 14px", fontWeight: 900, fontSize: 20, boxShadow: "0 4px 16px #6366f155" }}>GR</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#f1f5f9" }}>GameRent Hub</div>
              <div style={{ color: "#475569", fontSize: 11 }}>Бишкек 🇰🇬</div>
            </div>
          </div>
          <div style={{ color: "#64748b", fontSize: 13 }}>{mode === "login" ? "Войдите — лайки и заказы только ваши" : "Создайте личный аккаунт"}</div>
        </div>

        <div style={{ display: "flex", background: "#0f172a", borderRadius: 12, padding: 4, marginBottom: 24, border: "1px solid #1e293b" }}>
          {[["login", "🔑 Вход"], ["register", "📝 Регистрация"]].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setAuthError(""); setTouched({}); }}
              style={{ flex: 1, padding: "9px 0", background: mode === m ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "none", color: mode === m ? "#fff" : "#64748b", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>👤</span>
                <input type="text" placeholder="Имя пользователя" value={form.username} onChange={e => set("username", e.target.value)} onBlur={() => touch("username")} style={iStyle("username")} />
              </div>
              {errors.username && <div style={{ color: "#f87171", fontSize: 11, marginTop: 3 }}>⚠ {errors.username}</div>}
            </div>
          )}
          <div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>📧</span>
              <input type="email" placeholder="Email" value={form.email} onChange={e => set("email", e.target.value)} onBlur={() => touch("email")} style={iStyle("email")} />
            </div>
            {errors.email && <div style={{ color: "#f87171", fontSize: 11, marginTop: 3 }}>⚠ {errors.email}</div>}
          </div>
          <div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔒</span>
              <input type="password" placeholder="Пароль" value={form.password} onChange={e => set("password", e.target.value)} onBlur={() => touch("password")} style={iStyle("password")} />
            </div>
            {errors.password && <div style={{ color: "#f87171", fontSize: 11, marginTop: 3 }}>⚠ {errors.password}</div>}
          </div>
          {mode === "register" && (
            <div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔐</span>
                <input type="password" placeholder="Повторите пароль" value={form.confirm} onChange={e => set("confirm", e.target.value)} onBlur={() => touch("confirm")} style={iStyle("confirm")} />
              </div>
              {errors.confirm && <div style={{ color: "#f87171", fontSize: 11, marginTop: 3 }}>⚠ {errors.confirm}</div>}
            </div>
          )}
          {(authError || state.auth.error) && (
            <div style={{ background: "#f8717115", border: "1px solid #f8717144", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 12 }}>
              🔒 {authError || state.auth.error}
            </div>
          )}
          <button onClick={handleSubmit}
            style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px #6366f155", marginTop: 4 }}>
            {mode === "login" ? "🚀 Войти" : "✨ Создать аккаунт"}
          </button>
          {mode === "login" && state.auth.users.length > 0 && (
            <div style={{ background: "#6366f110", border: "1px solid #6366f133", borderRadius: 10, padding: "8px 12px", fontSize: 11, color: "#818cf8" }}>
              💡 Аккаунты: {state.auth.users.map(u => u.email).join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
function AppInner() {
  const dispatch  = useDispatch();
  const user      = useSelector(sel.user);
  const filtered  = useSelector(sel.filtered);
  const cartCount = useSelector(sel.cartCount);
  const state     = useSelector(s => s);
  const myLikes   = useSelector(s => sel.myLikeCount(s, user?.id));
  const myFavs    = useSelector(s => sel.myFavCount(s, user?.id));
  const myOrders  = useSelector(s => sel.getMyOrders(s, user?.id));
  const myTodos   = useSelector(s => sel.getMyTodos(s, user?.id));
  const [page, setPage] = useState("shop");

  if (!user) return <AuthPage />;

  const activeCount = myTodos.filter(t => !t.completed).length;

  const FILTERS = [
    { key: "all",       label: "🌐 Все" },
    { key: "console",   label: "🎮 Консоли" },
    { key: "vr",        label: "🥽 VR" },
    { key: "game",      label: "💿 Игры" },
    { key: "accessory", label: "🎲 Акс." },
  ];

  const PAGES = [
    { key: "shop",   label: "🛍 Магазин" },
    { key: "favs",   label: myFavs > 0 ? `⭐ Избранное (${myFavs})` : "⭐ Избранное" },
    { key: "top",    label: "★ Топ оценок" },
    { key: "orders", label: myOrders.length > 0 ? `📦 Заказы (${myOrders.length})` : "📦 Заказы" },
    { key: "todos",  label: activeCount > 0 ? `📋 Todo (${activeCount})` : "📋 Todo" },
  ];

  return (
    <div style={{ minHeight: "100vh", width: "100vw", maxWidth: "100vw", background: "#020617", color: "#fff", fontFamily: "'Segoe UI',system-ui,sans-serif", overflowX: "hidden", display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
      <header style={{ width: "100%", background: "rgba(2,6,23,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid #1e293b", padding: "0 24px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxSizing: "border-box", gap: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", borderRadius: 10, padding: "7px 11px", fontWeight: 900, fontSize: 14 }}>GR</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.5 }}>GameRent Hub</div>
            <div style={{ color: "#475569", fontSize: 10 }}>Бишкек 🇰🇬</div>
          </div>
        </div>

        {/* NAV — горизонтально, всегда видно */}
        <nav style={{ display: "flex", gap: 3, background: "#0f172a", borderRadius: 10, padding: 3, border: "1px solid #1e293b", overflowX: "auto", flexShrink: 1 }}>
          {PAGES.map(p => (
            <button key={p.key} onClick={() => setPage(p.key)}
              style={{ padding: "7px 12px", background: page === p.key ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "none", color: page === p.key ? "#fff" : "#64748b", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0 }}>
              {p.label}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <span style={{ background: "#ef444415", border: "1px solid #ef444433", borderRadius: 8, padding: "4px 9px", fontSize: 11, color: "#f87171", fontWeight: 700 }}>❤️ {myLikes}</span>
            <span style={{ background: "#f59e0b15", border: "1px solid #f59e0b33", borderRadius: 8, padding: "4px 9px", fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>⭐ {myFavs}</span>
          </div>
          <div style={{ background: cartCount ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "#1e293b", color: cartCount ? "#fff" : "#475569", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, transition: "all 0.3s" }}>🛒 {cartCount}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "5px 10px" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{user.username[0].toUpperCase()}</div>
            <span style={{ color: "#f1f5f9", fontSize: 11, fontWeight: 600 }}>{user.username}</span>
          </div>
          <button onClick={() => dispatch(logoutUser())} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "6px 10px", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>→</button>
        </div>
      </header>

      {/* PAGE CONTENT — flex: 1 чтобы занимало всё оставшееся место */}
      <main style={{ flex: 1, width: "100%", boxSizing: "border-box" }}>

        {page === "favs"   && <FavoritesPage />}
        {page === "top"    && <TopRatedPage />}
        {page === "todos"  && <TodoPage />}
        {page === "orders" && <MyOrdersPage />}

        {page === "shop" && (
          <>
            {/* HERO */}
            <div style={{ width: "100%", padding: "48px 24px 32px", textAlign: "center", background: "radial-gradient(ellipse 100% 60% at 50% 0%,#6366f10e,transparent 70%)", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -80, left: "10%", width: 400, height: 400, borderRadius: "50%", background: "#6366f108", filter: "blur(80px)", pointerEvents: "none" }} />
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #6366f133", background: "#6366f10a", borderRadius: 100, padding: "5px 18px", color: "#818cf8", fontSize: 11, fontWeight: 700, marginBottom: 18, letterSpacing: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px #4ade80" }} />
                Привет, {user.username}! Лайкай, оценивай, арендуй 🎮
              </div>
              <h1 style={{ fontSize: "clamp(26px,5vw,52px)", fontWeight: 900, margin: "0 0 12px", background: "linear-gradient(135deg,#f8fafc 0%,#818cf8 55%,#3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -3, lineHeight: 1.05 }}>
                Арендуй топовые<br />игровые устройства
              </h1>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>от <strong style={{ color: "#818cf8" }}>100 сом/день</strong> · Доставка по Бишкеку</p>
            </div>

            {/* FILTERS */}
            <div style={{ display: "flex", gap: 7, justifyContent: "center", padding: "0 24px 20px", flexWrap: "wrap", boxSizing: "border-box" }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => dispatch(setFilter(f.key))}
                  style={{ background: state.inventory.filter === f.key ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "#0f172a", color: state.inventory.filter === f.key ? "#fff" : "#64748b", border: `1px solid ${state.inventory.filter === f.key ? "transparent" : "#1e293b"}`, borderRadius: 100, padding: "7px 18px", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* ★ MAIN GRID — растягиваем на весь экран */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, padding: "0 24px 40px", width: "100%", boxSizing: "border-box", alignItems: "start" }}>

              {/* Каталог — auto-fill заполняет всё пространство */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, width: "100%" }}>
                {filtered.map(item => <ProductCard key={item.id} item={item} />)}
              </div>

              {/* Корзина — sticky */}
              <div style={{ background: "linear-gradient(145deg,#080f20,#060c18)", border: "1px solid #1e293b", borderRadius: 22, padding: 22, position: "sticky", top: 74, boxShadow: "0 8px 48px #00000066", maxHeight: "calc(100vh - 90px)", overflowY: "auto" }}>
                <CartPanel />
              </div>
            </div>
          </>
        )}
      </main>

      {/* FOOTER — компактный, не перекрывает DevTools */}
      <footer style={{ borderTop: "1px solid #0f172a", padding: "16px 24px", boxSizing: "border-box", background: "#020617", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, paddingRight: 160 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", borderRadius: 8, padding: "5px 9px", fontWeight: 900, fontSize: 12 }}>GR</div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>GameRent Hub</div>
              <div style={{ color: "#334155", fontSize: 10 }}>Бишкек, Кыргызстан 🇰🇬</div>
            </div>
          </div>
          <code style={{ color: "#475569", fontSize: 9, background: "#0f172a", padding: "6px 12px", borderRadius: 8, border: "1px solid #1e293b" }}>
            useDispatch() → <span style={{ color: "#4ade80" }}>TOGGLE_LIKE</span> | <span style={{ color: "#f59e0b" }}>TOGGLE_FAVORITE</span> | <span style={{ color: "#818cf8" }}>ADD_RATING</span>
          </code>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 12 }}>Mbank · Optima · Наличные</div>
            <div style={{ color: "#334155", fontSize: 10 }}>+996 (700) 000-000</div>
          </div>
        </div>
      </footer>

      <DevTools />
    </div>
  );
}

// ============================================================
// ROOT
// ============================================================
export default function App() {
  const [state, rawDispatch] = useReducer(rootReducer, initialState);
  const store = useMemo(() => ({
    state,
    dispatch: (action) => applyMW(action, state, rawDispatch),
  }), [state]);

  return (
    <StoreProvider store={store}>
      <AppInner />
    </StoreProvider>
  );
}