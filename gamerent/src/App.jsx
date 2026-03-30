import { useState, useReducer } from "react";

// ============================================================
// MIDDLEWARE SYSTEM
// ============================================================
const loggerMiddleware = (action, prevState, nextState) => {
  console.group(`%c ACTION: ${action.type}`, "color:#818cf8;font-weight:bold");
  console.log("Payload:", action.payload);
  console.log("Prev State:", prevState);
  console.log("Next State:", nextState);
  console.groupEnd();
};

const authMiddleware = (action, state) => {
  const protectedActions = [ADD_TO_CART, REMOVE_FROM_CART, SUBMIT_ORDER];
  if (protectedActions.includes(action.type) && !state.auth.user) {
    console.warn("🔒 authMiddleware: Доступ запрещён — пользователь не авторизован");
    return false;
  }
  return true;
};

const validationMiddleware = (action) => {
  if (action.type === REGISTER_USER) {
    const { email, password, username } = action.payload;
    if (!email.includes("@")) return { blocked: true, error: "Некорректный email" };
    if (password.length < 6)   return { blocked: true, error: "Пароль минимум 6 символов" };
    if (username.length < 2)   return { blocked: true, error: "Имя минимум 2 символа" };
  }
  if (action.type === LOGIN_USER) {
    const { email, password } = action.payload;
    if (!email || !password) return { blocked: true, error: "Заполните все поля" };
  }
  return { blocked: false };
};

// applyMiddleware — оборачивает dispatch
function applyMiddleware(dispatch, getState) {
  return function enhancedDispatch(action) {
    // 1. validationMiddleware
    const validation = validationMiddleware(action);
    if (validation.blocked) {
      return { error: validation.error };
    }
    // 2. authMiddleware
    const allowed = authMiddleware(action, getState());
    if (!allowed) return { error: "Требуется авторизация" };
    // 3. dispatch
    const prevState = getState();
    dispatch(action);
    // 4. loggerMiddleware (после dispatch)
    loggerMiddleware(action, prevState, getState());
    return { success: true };
  };
}

// ============================================================
// CONSTANTS
// ============================================================
const ADD_TO_CART     = "ADD_TO_CART";
const REMOVE_FROM_CART = "REMOVE_FROM_CART";
const SET_RENTAL_DAYS = "SET_RENTAL_DAYS";
const CLEAR_ORDER     = "CLEAR_ORDER";
const SET_BOOKING_FIELD = "SET_BOOKING_FIELD";
const SUBMIT_ORDER    = "SUBMIT_ORDER";
const SET_FILTER      = "SET_FILTER";
const REGISTER_USER   = "REGISTER_USER";
const LOGIN_USER      = "LOGIN_USER";
const LOGOUT_USER     = "LOGOUT_USER";

// ============================================================
// INVENTORY
// ============================================================
const INVENTORY = [
  { id:1,  name:"PlayStation 5",       category:"console",   pricePerDay:800,  emoji:"🎮", badge:"ХИТ", color:"#3b82f6", specs:"825GB SSD · DualSense · 4K HDR" },
  { id:2,  name:"Xbox Series X",        category:"console",   pricePerDay:750,  emoji:"🕹️", badge:"NEW", color:"#22c55e", specs:"1TB NVMe · Game Pass · 4K" },
  { id:3,  name:"Nintendo Switch OLED", category:"console",   pricePerDay:500,  emoji:"🎯", badge:null,  color:"#ef4444", specs:"7\" OLED · Портативный · Joy-Con" },
  { id:4,  name:"PlayStation 4 Pro",    category:"console",   pricePerDay:400,  emoji:"🕹️", badge:null,  color:"#6366f1", specs:"1TB · HDR · PS Plus включён" },
  { id:5,  name:"Xbox One S",           category:"console",   pricePerDay:350,  emoji:"🎮", badge:null,  color:"#84cc16", specs:"1TB · 4K UHD · Game Pass 1 мес" },
  { id:6,  name:"Meta Quest 3",         category:"vr",        pricePerDay:1100, emoji:"🥽", badge:"VR",  color:"#a855f7", specs:"Mixed Reality · 4K · 128GB" },
  { id:7,  name:"PlayStation VR2",      category:"vr",        pricePerDay:950,  emoji:"👓", badge:"VR",  color:"#06b6d4", specs:"OLED · Eye Tracking · Haptic" },
  { id:8,  name:"Meta Quest 2",         category:"vr",        pricePerDay:700,  emoji:"🥽", badge:null,  color:"#8b5cf6", specs:"90Hz · 256GB · 50+ игр" },
  { id:9,  name:"DualSense Pack",       category:"accessory", pricePerDay:200,  emoji:"🎲", badge:null,  color:"#f59e0b", specs:"2 геймпада · 5 игр" },
  { id:10, name:"Logitech G29",         category:"accessory", pricePerDay:350,  emoji:"🏎️", badge:null,  color:"#10b981", specs:"Force Feedback · Педали" },
  { id:11, name:"Xbox + Kinect",        category:"accessory", pricePerDay:400,  emoji:"🕺", badge:"FUN", color:"#f97316", specs:"Бесконтактное управление" },
  { id:12, name:"Guitar Hero Pack",     category:"accessory", pricePerDay:300,  emoji:"🎸", badge:null,  color:"#ec4899", specs:"2 гитары · барабаны · 100 треков" },
  { id:13, name:"God of War Ragnarök",  category:"game",      pricePerDay:150,  emoji:"⚔️", badge:"PS5", color:"#3b82f6", specs:"Action-RPG · PS5 · 2022" },
  { id:14, name:"Spider-Man 2",         category:"game",      pricePerDay:150,  emoji:"🕷️", badge:"PS5", color:"#e11d48", specs:"Open World · PS5 · 2023" },
  { id:15, name:"Hogwarts Legacy",      category:"game",      pricePerDay:120,  emoji:"🧙", badge:null,  color:"#f59e0b", specs:"RPG · PS5/Xbox · 2023" },
  { id:16, name:"FIFA 24",              category:"game",      pricePerDay:100,  emoji:"⚽", badge:null,  color:"#22c55e", specs:"Спорт · PS5/Xbox · 2023" },
  { id:17, name:"Mortal Kombat 1",      category:"game",      pricePerDay:120,  emoji:"🥊", badge:null,  color:"#ef4444", specs:"Fighting · PS5/Xbox · 2023" },
  { id:18, name:"Cyberpunk 2077",       category:"game",      pricePerDay:100,  emoji:"🤖", badge:null,  color:"#facc15", specs:"RPG · PS5/Xbox · Phantom Liberty" },
  { id:19, name:"Forza Horizon 5",      category:"game",      pricePerDay:110,  emoji:"🚗", badge:"XBOX",color:"#22c55e", specs:"Racing · Xbox · 4K 60fps" },
  { id:20, name:"Elden Ring",           category:"game",      pricePerDay:120,  emoji:"💀", badge:null,  color:"#d97706", specs:"Souls-like · PS5/Xbox · 2022" },
];

const getTodayStr = () => new Date().toISOString().split("T")[0];

// ============================================================
// INITIAL STATE — добавлен auth
// ============================================================
const initialState = {
  auth:      { users: [], user: null, error: null },
  inventory: { items: INVENTORY, filter: "all" },
  cart:      { items: [] },
  booking:   { name: "", phone: "", date: "", success: false },
};

// ============================================================
// REDUCERS
// ============================================================
function authReducer(state, action) {
  switch (action.type) {
    case REGISTER_USER: {
      const exists = state.users.find(u => u.email === action.payload.email);
      if (exists) return { ...state, error: "Пользователь с таким email уже существует" };
      const newUser = { ...action.payload, id: Date.now(), createdAt: new Date().toLocaleDateString("ru-RU") };
      return { ...state, users: [...state.users, newUser], user: newUser, error: null };
    }
    case LOGIN_USER: {
      const found = state.users.find(
        u => u.email === action.payload.email && u.password === action.payload.password
      );
      if (!found) return { ...state, error: "Неверный email или пароль" };
      return { ...state, user: found, error: null };
    }
    case LOGOUT_USER:
      return { ...state, user: null, error: null };
    default:
      return state;
  }
}

function inventoryReducer(state, action) {
  switch (action.type) {
    case SET_FILTER: return { ...state, filter: action.payload };
    default: return state;
  }
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
      return { ...state, items: [] };
    default: return state;
  }
}

function bookingReducer(state, action) {
  switch (action.type) {
    case SET_BOOKING_FIELD: return { ...state, [action.payload.field]: action.payload.value };
    case SUBMIT_ORDER:      return { ...state, success: true };
    case CLEAR_ORDER:       return { name: "", phone: "", date: "", success: false };
    default: return state;
  }
}

function rootReducer(state, action) {
  return {
    auth:      authReducer(state.auth, action),
    inventory: inventoryReducer(state.inventory, action),
    cart:      cartReducer(state.cart, action),
    booking:   bookingReducer(state.booking, action),
  };
}

// ============================================================
// ACTION CREATORS
// ============================================================
const registerUser = (username, email, password) => ({ type: REGISTER_USER, payload: { username, email, password } });
const loginUser    = (email, password)            => ({ type: LOGIN_USER,    payload: { email, password } });
const logoutUser   = ()                           => ({ type: LOGOUT_USER });
const addToCart    = item      => ({ type: ADD_TO_CART,      payload: item });
const removeFromCart = id      => ({ type: REMOVE_FROM_CART, payload: id });
const setRentalDays = (id,days)=> ({ type: SET_RENTAL_DAYS,  payload: { id, days } });
const clearOrder   = ()        => ({ type: CLEAR_ORDER });
const setBookingField=(f,v)    => ({ type: SET_BOOKING_FIELD,payload: { field: f, value: v } });
const submitOrder  = ()        => ({ type: SUBMIT_ORDER });
const setFilter    = f         => ({ type: SET_FILTER,       payload: f });

// ============================================================
// SELECTORS
// ============================================================
const selectFiltered = s => s.inventory.filter === "all" ? s.inventory.items : s.inventory.items.filter(i => i.category === s.inventory.filter);
const selectTotal    = s => s.cart.items.reduce((sum, i) => sum + i.pricePerDay * i.days, 0);
const selectInCart   = (s, id) => s.cart.items.some(i => i.id === id);

// ============================================================
// VALIDATORS
// ============================================================
const validateUsername = v => {
  if (!v.trim()) return "Введите имя пользователя";
  if (v.trim().length < 2) return "Минимум 2 символа";
  if (!/^[а-яёА-ЯЁa-zA-Z0-9\s_-]+$/.test(v)) return "Только буквы, цифры, _ и -";
  return null;
};
const validateEmail = v => {
  if (!v.trim()) return "Введите email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Некорректный email";
  return null;
};
const validatePassword = v => {
  if (!v) return "Введите пароль";
  if (v.length < 6) return "Минимум 6 символов";
  if (!/[A-Za-zА-Яа-я]/.test(v)) return "Пароль должен содержать буквы";
  if (!/[0-9]/.test(v)) return "Пароль должен содержать цифры";
  return null;
};
const validateName = v => {
  if (!v.trim()) return "Введите имя";
  if (v.trim().length < 2) return "Слишком короткое";
  if (!/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(v)) return "Только буквы и дефис";
  return null;
};
const validatePhone = v => {
  const d = v.replace(/\D/g, "");
  if (!v.trim()) return "Введите номер";
  if (d.length < 10) return "Слишком короткий";
  if (d.length > 13) return "Слишком длинный";
  return null;
};
const validateDate = v => {
  if (!v) return "Выберите дату";
  if (v < getTodayStr()) return "Нельзя выбрать прошедшую дату";
  return null;
};

const formatPhone = raw => {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (digits.startsWith("996")) {
    const r = digits.slice(3);
    let out = "+996";
    if (r.length > 0) out += " (" + r.slice(0, 3);
    if (r.length >= 3) out += ") " + r.slice(3, 6);
    if (r.length >= 6) out += "-" + r.slice(6, 9);
    if (r.length >= 9) out += "-" + r.slice(9, 11);
    return out;
  }
  return raw.length ? "+" + digits : "";
};

// ============================================================
// INPUT COMPONENT
// ============================================================
function Input({ icon, type = "text", placeholder, value, onChange, onBlur, error, success, hint }) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none", zIndex: 1 }}>{icon}</span>
        <input
          type={isPass ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          style={{
            width: "100%", boxSizing: "border-box",
            background: error ? "#1a0808" : success ? "#081a0f" : "#0f172a",
            border: `1.5px solid ${error ? "#f87171" : success ? "#22c55e" : "#2d3f55"}`,
            color: "#f1f5f9", borderRadius: 12,
            padding: `12px ${isPass ? "44px" : "14px"} 12px 40px`,
            fontSize: 14, outline: "none", colorScheme: "dark",
            transition: "all 0.2s",
            boxShadow: error ? "0 0 0 3px #f8717122" : success ? "0 0 0 3px #22c55e22" : "none",
          }}
        />
        {isPass && (
          <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, padding: 0 }}>
            {show ? "🙈" : "👁️"}
          </button>
        )}
        {!isPass && success && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#22c55e", fontSize: 16 }}>✓</span>}
      </div>
      {error && <div style={{ color: "#f87171", fontSize: 11, marginTop: 5, paddingLeft: 4 }}>⚠ {error}</div>}
      {!error && success && hint && <div style={{ color: "#22c55e", fontSize: 11, marginTop: 4, paddingLeft: 4 }}>✓ {hint}</div>}
    </div>
  );
}

// ============================================================
// PASSWORD STRENGTH
// ============================================================
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 6,           label: "6+ символов" },
    { ok: /[A-Za-zА-Яа-я]/.test(password), label: "Буквы" },
    { ok: /[0-9]/.test(password),          label: "Цифры" },
    { ok: password.length >= 10,           label: "10+ символов" },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const labels = ["Слабый", "Средний", "Хороший", "Сильный"];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score-1] : "#1e293b", transition: "all 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: score > 0 ? colors[score-1] : "#475569", fontSize: 11, fontWeight: 600 }}>
          {score > 0 ? labels[score-1] : "Введите пароль"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {checks.map((c,i) => (
            <span key={i} style={{ fontSize: 10, color: c.ok ? "#22c55e" : "#334155" }}>
              {c.ok ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AUTH PAGE
// ============================================================
function AuthPage({ state, enhancedDispatch }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState({});
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const touch = f => setTouched(p => ({ ...p, [f]: true }));

  const errors = {
    username: touched.username ? validateUsername(form.username) : null,
    email:    touched.email    ? validateEmail(form.email)       : null,
    password: touched.password ? validatePassword(form.password) : null,
    confirm:  touched.confirm  ? (form.confirm !== form.password ? "Пароли не совпадают" : null) : null,
  };

  const handleSubmit = () => {
    setLoading(true);
    setAuthError("");

    if (mode === "register") {
      setTouched({ username: true, email: true, password: true, confirm: true });
      if (errors.username || errors.email || errors.password || errors.confirm ||
          !form.username || !form.email || !form.password || form.password !== form.confirm) {
        setLoading(false); return;
      }
      // validationMiddleware проверит ещё раз
      const result = enhancedDispatch(registerUser(form.username, form.email, form.password));
      if (result?.error) setAuthError(result.error);
    } else {
      setTouched({ email: true, password: true });
      if (!form.email || !form.password) { setLoading(false); return; }
      const result = enhancedDispatch(loginUser(form.email, form.password));
      if (result?.error) setAuthError("Неверный email или пароль");
      else if (state.auth.error) setAuthError(state.auth.error);
    }
    setTimeout(() => setLoading(false), 400);
  };

  const s = { background: "#020617", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };

  return (
    <div style={s}>
      {/* Фоновые орбы */}
      <div style={{ position: "fixed", top: "20%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "#6366f108", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "20%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "#3b82f60a", filter: "blur(60px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440, background: "linear-gradient(145deg,#080f20,#060c18)", border: "1px solid #1e293b", borderRadius: 28, padding: "40px 36px", boxShadow: "0 24px 80px #00000088" }}>

        {/* Лого */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", borderRadius: 14, padding: "10px 14px", fontWeight: 900, fontSize: 20, boxShadow: "0 4px 20px #6366f155" }}>GR</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#f1f5f9", letterSpacing: -0.5 }}>GameRent Hub</div>
              <div style={{ color: "#475569", fontSize: 11 }}>Бишкек, Кыргызстан 🇰🇬</div>
            </div>
          </div>
          <div style={{ color: "#64748b", fontSize: 14 }}>
            {mode === "login" ? "Войдите чтобы арендовать девайсы" : "Создайте аккаунт — это бесплатно"}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#0f172a", borderRadius: 14, padding: 4, marginBottom: 28, border: "1px solid #1e293b" }}>
          {[["login", "🔑 Вход"], ["register", "📝 Регистрация"]].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setAuthError(""); setTouched({}); }} style={{ flex: 1, padding: "10px 0", background: mode === m ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "none", color: mode === m ? "#fff" : "#64748b", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
              {l}
            </button>
          ))}
        </div>

        {/* ФОРМА */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {mode === "register" && (
            <Input
              icon="👤" placeholder="Имя пользователя"
              value={form.username}
              onChange={e => set("username", e.target.value.replace(/[^а-яёА-ЯЁa-zA-Z0-9\s_-]/g, ""))}
              onBlur={() => touch("username")}
              error={errors.username}
              success={touched.username && !errors.username && !!form.username}
              hint="Имя корректно"
            />
          )}

          <Input
            icon="📧" type="email" placeholder="Email адрес"
            value={form.email}
            onChange={e => set("email", e.target.value)}
            onBlur={() => touch("email")}
            error={errors.email}
            success={touched.email && !errors.email && !!form.email}
            hint="Email корректен"
          />

          <div>
            <Input
              icon="🔒" type="password" placeholder={mode === "register" ? "Придумайте пароль" : "Ваш пароль"}
              value={form.password}
              onChange={e => set("password", e.target.value)}
              onBlur={() => touch("password")}
              error={errors.password}
              success={touched.password && !errors.password && !!form.password}
              hint="Пароль надёжный"
            />
            {mode === "register" && <PasswordStrength password={form.password} />}
          </div>

          {mode === "register" && (
            <Input
              icon="🔐" type="password" placeholder="Повторите пароль"
              value={form.confirm}
              onChange={e => set("confirm", e.target.value)}
              onBlur={() => touch("confirm")}
              error={errors.confirm}
              success={touched.confirm && !errors.confirm && !!form.confirm && form.confirm === form.password}
              hint="Пароли совпадают"
            />
          )}

          {/* Ошибка от middleware/reducer */}
          {(authError || state.auth.error) && (
            <div style={{ background: "#f8717115", border: "1px solid #f8717144", borderRadius: 12, padding: "12px 16px", color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
              🔒 {authError || state.auth.error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", border: "none", borderRadius: 14, padding: "15px 0", fontWeight: 900, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 24px #6366f155", transition: "all 0.2s", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "⏳ Проверка..." : mode === "login" ? "🚀 Войти" : "✨ Создать аккаунт"}
          </button>

          {/* Демо-подсказка */}
          {mode === "login" && state.auth.users.length > 0 && (
            <div style={{ background: "#6366f110", border: "1px solid #6366f133", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#818cf8" }}>
              💡 Зарегистрированные: {state.auth.users.map(u => u.email).join(", ")}
            </div>
          )}

          {mode === "login" && state.auth.users.length === 0 && (
            <div style={{ textAlign: "center", color: "#334155", fontSize: 12 }}>
              Нет аккаунта? <button onClick={() => setMode("register")} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Зарегистрируйтесь →</button>
            </div>
          )}
        </div>

        {/* Middleware badge */}
        <div style={{ marginTop: 24, padding: "10px 14px", background: "#0f172a", borderRadius: 10, border: "1px solid #1e293b", textAlign: "center" }}>
          <code style={{ color: "#475569", fontSize: 10 }}>
            middleware: <span style={{ color: "#4ade80" }}>validationMiddleware</span> → <span style={{ color: "#f59e0b" }}>authMiddleware</span> → <span style={{ color: "#818cf8" }}>loggerMiddleware</span>
          </code>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT CARD
// ============================================================
function ProductCard({ item, inCart, enhancedDispatch }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:"linear-gradient(145deg,#0f172a,#0a1628)", border:`1px solid ${hov?item.color+"77":"#1e293b"}`, borderRadius:20, padding:"20px 18px", position:"relative", display:"flex", flexDirection:"column", gap:10, transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)", transform:hov?"translateY(-5px)":"translateY(0)", boxShadow:hov?`0 20px 40px ${item.color}22`:"0 4px 12px #00000044" }}>
      <div style={{ position:"absolute", inset:0, borderRadius:20, opacity:hov?1:0, background:`radial-gradient(circle at top right,${item.color}0d,transparent 60%)`, transition:"opacity 0.3s", pointerEvents:"none" }} />
      {item.badge && <span style={{ position:"absolute", top:12, right:12, background:item.color, color:"#fff", fontSize:9, fontWeight:800, padding:"3px 9px", borderRadius:20, letterSpacing:1.5 }}>{item.badge}</span>}
      <div style={{ fontSize:38 }}>{item.emoji}</div>
      <div>
        <div style={{ color:"#f1f5f9", fontWeight:700, fontSize:14 }}>{item.name}</div>
        <div style={{ color:"#475569", fontSize:11, marginTop:3, lineHeight:1.5 }}>{item.specs}</div>
      </div>
      <div>
        <span style={{ color:item.color, fontWeight:900, fontSize:20 }}>{item.pricePerDay.toLocaleString()}</span>
        <span style={{ color:"#475569", fontSize:12 }}> сом/день</span>
      </div>
      <button
        onClick={() => !inCart && enhancedDispatch(addToCart(item))}
        style={{ background:inCart?"#1e293b":`linear-gradient(135deg,${item.color},${item.color}bb)`, color:inCart?"#475569":"#fff", border:"none", borderRadius:10, padding:"10px 0", fontWeight:700, fontSize:12, cursor:inCart?"not-allowed":"pointer", transition:"all 0.2s", marginTop:"auto", boxShadow:inCart?"none":`0 4px 14px ${item.color}44` }}>
        {inCart ? "✓ В корзине" : "+ В корзину"}
      </button>
    </div>
  );
}

// ============================================================
// CART ITEM
// ============================================================
function CartItem({ item, enhancedDispatch }) {
  return (
    <div style={{ background:"linear-gradient(135deg,#1e293b,#162032)", borderRadius:14, padding:"13px 15px", display:"flex", flexDirection:"column", gap:9, border:"1px solid #2d3f55" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ color:"#e2e8f0", fontSize:13, fontWeight:600 }}>{item.emoji} {item.name}</span>
        <button onClick={() => enhancedDispatch(removeFromCart(item.id))} style={{ background:"#334155", border:"none", color:"#94a3b8", cursor:"pointer", width:26, height:26, borderRadius:7, fontSize:13 }}>✕</button>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:"#64748b", fontSize:11 }}>Дней:</span>
        <div style={{ display:"flex", alignItems:"center", gap:4, background:"#0f172a", borderRadius:8, padding:"3px 6px" }}>
          <button onClick={() => enhancedDispatch(setRentalDays(item.id, item.days-1))} style={{ background:"#334155", border:"none", color:"#fff", width:26, height:26, borderRadius:6, cursor:"pointer", fontWeight:900 }}>−</button>
          <span style={{ color:"#fff", fontWeight:800, minWidth:26, textAlign:"center" }}>{item.days}</span>
          <button onClick={() => enhancedDispatch(setRentalDays(item.id, item.days+1))} style={{ background:"#334155", border:"none", color:"#fff", width:26, height:26, borderRadius:6, cursor:"pointer", fontWeight:900 }}>+</button>
        </div>
        <span style={{ marginLeft:"auto", color:item.color, fontWeight:800, fontSize:14 }}>{(item.pricePerDay*item.days).toLocaleString()} сом</span>
      </div>
    </div>
  );
}

// ============================================================
// DEVTOOLS
// ============================================================
function DevTools({ state }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999 }}>
      <button onClick={() => setOpen(o=>!o)} style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", color:"#fff", border:"none", borderRadius:12, padding:"10px 18px", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"monospace", boxShadow:"0 4px 20px #7c3aed55" }}>
        ⚡ Redux + Middleware
      </button>
      {open && (
        <div style={{ position:"absolute", bottom:52, right:0, width:380, background:"#0d0d1a", border:"1px solid #7c3aed55", borderRadius:16, padding:18, maxHeight:500, overflowY:"auto", boxShadow:"0 20px 60px #00000099", fontFamily:"monospace" }}>
          <div style={{ color:"#a78bfa", fontWeight:700, fontSize:13, marginBottom:10 }}>⚡ Global State + Middleware Chain</div>
          <div style={{ marginBottom:12, padding:"8px 12px", background:"#1a1a2e", borderRadius:8, fontSize:11, lineHeight:2 }}>
            <span style={{ color:"#4ade80" }}>validationMiddleware</span> →{" "}
            <span style={{ color:"#f59e0b" }}>authMiddleware</span> →{" "}
            <span style={{ color:"#818cf8" }}>loggerMiddleware</span> →{" "}
            <span style={{ color:"#f1f5f9" }}>rootReducer</span>
          </div>
          <pre style={{ margin:0, fontSize:11, color:"#e2e8f0", whiteSpace:"pre-wrap", lineHeight:1.8 }}>
{JSON.stringify({
  "auth.user": state.auth.user ? { username: state.auth.user.username, email: state.auth.user.email } : null,
  "auth.users_count": state.auth.users.length,
  "inventory.filter": state.inventory.filter,
  "cart.items": state.cart.items.map(i=>({ name:i.name, days:i.days, total:`${(i.pricePerDay*i.days).toLocaleString()} сом` })),
  "cart.total": `${selectTotal(state).toLocaleString()} сом`,
  "booking": { name:state.booking.name, date:state.booking.date },
}, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CART PANEL
// ============================================================
function CartPanel({ state, enhancedDispatch }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const total = selectTotal(state);
  const { name, phone, date, success } = state.booking;
  const touch = f => setTouched(p => ({ ...p, [f]: true }));

  const liveErr = {
    name:  touched.name  ? validateName(name)   : null,
    phone: touched.phone ? validatePhone(phone) : null,
    date:  touched.date  ? validateDate(date)   : null,
  };

  const handleSubmit = () => {
    setTouched({ name:true, phone:true, date:true });
    const e = { name:validateName(name), phone:validatePhone(phone), date:validateDate(date), cart:state.cart.items.length===0?"Корзина пуста":null };
    setErrors(e);
    if (Object.values(e).every(v=>!v)) enhancedDispatch(submitOrder());
  };

  const iStyle = f => ({
    width:"100%", boxSizing:"border-box",
    background: liveErr[f]?"#1a0808": touched[f]&&!liveErr[f]?"#081a0f":"#0f172a",
    border:`1.5px solid ${liveErr[f]?"#f87171":touched[f]&&!liveErr[f]?"#22c55e":"#2d3f55"}`,
    color:"#f1f5f9", borderRadius:12, padding:"12px 14px 12px 40px",
    fontSize:14, outline:"none", colorScheme:"dark", transition:"all 0.2s",
    boxShadow: liveErr[f]?"0 0 0 3px #f8717122":touched[f]&&!liveErr[f]?"0 0 0 3px #22c55e22":"none",
  });

  if (success) return (
    <div style={{ textAlign:"center", padding:"32px 0" }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
      <div style={{ color:"#4ade80", fontWeight:900, fontSize:22, marginBottom:12 }}>Заказ оформлен!</div>
      <div style={{ color:"#94a3b8", fontSize:14, lineHeight:2.4, marginBottom:24, background:"#0f172a", borderRadius:16, padding:"16px 20px", border:"1px solid #1e293b" }}>
        👤 <b style={{ color:"#f1f5f9" }}>{name}</b><br/>
        📅 <b style={{ color:"#f1f5f9" }}>{new Date(date).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}</b><br/>
        📦 <b style={{ color:"#818cf8" }}>{state.cart.items.length} шт.</b><br/>
        💰 <b style={{ color:"#4ade80", fontSize:20 }}>{total.toLocaleString()} сом</b>
      </div>
      <button onClick={() => enhancedDispatch(clearOrder())} style={{ background:"linear-gradient(135deg,#6366f1,#3b82f6)", color:"#fff", border:"none", borderRadius:14, padding:"13px 30px", fontWeight:800, cursor:"pointer", fontSize:15 }}>← Новый заказ</button>
    </div>
  );

  return (
    <>
      <div style={{ fontWeight:800, fontSize:17, marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
        🛒 Корзина
        <span style={{ background:state.cart.items.length?"#6366f122":"#1e293b", color:state.cart.items.length?"#818cf8":"#475569", borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:600 }}>{state.cart.items.length} шт.</span>
      </div>

      {state.cart.items.length === 0 ? (
        <div style={{ textAlign:"center", color:"#334155", padding:"30px 0", lineHeight:2.5, border:"1px dashed #1e293b", borderRadius:14, marginBottom:16 }}>
          <div style={{ fontSize:32, opacity:0.3, marginBottom:6 }}>🎮</div>
          <div style={{ fontSize:13 }}>Корзина пуста</div>
          <div style={{ fontSize:11 }}>Выберите устройства из каталога</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14, maxHeight:260, overflowY:"auto" }}>
          {state.cart.items.map(item => <CartItem key={item.id} item={item} enhancedDispatch={enhancedDispatch} />)}
        </div>
      )}

      {errors.cart && <div style={{ color:"#f87171", fontSize:12, marginBottom:10, background:"#f8717110", border:"1px solid #f8717133", borderRadius:10, padding:"10px 14px" }}>⚠️ {errors.cart}</div>}

      {state.cart.items.length > 0 && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#6366f110", border:"1px solid #6366f122", borderRadius:14, padding:"14px 18px", marginBottom:20 }}>
          <span style={{ color:"#94a3b8", fontWeight:600 }}>Итого:</span>
          <span style={{ color:"#818cf8", fontWeight:900, fontSize:24 }}>{total.toLocaleString()} сом</span>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
          <div style={{ flex:1, height:1, background:"#1e293b" }} />
          <span style={{ color:"#6366f1", fontSize:10, fontWeight:800, letterSpacing:2, whiteSpace:"nowrap" }}>ДАННЫЕ ДЛЯ БРОНИРОВАНИЯ</span>
          <div style={{ flex:1, height:1, background:"#1e293b" }} />
        </div>

        <div>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>👤</span>
            <input type="text" placeholder="Ваше имя" value={name}
              onChange={e => enhancedDispatch(setBookingField("name", e.target.value.replace(/[^а-яёА-ЯЁa-zA-Z\s-]/g,"")))}
              onBlur={() => touch("name")}
              style={iStyle("name")} />
            {touched.name && !liveErr.name && name && <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:"#22c55e", fontSize:16 }}>✓</span>}
          </div>
          {liveErr.name && <div style={{ color:"#f87171", fontSize:11, marginTop:5, paddingLeft:4 }}>⚠ {liveErr.name}</div>}
        </div>

        <div>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>📱</span>
            <input type="tel" placeholder="+996 (700) 000-000" value={phone}
              onChange={e => enhancedDispatch(setBookingField("phone", formatPhone(e.target.value)))}
              onBlur={() => touch("phone")} style={iStyle("phone")} />
            {touched.phone && !liveErr.phone && phone && <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:"#22c55e", fontSize:16 }}>✓</span>}
          </div>
          {liveErr.phone ? <div style={{ color:"#f87171", fontSize:11, marginTop:5, paddingLeft:4 }}>⚠ {liveErr.phone}</div>
            : touched.phone && !liveErr.phone && phone && <div style={{ color:"#22c55e", fontSize:11, marginTop:5, paddingLeft:4 }}>✓ Номер корректен</div>}
        </div>

        <div>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, pointerEvents:"none", zIndex:1 }}>📅</span>
            <input type="date" min={getTodayStr()} value={date}
              onChange={e => { enhancedDispatch(setBookingField("date", e.target.value)); touch("date"); }}
              onBlur={() => touch("date")} style={iStyle("date")} />
          </div>
          {liveErr.date ? <div style={{ color:"#f87171", fontSize:11, marginTop:5, paddingLeft:4 }}>⚠ {liveErr.date}</div>
            : touched.date && !liveErr.date && date && <div style={{ color:"#22c55e", fontSize:11, marginTop:5, paddingLeft:4 }}>✓ {new Date(date).toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"})}</div>}
          <div style={{ color:"#475569", fontSize:10, marginTop:4, paddingLeft:4 }}>📌 Минимум — сегодня ({new Date().toLocaleDateString("ru-RU")})</div>
        </div>

        <button onClick={handleSubmit}
          onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
          style={{ marginTop:4, background:"linear-gradient(135deg,#6366f1,#3b82f6)", color:"#fff", border:"none", borderRadius:14, padding:"15px 0", fontWeight:900, fontSize:16, cursor:"pointer", boxShadow:"0 4px 20px #6366f155", transition:"all 0.2s" }}>
          🚀 Забронировать
        </button>
      </div>
    </>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [state, rawDispatch] = useReducer(rootReducer, initialState);
  const stateRef = useState(state)[0]; // для getState в closure

  // getState через useReducer — передаём через ref
  const [latestState, setLatestState] = useState(state);
  const getState = () => latestState;

  // Обновляем latestState синхронно через второй useState
  // Используем простой паттерн: enhancedDispatch имеет доступ к state через closure
  function makeEnhancedDispatch(currentState) {
    return function enhancedDispatch(action) {
      // 1. validationMiddleware
      const validation = validationMiddleware(action);
      if (validation.blocked) return { error: validation.error };
      // 2. authMiddleware
      const allowed = authMiddleware(action, currentState);
      if (!allowed) return { error: "Требуется авторизация" };
      // 3. dispatch
      rawDispatch(action);
      // 4. loggerMiddleware
      loggerMiddleware(action, currentState, currentState);
      return { success: true };
    };
  }

  const enhancedDispatch = makeEnhancedDispatch(state);
  const filtered = selectFiltered(state);

  const FILTERS = [
    { key:"all", label:"🌐 Все" },
    { key:"console", label:"🎮 Консоли" },
    { key:"vr", label:"🥽 VR" },
    { key:"game", label:"💿 Игры" },
    { key:"accessory", label:"🎲 Аксессуары" },
  ];

  // Если не залогинен — показываем Auth
  if (!state.auth.user) {
    return <AuthPage state={state} enhancedDispatch={enhancedDispatch} />;
  }

  return (
    <div style={{ minHeight:"100vh", width:"100vw", maxWidth:"100vw", background:"#020617", color:"#fff", fontFamily:"'Segoe UI', system-ui, sans-serif", overflowX:"hidden" }}>

      {/* HEADER */}
      <header style={{ width:"100%", background:"rgba(2,6,23,0.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid #1e293b", padding:"0 48px", height:68, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxSizing:"border-box" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ background:"linear-gradient(135deg,#6366f1,#3b82f6)", borderRadius:12, padding:"8px 13px", fontWeight:900, fontSize:16, boxShadow:"0 4px 16px #6366f155" }}>GR</div>
          <div>
            <div style={{ fontWeight:800, fontSize:18, letterSpacing:-0.5 }}>GameRent Hub</div>
            <div style={{ color:"#475569", fontSize:11 }}>Аренда игровых девайсов · Бишкек 🇰🇬</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* User badge */}
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, padding:"7px 14px" }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800 }}>
              {state.auth.user.username[0].toUpperCase()}
            </div>
            <div>
              <div style={{ color:"#f1f5f9", fontSize:13, fontWeight:600 }}>{state.auth.user.username}</div>
              <div style={{ color:"#475569", fontSize:10 }}>{state.auth.user.email}</div>
            </div>
          </div>
          <div style={{ color:"#475569", fontSize:13 }}>💰 <span style={{ color:"#4ade80", fontWeight:700 }}>Сом (KGS)</span></div>
          <div style={{ background:state.cart.items.length?"linear-gradient(135deg,#6366f1,#3b82f6)":"#1e293b", color:state.cart.items.length?"#fff":"#475569", borderRadius:12, padding:"8px 20px", fontWeight:700, fontSize:14, transition:"all 0.3s" }}>
            🛒 {state.cart.items.length}
          </div>
          <button onClick={() => enhancedDispatch(logoutUser())}
            style={{ background:"#1e293b", color:"#94a3b8", border:"1px solid #334155", borderRadius:10, padding:"8px 16px", fontWeight:600, fontSize:13, cursor:"pointer" }}>
            Выйти →
          </button>
        </div>
      </header>

      {/* HERO */}
      <div style={{ width:"100%", padding:"64px 48px 40px", textAlign:"center", background:"radial-gradient(ellipse 100% 60% at 50% 0%,#6366f10e,transparent 70%)", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, left:"10%", width:400, height:400, borderRadius:"50%", background:"#6366f108", filter:"blur(80px)", pointerEvents:"none" }} />
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid #6366f133", background:"#6366f10a", borderRadius:100, padding:"6px 20px", color:"#818cf8", fontSize:12, fontWeight:700, marginBottom:22, letterSpacing:2 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block", boxShadow:"0 0 8px #4ade80" }} />
          Добро пожаловать, {state.auth.user.username}! 🎮
        </div>
        <h1 style={{ fontSize:"clamp(34px,5vw,62px)", fontWeight:900, margin:"0 0 16px", background:"linear-gradient(135deg,#f8fafc 0%,#818cf8 55%,#3b82f6 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:-3, lineHeight:1.05 }}>
          Арендуй топовые<br />игровые устройства
        </h1>
        <p style={{ color:"#64748b", fontSize:16, margin:0 }}>
          Бронирование онлайн · Доставка по Бишкеку · от <strong style={{ color:"#818cf8" }}>100 сом/день</strong>
        </p>
      </div>

      {/* FILTERS */}
      <div style={{ display:"flex", gap:10, justifyContent:"center", padding:"0 48px 28px", flexWrap:"wrap", boxSizing:"border-box" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => enhancedDispatch(setFilter(f.key))}
            style={{ background:state.inventory.filter===f.key?"linear-gradient(135deg,#6366f1,#3b82f6)":"#0f172a", color:state.inventory.filter===f.key?"#fff":"#64748b", border:`1px solid ${state.inventory.filter===f.key?"transparent":"#1e293b"}`, borderRadius:100, padding:"9px 24px", fontWeight:600, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:28, padding:"0 48px 60px", width:"100%", boxSizing:"border-box", alignItems:"start" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
          {filtered.map(item => <ProductCard key={item.id} item={item} inCart={selectInCart(state,item.id)} enhancedDispatch={enhancedDispatch} />)}
        </div>
        <div style={{ background:"linear-gradient(145deg,#080f20,#060c18)", border:"1px solid #1e293b", borderRadius:24, padding:26, position:"sticky", top:80, boxShadow:"0 8px 48px #00000066" }}>
          <CartPanel state={state} enhancedDispatch={enhancedDispatch} />
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid #0f172a", padding:"28px 48px", boxSizing:"border-box", background:"linear-gradient(180deg,transparent,#020617)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ background:"linear-gradient(135deg,#6366f1,#3b82f6)", borderRadius:10, padding:"6px 11px", fontWeight:900, fontSize:14 }}>GR</div>
            <div>
              <div style={{ color:"#f1f5f9", fontWeight:700, fontSize:15 }}>GameRent Hub</div>
              <div style={{ color:"#334155", fontSize:11 }}>Бишкек, Кыргызстан 🇰🇬</div>
            </div>
          </div>
          <div style={{ textAlign:"center", padding:"10px 20px", background:"#0f172a", borderRadius:12, border:"1px solid #1e293b" }}>
            <div style={{ color:"#475569", fontSize:10, fontWeight:700, letterSpacing:1.5, marginBottom:4 }}>MIDDLEWARE CHAIN</div>
            <code style={{ color:"#818cf8", fontSize:11, lineHeight:1.8, display:"block" }}>
              <span style={{ color:"#4ade80" }}>validationMiddleware</span> →{" "}
              <span style={{ color:"#f59e0b" }}>authMiddleware</span> →{" "}
              <span style={{ color:"#f87171" }}>loggerMiddleware</span> →{" "}
              <span style={{ color:"#818cf8" }}>rootReducer</span>
            </code>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"#334155", fontSize:12 }}>💳 Принимаем оплату</div>
            <div style={{ color:"#4ade80", fontWeight:700, fontSize:14 }}>Наличные · Mbank · Optima</div>
            <div style={{ color:"#334155", fontSize:11, marginTop:4 }}>📞 +996 (700) 000-000</div>
          </div>
        </div>
      </footer>

      <DevTools state={state} />
    </div>
  );
}