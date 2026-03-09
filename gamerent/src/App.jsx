import { useState, useReducer } from "react";

const ADD_TO_CART = "ADD_TO_CART";
const REMOVE_FROM_CART = "REMOVE_FROM_CART";
const SET_RENTAL_DAYS = "SET_RENTAL_DAYS";
const CLEAR_ORDER = "CLEAR_ORDER";
const SET_BOOKING_FIELD = "SET_BOOKING_FIELD";
const SUBMIT_ORDER = "SUBMIT_ORDER";
const SET_FILTER = "SET_FILTER";

const INVENTORY = [
  { id: 1,  name: "PlayStation 5",        category: "console",   pricePerDay: 800,  emoji: "🎮", badge: "ХИТ",  color: "#3b82f6", specs: "825GB SSD · DualSense · 4K HDR" },
  { id: 2,  name: "Xbox Series X",         category: "console",   pricePerDay: 750,  emoji: "🕹️", badge: "NEW",  color: "#22c55e", specs: "1TB NVMe · Game Pass · 4K" },
  { id: 3,  name: "Nintendo Switch OLED",  category: "console",   pricePerDay: 500,  emoji: "🎯", badge: null,   color: "#ef4444", specs: "7\" OLED · Портативный · Joy-Con" },
  { id: 4,  name: "PlayStation 4 Pro",     category: "console",   pricePerDay: 400,  emoji: "🕹️", badge: null,   color: "#6366f1", specs: "1TB · HDR · PS Plus включён" },
  { id: 5,  name: "Xbox One S",            category: "console",   pricePerDay: 350,  emoji: "🎮", badge: null,   color: "#84cc16", specs: "1TB · 4K UHD · Game Pass 1 мес" },
  { id: 6,  name: "Meta Quest 3",          category: "vr",        pricePerDay: 1100, emoji: "🥽", badge: "VR",   color: "#a855f7", specs: "Mixed Reality · 4K · 128GB" },
  { id: 7,  name: "PlayStation VR2",       category: "vr",        pricePerDay: 950,  emoji: "👓", badge: "VR",   color: "#06b6d4", specs: "OLED · Eye Tracking · Haptic" },
  { id: 8,  name: "Meta Quest 2",          category: "vr",        pricePerDay: 700,  emoji: "🥽", badge: null,   color: "#8b5cf6", specs: "90Hz · 256GB · 50+ игр" },
  { id: 9,  name: "DualSense Pack",        category: "accessory", pricePerDay: 200,  emoji: "🎲", badge: null,   color: "#f59e0b", specs: "2 геймпада · 5 игр в комплекте" },
  { id: 10, name: "Logitech G29",          category: "accessory", pricePerDay: 350,  emoji: "🏎️", badge: null,   color: "#10b981", specs: "Force Feedback · Педали · PS/PC" },
  { id: 11, name: "Xbox + Kinect",         category: "accessory", pricePerDay: 400,  emoji: "🕺", badge: "FUN",  color: "#f97316", specs: "Бесконтактное управление · 4K" },
  { id: 12, name: "Guitar Hero Pack",      category: "accessory", pricePerDay: 300,  emoji: "🎸", badge: null,   color: "#ec4899", specs: "2 гитары · барабаны · 100 треков" },
  { id: 13, name: "God of War Ragnarök",   category: "game",      pricePerDay: 150,  emoji: "⚔️", badge: "PS5",  color: "#3b82f6", specs: "Action-RPG · PS5 · 2022" },
  { id: 14, name: "Spider-Man 2",          category: "game",      pricePerDay: 150,  emoji: "🕷️", badge: "PS5",  color: "#e11d48", specs: "Open World · PS5 · 2023" },
  { id: 15, name: "Hogwarts Legacy",       category: "game",      pricePerDay: 120,  emoji: "🧙", badge: null,   color: "#f59e0b", specs: "RPG · PS5/Xbox · 2023" },
  { id: 16, name: "FIFA 24",               category: "game",      pricePerDay: 100,  emoji: "⚽", badge: null,   color: "#22c55e", specs: "Спорт · PS5/Xbox · 2023" },
  { id: 17, name: "Mortal Kombat 1",       category: "game",      pricePerDay: 120,  emoji: "🥊", badge: null,   color: "#ef4444", specs: "Fighting · PS5/Xbox · 2023" },
  { id: 18, name: "Cyberpunk 2077",        category: "game",      pricePerDay: 100,  emoji: "🤖", badge: null,   color: "#facc15", specs: "RPG · PS5/Xbox · Phantom Liberty" },
  { id: 19, name: "Forza Horizon 5",       category: "game",      pricePerDay: 110,  emoji: "🚗", badge: "XBOX", color: "#22c55e", specs: "Racing · Xbox · 4K 60fps" },
  { id: 20, name: "Elden Ring",            category: "game",      pricePerDay: 120,  emoji: "💀", badge: null,   color: "#d97706", specs: "Souls-like · PS5/Xbox · 2022" },
];

// Сегодняшняя дата в формате YYYY-MM-DD для min атрибута
const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

const initialState = {
  inventory: { items: INVENTORY, filter: "all" },
  cart: { items: [] },
  booking: { name: "", phone: "", date: "", success: false },
};

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
    case SUBMIT_ORDER: return { ...state, success: true };
    case CLEAR_ORDER: return { name: "", phone: "", date: "", success: false };
    default: return state;
  }
}
function rootReducer(state, action) {
  return {
    inventory: inventoryReducer(state.inventory, action),
    cart: cartReducer(state.cart, action),
    booking: bookingReducer(state.booking, action),
  };
}

const addToCart       = item       => ({ type: ADD_TO_CART, payload: item });
const removeFromCart  = id         => ({ type: REMOVE_FROM_CART, payload: id });
const setRentalDays   = (id, days) => ({ type: SET_RENTAL_DAYS, payload: { id, days } });
const clearOrder      = ()         => ({ type: CLEAR_ORDER });
const setBookingField = (f, v)     => ({ type: SET_BOOKING_FIELD, payload: { field: f, value: v } });
const submitOrder     = ()         => ({ type: SUBMIT_ORDER });
const setFilter       = f          => ({ type: SET_FILTER, payload: f });

const selectFiltered = s => s.inventory.filter === "all" ? s.inventory.items : s.inventory.items.filter(i => i.category === s.inventory.filter);
const selectTotal    = s => s.cart.items.reduce((sum, i) => sum + i.pricePerDay * i.days, 0);
const selectInCart   = (s, id) => s.cart.items.some(i => i.id === id);

// ── ВАЛИДАТОРЫ ──────────────────────────────────────────────
const validateName = v => {
  if (!v.trim()) return "Введите имя";
  if (v.trim().length < 2) return "Имя слишком короткое";
  if (!/^[а-яёА-ЯЁa-zA-Z\s\-]+$/.test(v.trim())) return "Только буквы и дефис";
  return null;
};
const validatePhone = v => {
  const digits = v.replace(/\D/g, "");
  if (!v.trim()) return "Введите номер телефона";
  if (digits.length < 10) return "Слишком короткий номер";
  if (digits.length > 13) return "Слишком длинный номер";
  return null;
};
const validateDate = v => {
  if (!v) return "Выберите дату начала аренды";
  if (v < getTodayStr()) return "Нельзя выбрать прошедшую дату";
  return null;
};

// ── Форматирование телефона ──────────────────────────────────
const formatPhone = raw => {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (digits.startsWith("996")) {
    const rest = digits.slice(3);
    let out = "+996";
    if (rest.length > 0) out += " (" + rest.slice(0, 3);
    if (rest.length >= 3) out += ") " + rest.slice(3, 6);
    if (rest.length >= 6) out += "-" + rest.slice(6, 9);
    if (rest.length >= 9) out += "-" + rest.slice(9, 11);
    return out;
  }
  if (digits.startsWith("0")) {
    const rest = digits.slice(1);
    let out = "0";
    if (rest.length > 0) out += rest.slice(0, 3);
    if (rest.length >= 3) out += " " + rest.slice(3, 6);
    if (rest.length >= 6) out += "-" + rest.slice(6, 9);
    return out;
  }
  return raw.length ? "+" + digits : "";
};

function ProductCard({ item, inCart, dispatch }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "linear-gradient(145deg,#0f172a,#0a1628)",
        border: `1px solid ${hov ? item.color + "77" : "#1e293b"}`,
        borderRadius: 20, padding: "20px 18px",
        position: "relative", display: "flex", flexDirection: "column", gap: 10,
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hov ? `0 20px 40px ${item.color}22` : "0 4px 12px #00000044",
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 20, opacity: hov ? 1 : 0, background: `radial-gradient(circle at top right,${item.color}0d,transparent 60%)`, transition: "opacity 0.3s", pointerEvents: "none" }} />
      {item.badge && <span style={{ position: "absolute", top: 12, right: 12, background: item.color, color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 20, letterSpacing: 1.5 }}>{item.badge}</span>}
      <div style={{ fontSize: 38 }}>{item.emoji}</div>
      <div>
        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>{item.name}</div>
        <div style={{ color: "#475569", fontSize: 11, marginTop: 3, lineHeight: 1.5 }}>{item.specs}</div>
      </div>
      <div>
        <span style={{ color: item.color, fontWeight: 900, fontSize: 20 }}>{item.pricePerDay.toLocaleString()}</span>
        <span style={{ color: "#475569", fontSize: 12 }}> сом/день</span>
      </div>
      <button
        onClick={() => !inCart && dispatch(addToCart(item))}
        style={{ background: inCart ? "#1e293b" : `linear-gradient(135deg,${item.color},${item.color}bb)`, color: inCart ? "#475569" : "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 700, fontSize: 12, cursor: inCart ? "not-allowed" : "pointer", transition: "all 0.2s", marginTop: "auto", boxShadow: inCart ? "none" : `0 4px 14px ${item.color}44` }}
      >{inCart ? "✓ В корзине" : "+ В корзину"}</button>
    </div>
  );
}

function CartItem({ item, dispatch }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#1e293b,#162032)", borderRadius: 14, padding: "13px 15px", display: "flex", flexDirection: "column", gap: 9, border: "1px solid #2d3f55" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{item.emoji} {item.name}</span>
        <button onClick={() => dispatch(removeFromCart(item.id))} style={{ background: "#334155", border: "none", color: "#94a3b8", cursor: "pointer", width: 26, height: 26, borderRadius: 7, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#64748b", fontSize: 11 }}>Дней:</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#0f172a", borderRadius: 8, padding: "3px 6px" }}>
          <button onClick={() => dispatch(setRentalDays(item.id, item.days - 1))} style={{ background: "#334155", border: "none", color: "#fff", width: 26, height: 26, borderRadius: 6, cursor: "pointer", fontWeight: 900, fontSize: 15 }}>−</button>
          <span style={{ color: "#fff", fontWeight: 800, minWidth: 26, textAlign: "center", fontSize: 14 }}>{item.days}</span>
          <button onClick={() => dispatch(setRentalDays(item.id, item.days + 1))} style={{ background: "#334155", border: "none", color: "#fff", width: 26, height: 26, borderRadius: 6, cursor: "pointer", fontWeight: 900, fontSize: 15 }}>+</button>
        </div>
        <span style={{ marginLeft: "auto", color: item.color, fontWeight: 800, fontSize: 14 }}>{(item.pricePerDay * item.days).toLocaleString()} сом</span>
      </div>
    </div>
  );
}

function DevTools({ state }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "monospace", boxShadow: "0 4px 20px #7c3aed55" }}>
        ⚡ Redux DevTools
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: 52, right: 0, width: 350, background: "#0d0d1a", border: "1px solid #7c3aed55", borderRadius: 16, padding: 18, maxHeight: 440, overflowY: "auto", boxShadow: "0 20px 60px #00000099", fontFamily: "monospace" }}>
          <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>⚡ Global State</div>
          <pre style={{ margin: 0, fontSize: 11, color: "#e2e8f0", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
{JSON.stringify({ "inventory.filter": state.inventory.filter, "cart.items": state.cart.items.map(i => ({ name: i.name, days: i.days, total: `${(i.pricePerDay*i.days).toLocaleString()} сом` })), "cart.total": `${selectTotal(state).toLocaleString()} сом`, booking: { name: state.booking.name, phone: state.booking.phone, date: state.booking.date } }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── CART PANEL ───────────────────────────────────────────────
function CartPanel({ state, dispatch }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const total = selectTotal(state);
  const { name, phone, date, success } = state.booking;

  const touch = field => setTouched(p => ({ ...p, [field]: true }));

  const liveErrors = {
    name:  touched.name  ? validateName(name)   : null,
    phone: touched.phone ? validatePhone(phone) : null,
    date:  touched.date  ? validateDate(date)   : null,
  };

  const handlePhoneChange = raw => {
    const formatted = formatPhone(raw);
    dispatch(setBookingField("phone", formatted));
  };

  const handleNameChange = raw => {
    // Запрещаем цифры и спецсимволы на лету
    const cleaned = raw.replace(/[^а-яёА-ЯЁa-zA-Z\s\-]/g, "");
    dispatch(setBookingField("name", cleaned));
  };

  const handleSubmit = () => {
    setTouched({ name: true, phone: true, date: true });
    const e = {
      name:  validateName(name),
      phone: validatePhone(phone),
      date:  validateDate(date),
      cart:  state.cart.items.length === 0 ? "Добавьте хотя бы один товар" : null,
    };
    setErrors(e);
    if (Object.values(e).every(v => !v)) dispatch(submitOrder());
  };

  const handleReset = () => {
    dispatch(clearOrder());
    setErrors({});
    setTouched({});
  };

  const inputStyle = (field) => ({
    width: "100%", boxSizing: "border-box",
    background: liveErrors[field] ? "#1a0a0a" : touched[field] && !liveErrors[field] ? "#0a1a0f" : "#0f172a",
    border: `1.5px solid ${liveErrors[field] ? "#f87171" : touched[field] && !liveErrors[field] ? "#22c55e" : "#2d3f55"}`,
    color: "#f1f5f9", borderRadius: 12,
    padding: "12px 14px 12px 40px",
    fontSize: 14, outline: "none",
    colorScheme: "dark",
    transition: "all 0.2s",
    boxShadow: liveErrors[field] ? "0 0 0 3px #f8717122" : touched[field] && !liveErrors[field] ? "0 0 0 3px #22c55e22" : "none",
  });

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 16, filter: "drop-shadow(0 8px 24px rgba(74,222,128,0.4))" }}>🎉</div>
        <div style={{ color: "#4ade80", fontWeight: 900, fontSize: 24, marginBottom: 12 }}>Заказ оформлен!</div>
        <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 2.4, marginBottom: 24, background: "#0f172a", borderRadius: 16, padding: "16px 20px", border: "1px solid #1e293b" }}>
          👤 Клиент: <b style={{ color: "#f1f5f9" }}>{name}</b><br />
          📅 Дата начала: <b style={{ color: "#f1f5f9" }}>{new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</b><br />
          📦 Товаров: <b style={{ color: "#818cf8" }}>{state.cart.items.length} шт.</b><br />
          💰 Итого: <b style={{ color: "#4ade80", fontSize: 20 }}>{total.toLocaleString()} сом</b>
        </div>
        <button onClick={handleReset} style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", border: "none", borderRadius: 14, padding: "13px 30px", fontWeight: 800, cursor: "pointer", fontSize: 15, boxShadow: "0 4px 20px #6366f155" }}>
          ← Новый заказ
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Заголовок */}
      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        🛒 Корзина
        <span style={{ background: state.cart.items.length ? "#6366f122" : "#1e293b", color: state.cart.items.length ? "#818cf8" : "#475569", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
          {state.cart.items.length} шт.
        </span>
      </div>

      {/* Товары */}
      {state.cart.items.length === 0 ? (
        <div style={{ textAlign: "center", color: "#334155", padding: "30px 0", lineHeight: 2.5, border: "1px dashed #1e293b", borderRadius: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 6 }}>🎮</div>
          <div style={{ fontSize: 13 }}>Корзина пуста</div>
          <div style={{ fontSize: 11 }}>Выберите устройства из каталога</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, maxHeight: 260, overflowY: "auto", paddingRight: 2 }}>
          {state.cart.items.map(item => <CartItem key={item.id} item={item} dispatch={dispatch} />)}
        </div>
      )}

      {errors.cart && (
        <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10, background: "#f8717110", border: "1px solid #f8717133", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          ⚠️ {errors.cart}
        </div>
      )}

      {/* Итог */}
      {state.cart.items.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#6366f110", border: "1px solid #6366f122", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
          <span style={{ color: "#94a3b8", fontWeight: 600 }}>Итого:</span>
          <span style={{ color: "#818cf8", fontWeight: 900, fontSize: 24 }}>{total.toLocaleString()} сом</span>
        </div>
      )}

      {/* Форма */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
          <span style={{ color: "#6366f1", fontSize: 10, fontWeight: 800, letterSpacing: 2, whiteSpace: "nowrap" }}>ДАННЫЕ ДЛЯ БРОНИРОВАНИЯ</span>
          <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
        </div>

        {/* ИМЯ */}
        <div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>👤</span>
            <input
              type="text"
              placeholder="Ваше имя (только буквы)"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              onBlur={() => touch("name")}
              style={inputStyle("name")}
            />
            {touched.name && !liveErrors.name && name && (
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#22c55e", fontSize: 16 }}>✓</span>
            )}
          </div>
          {liveErrors.name && <div style={{ color: "#f87171", fontSize: 11, marginTop: 5, paddingLeft: 4, display: "flex", alignItems: "center", gap: 4 }}>⚠ {liveErrors.name}</div>}
        </div>

        {/* ТЕЛЕФОН */}
        <div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>📱</span>
            <input
              type="tel"
              placeholder="+996 (700) 000-000"
              value={phone}
              onChange={e => handlePhoneChange(e.target.value)}
              onBlur={() => touch("phone")}
              style={inputStyle("phone")}
            />
            {touched.phone && !liveErrors.phone && phone && (
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#22c55e", fontSize: 16 }}>✓</span>
            )}
          </div>
          {liveErrors.phone
            ? <div style={{ color: "#f87171", fontSize: 11, marginTop: 5, paddingLeft: 4 }}>⚠ {liveErrors.phone}</div>
            : touched.phone && !liveErrors.phone && phone && <div style={{ color: "#22c55e", fontSize: 11, marginTop: 5, paddingLeft: 4 }}>✓ Номер корректен</div>
          }
        </div>

        {/* ДАТА */}
        <div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none", zIndex: 1 }}>📅</span>
            <input
              type="date"
              min={getTodayStr()}
              value={date}
              onChange={e => { dispatch(setBookingField("date", e.target.value)); touch("date"); }}
              onBlur={() => touch("date")}
              style={inputStyle("date")}
            />
          </div>
          {liveErrors.date
            ? <div style={{ color: "#f87171", fontSize: 11, marginTop: 5, paddingLeft: 4 }}>⚠ {liveErrors.date}</div>
            : touched.date && !liveErrors.date && date && (
              <div style={{ color: "#22c55e", fontSize: 11, marginTop: 5, paddingLeft: 4 }}>
                ✓ {new Date(date).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            )
          }
          <div style={{ color: "#475569", fontSize: 10, marginTop: 4, paddingLeft: 4 }}>
            📌 Минимальная дата — сегодня ({new Date().toLocaleDateString("ru-RU")})
          </div>
        </div>

        <button
          onClick={handleSubmit}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px #6366f177"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px #6366f155"; }}
          style={{ marginTop: 4, background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", border: "none", borderRadius: 14, padding: "15px 0", fontWeight: 900, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 20px #6366f155", transition: "all 0.2s", letterSpacing: 0.3 }}
        >
          🚀 Забронировать
        </button>
      </div>
    </>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(rootReducer, initialState);
  const filtered = selectFiltered(state);

  const FILTERS = [
    { key: "all", label: "🌐 Все" },
    { key: "console", label: "🎮 Консоли" },
    { key: "vr", label: "🥽 VR" },
    { key: "game", label: "💿 Игры" },
    { key: "accessory", label: "🎲 Аксессуары" },
  ];

  return (
    <div style={{ minHeight: "100vh", width: "100vw", maxWidth: "100vw", background: "#020617", color: "#fff", fontFamily: "'Segoe UI', system-ui, sans-serif", overflowX: "hidden" }}>

      {/* HEADER */}
      <header style={{ width: "100%", background: "rgba(2,6,23,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid #1e293b", padding: "0 48px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", borderRadius: 12, padding: "8px 13px", fontWeight: 900, fontSize: 16, boxShadow: "0 4px 16px #6366f155" }}>GR</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>GameRent Hub</div>
            <div style={{ color: "#475569", fontSize: 11 }}>Аренда игровых девайсов · Бишкек 🇰🇬</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ color: "#475569", fontSize: 13 }}>📍 <span style={{ color: "#94a3b8" }}>Бишкек</span> · 💰 <span style={{ color: "#4ade80", fontWeight: 700 }}>Сом (KGS)</span></div>
          <div style={{ background: state.cart.items.length ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "#1e293b", color: state.cart.items.length ? "#fff" : "#475569", borderRadius: 12, padding: "8px 20px", fontWeight: 700, fontSize: 14, transition: "all 0.3s" }}>
            🛒 {state.cart.items.length} товаров
          </div>
        </div>
      </header>

      {/* HERO */}
      <div style={{ width: "100%", padding: "64px 48px 40px", textAlign: "center", background: "radial-gradient(ellipse 100% 60% at 50% 0%,#6366f10e,transparent 70%)", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, left: "10%", width: 400, height: 400, borderRadius: "50%", background: "#6366f108", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #6366f133", background: "#6366f10a", borderRadius: 100, padding: "6px 20px", color: "#818cf8", fontSize: 12, fontWeight: 700, marginBottom: 22, letterSpacing: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px #4ade80" }} />
          PS5 · XBOX · VR · NINTENDO · ИГРЫ
        </div>
        <h1 style={{ fontSize: "clamp(34px,5vw,62px)", fontWeight: 900, margin: "0 0 16px", background: "linear-gradient(135deg,#f8fafc 0%,#818cf8 55%,#3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -3, lineHeight: 1.05 }}>
          Арендуй топовые<br />игровые устройства
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>
          Бронирование онлайн · Доставка по Бишкеку · от <strong style={{ color: "#818cf8" }}>100 сом/день</strong>
        </p>
      </div>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", padding: "0 48px 28px", flexWrap: "wrap", boxSizing: "border-box" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => dispatch(setFilter(f.key))} style={{ background: state.inventory.filter === f.key ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "#0f172a", color: state.inventory.filter === f.key ? "#fff" : "#64748b", border: `1px solid ${state.inventory.filter === f.key ? "transparent" : "#1e293b"}`, borderRadius: 100, padding: "9px 24px", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 28, padding: "0 48px 60px", width: "100%", boxSizing: "border-box", alignItems: "start" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
          {filtered.map(item => <ProductCard key={item.id} item={item} inCart={selectInCart(state, item.id)} dispatch={dispatch} />)}
        </div>

        <div style={{ background: "linear-gradient(145deg,#080f20,#060c18)", border: "1px solid #1e293b", borderRadius: 24, padding: 26, position: "sticky", top: 80, boxShadow: "0 8px 48px #00000066" }}>
          <CartPanel state={state} dispatch={dispatch} />
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #0f172a", padding: "28px 48px", boxSizing: "border-box", background: "linear-gradient(180deg,transparent,#020617)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", borderRadius: 10, padding: "6px 11px", fontWeight: 900, fontSize: 14 }}>GR</div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>GameRent Hub</div>
              <div style={{ color: "#334155", fontSize: 11 }}>Бишкек, Кыргызстан 🇰🇬</div>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "10px 20px", background: "#0f172a", borderRadius: 12, border: "1px solid #1e293b" }}>
            <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>REDUX ARCHITECTURE</div>
            <code style={{ color: "#818cf8", fontSize: 11, lineHeight: 1.8, display: "block" }}>
              rootReducer = combineReducers({"{"}
              <br />&nbsp;&nbsp;<span style={{ color: "#4ade80" }}>inventoryReducer</span>,
              <br />&nbsp;&nbsp;<span style={{ color: "#f59e0b" }}>cartReducer</span>,
              <br />&nbsp;&nbsp;<span style={{ color: "#f87171" }}>bookingReducer</span>
              <br />{"}"})
            </code>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#334155", fontSize: 12 }}>💳 Принимаем оплату</div>
            <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 14 }}>Наличные · Mbank · Optima</div>
            <div style={{ color: "#334155", fontSize: 11, marginTop: 4 }}>📞 +996 (700) 000-000</div>
          </div>
        </div>
      </footer>

      <DevTools state={state} />
    </div>
  );
}