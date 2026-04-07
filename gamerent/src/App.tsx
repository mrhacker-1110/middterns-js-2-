import { useState, useReducer, useCallback, useMemo } from "react";

// ============================================================
// useSelector — кастомный хук (имитация Redux useSelector)
// ============================================================
function useSelector(state, selector) {
  return useMemo(() => selector(state), [state, selector]);
}

// ============================================================
// MIDDLEWARE SYSTEM
// ============================================================
const loggerMiddleware = (action, prevState) => {
  console.group(`%c ⚡ ACTION: ${action.type}`, "color:#818cf8;font-weight:bold");
  console.log("%cPayload:", "color:#4ade80", action.payload);
  console.log("%cPrev State:", "color:#f59e0b", prevState);
  console.groupEnd();
};

const authMiddleware = (action, state) => {
  const protectedActions = ["ADD_TO_CART","REMOVE_FROM_CART","SUBMIT_ORDER",
    "ADD_TODO","UPDATE_TODO","DELETE_TODO","TOGGLE_TODO"];
  if (protectedActions.includes(action.type) && !state.auth.user) {
    console.warn("🔒 authMiddleware: Доступ запрещён");
    return false;
  }
  return true;
};

const validationMiddleware = (action) => {
  if (action.type === "REGISTER_USER") {
    const { email, password, username } = action.payload;
    if (!email.includes("@"))  return { blocked: true, error: "Некорректный email" };
    if (password.length < 6)   return { blocked: true, error: "Пароль минимум 6 символов" };
    if (username.length < 2)   return { blocked: true, error: "Имя минимум 2 символа" };
  }
  if (action.type === "ADD_TODO" || action.type === "UPDATE_TODO") {
    const text = action.payload?.text || action.payload?.updates?.text;
    if (text !== undefined && !text.trim()) return { blocked: true, error: "Задача не может быть пустой" };
  }
  return { blocked: false };
};

function makeEnhancedDispatch(rawDispatch, getState) {
  return function enhancedDispatch(action) {
    const validation = validationMiddleware(action);
    if (validation.blocked) return { error: validation.error };
    const currentState = getState();
    const allowed = authMiddleware(action, currentState);
    if (!allowed) return { error: "Требуется авторизация" };
    loggerMiddleware(action, currentState);
    rawDispatch(action);
    return { success: true };
  };
}

// ============================================================
// CONSTANTS
// ============================================================
const ADD_TO_CART="ADD_TO_CART", REMOVE_FROM_CART="REMOVE_FROM_CART",
  SET_RENTAL_DAYS="SET_RENTAL_DAYS", CLEAR_ORDER="CLEAR_ORDER",
  SET_BOOKING_FIELD="SET_BOOKING_FIELD", SUBMIT_ORDER="SUBMIT_ORDER",
  SET_FILTER="SET_FILTER", REGISTER_USER="REGISTER_USER",
  LOGIN_USER="LOGIN_USER", LOGOUT_USER="LOGOUT_USER",
  ADD_TODO="ADD_TODO", UPDATE_TODO="UPDATE_TODO",
  DELETE_TODO="DELETE_TODO", TOGGLE_TODO="TOGGLE_TODO",
  SET_TODO_FILTER="SET_TODO_FILTER", SET_TODO_PRIORITY="SET_TODO_PRIORITY";

// ============================================================
// INVENTORY
// ============================================================
const INVENTORY = [
  {id:1,name:"PlayStation 5",category:"console",pricePerDay:800,emoji:"🎮",badge:"ХИТ",color:"#3b82f6",specs:"825GB SSD · DualSense · 4K HDR"},
  {id:2,name:"Xbox Series X",category:"console",pricePerDay:750,emoji:"🕹️",badge:"NEW",color:"#22c55e",specs:"1TB NVMe · Game Pass · 4K"},
  {id:3,name:"Nintendo Switch OLED",category:"console",pricePerDay:500,emoji:"🎯",badge:null,color:"#ef4444",specs:"7\" OLED · Портативный"},
  {id:4,name:"Meta Quest 3",category:"vr",pricePerDay:1100,emoji:"🥽",badge:"VR",color:"#a855f7",specs:"Mixed Reality · 4K · 128GB"},
  {id:5,name:"PlayStation VR2",category:"vr",pricePerDay:950,emoji:"👓",badge:"VR",color:"#06b6d4",specs:"OLED · Eye Tracking"},
  {id:6,name:"DualSense Pack",category:"accessory",pricePerDay:200,emoji:"🎲",badge:null,color:"#f59e0b",specs:"2 геймпада · 5 игр"},
  {id:7,name:"God of War Ragnarök",category:"game",pricePerDay:150,emoji:"⚔️",badge:"PS5",color:"#3b82f6",specs:"Action-RPG · 2022"},
  {id:8,name:"Spider-Man 2",category:"game",pricePerDay:150,emoji:"🕷️",badge:"PS5",color:"#e11d48",specs:"Open World · 2023"},
  {id:9,name:"FIFA 24",category:"game",pricePerDay:100,emoji:"⚽",badge:null,color:"#22c55e",specs:"Спорт · PS5/Xbox"},
  {id:10,name:"Elden Ring",category:"game",pricePerDay:120,emoji:"💀",badge:null,color:"#d97706",specs:"Souls-like · 2022"},
];

const getTodayStr = () => new Date().toISOString().split("T")[0];

// ============================================================
// INITIAL STATE
// ============================================================
const initialState = {
  auth:      { users:[], user:null, error:null },
  inventory: { items:INVENTORY, filter:"all" },
  cart:      { items:[] },
  booking:   { name:"", phone:"", date:"", success:false },
  todos: {
    items: [
      { id:1, text:"Арендовать PS5 на выходные", completed:false, priority:"high",   createdAt: new Date().toISOString(), userId:null },
      { id:2, text:"Проверить наличие Meta Quest 3", completed:false, priority:"medium", createdAt: new Date().toISOString(), userId:null },
      { id:3, text:"Оплатить аренду через Mbank",  completed:true,  priority:"low",    createdAt: new Date().toISOString(), userId:null },
    ],
    filter: "all",   // all | active | completed
    nextId: 4,
  },
};

// ============================================================
// REDUCERS
// ============================================================
function authReducer(state, action) {
  switch (action.type) {
    case REGISTER_USER: {
      if (state.users.find(u=>u.email===action.payload.email))
        return {...state, error:"Email уже используется"};
      const u = {...action.payload, id:Date.now(), createdAt:new Date().toLocaleDateString("ru-RU")};
      return {...state, users:[...state.users,u], user:u, error:null};
    }
    case LOGIN_USER: {
      const u = state.users.find(x=>x.email===action.payload.email && x.password===action.payload.password);
      return u ? {...state, user:u, error:null} : {...state, error:"Неверный email или пароль"};
    }
    case LOGOUT_USER: return {...state, user:null, error:null};
    default: return state;
  }
}

function todosReducer(state, action) {
  switch (action.type) {
    // CREATE
    case ADD_TODO:
      return {
        ...state,
        items: [...state.items, {
          id: state.nextId,
          text: action.payload.text.trim(),
          completed: false,
          priority: action.payload.priority || "medium",
          createdAt: new Date().toISOString(),
          userId: action.payload.userId,
        }],
        nextId: state.nextId + 1,
      };
    // UPDATE
    case UPDATE_TODO:
      return {
        ...state,
        items: state.items.map(t =>
          t.id === action.payload.id ? {...t, ...action.payload.updates} : t
        ),
      };
    // DELETE
    case DELETE_TODO:
      return {...state, items: state.items.filter(t => t.id !== action.payload)};
    // TOGGLE (UPDATE shortcut)
    case TOGGLE_TODO:
      return {
        ...state,
        items: state.items.map(t =>
          t.id === action.payload ? {...t, completed: !t.completed} : t
        ),
      };
    case SET_TODO_FILTER:
      return {...state, filter: action.payload};
    default: return state;
  }
}

function inventoryReducer(state, action) {
  if (action.type === SET_FILTER) return {...state, filter:action.payload};
  return state;
}
function cartReducer(state, action) {
  switch (action.type) {
    case ADD_TO_CART:
      if (state.items.find(i=>i.id===action.payload.id)) return state;
      return {...state, items:[...state.items,{...action.payload,days:1}]};
    case REMOVE_FROM_CART:
      return {...state, items:state.items.filter(i=>i.id!==action.payload)};
    case SET_RENTAL_DAYS:
      return {...state, items:state.items.map(i=>i.id===action.payload.id?{...i,days:Math.max(1,action.payload.days)}:i)};
    case CLEAR_ORDER: return {...state, items:[]};
    default: return state;
  }
}
function bookingReducer(state, action) {
  switch (action.type) {
    case SET_BOOKING_FIELD: return {...state,[action.payload.field]:action.payload.value};
    case SUBMIT_ORDER: return {...state, success:true};
    case CLEAR_ORDER: return {name:"",phone:"",date:"",success:false};
    default: return state;
  }
}

function rootReducer(state, action) {
  return {
    auth:      authReducer(state.auth, action),
    inventory: inventoryReducer(state.inventory, action),
    cart:      cartReducer(state.cart, action),
    booking:   bookingReducer(state.booking, action),
    todos:     todosReducer(state.todos, action),
  };
}

// ============================================================
// ACTION CREATORS
// ============================================================
const registerUser    = (u,e,p) => ({type:REGISTER_USER, payload:{username:u,email:e,password:p}});
const loginUser       = (e,p)   => ({type:LOGIN_USER,    payload:{email:e,password:p}});
const logoutUser      = ()      => ({type:LOGOUT_USER});
const addToCart       = i       => ({type:ADD_TO_CART,   payload:i});
const removeFromCart  = id      => ({type:REMOVE_FROM_CART,payload:id});
const setRentalDays   = (id,d)  => ({type:SET_RENTAL_DAYS, payload:{id,days:d}});
const clearOrder      = ()      => ({type:CLEAR_ORDER});
const setBookingField = (f,v)   => ({type:SET_BOOKING_FIELD,payload:{field:f,value:v}});
const submitOrder     = ()      => ({type:SUBMIT_ORDER});
const setFilter       = f       => ({type:SET_FILTER, payload:f});
// TODO action creators
const addTodo         = (text,priority,userId) => ({type:ADD_TODO,    payload:{text,priority,userId}});
const updateTodo      = (id,updates)           => ({type:UPDATE_TODO, payload:{id,updates}});
const deleteTodo      = id                     => ({type:DELETE_TODO, payload:id});
const toggleTodo      = id                     => ({type:TOGGLE_TODO, payload:id});
const setTodoFilter   = f                      => ({type:SET_TODO_FILTER, payload:f});

// ============================================================
// SELECTORS (для useSelector)
// ============================================================
const selectors = {
  getUser:          s => s.auth.user,
  getTodosAll:      s => s.todos.items,
  getTodosFilter:   s => s.todos.filter,
  getTodosFiltered: s => {
    const f = s.todos.filter;
    if (f === "active")    return s.todos.items.filter(t=>!t.completed);
    if (f === "completed") return s.todos.items.filter(t=> t.completed);
    return s.todos.items;
  },
  getTodoById:      (s,id) => s.todos.items.find(t=>t.id===id),
  getTodosStats:    s => ({
    total:     s.todos.items.length,
    active:    s.todos.items.filter(t=>!t.completed).length,
    completed: s.todos.items.filter(t=> t.completed).length,
    high:      s.todos.items.filter(t=>t.priority==="high"&&!t.completed).length,
  }),
  getCartCount:     s => s.cart.items.length,
  getCartTotal:     s => s.cart.items.reduce((sum,i)=>sum+i.pricePerDay*i.days,0),
  getFiltered:      s => s.inventory.filter==="all"?s.inventory.items:s.inventory.items.filter(i=>i.category===s.inventory.filter),
  getInCart:        (s,id) => s.cart.items.some(i=>i.id===id),
};

// ============================================================
// HELPERS
// ============================================================
const PRIORITY = {
  high:   { label:"🔴 Высокий", color:"#ef4444", bg:"#ef444415" },
  medium: { label:"🟡 Средний", color:"#f59e0b", bg:"#f59e0b15" },
  low:    { label:"🟢 Низкий",  color:"#22c55e", bg:"#22c55e15" },
};

const fmtDate = iso => new Date(iso).toLocaleDateString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
const getTodayStr2 = () => new Date().toISOString().split("T")[0];

const validateEmail    = v => !v.trim()?"Введите email":!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?"Некорректный email":null;
const validatePassword = v => !v?"Введите пароль":v.length<6?"Минимум 6 символов":!/[0-9]/.test(v)?"Добавьте цифры":null;
const validateUsername = v => !v.trim()?"Введите имя":v.trim().length<2?"Минимум 2 символа":null;
const validateName     = v => !v.trim()?"Введите имя":v.length<2?"Слишком короткое":!/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(v)?"Только буквы":null;
const validatePhone    = v => { const d=v.replace(/\D/g,""); return !v.trim()?"Введите номер":d.length<10?"Слишком короткий":d.length>13?"Слишком длинный":null; };
const validateDate     = v => !v?"Выберите дату":v<getTodayStr2()?"Нельзя прошедшую дату":null;

const formatPhone = raw => {
  const d = raw.replace(/\D/g,"").slice(0,12);
  if (d.startsWith("996")) {
    const r=d.slice(3); let o="+996";
    if(r.length>0) o+=" ("+r.slice(0,3);
    if(r.length>=3) o+=") "+r.slice(3,6);
    if(r.length>=6) o+="-"+r.slice(6,9);
    if(r.length>=9) o+="-"+r.slice(9,11);
    return o;
  }
  return raw.length?"+"+d:"";
};

// ============================================================
// SHARED INPUT
// ============================================================
function Input({icon,type="text",placeholder,value,onChange,onBlur,error,ok,hint,rows}) {
  const [show,setShow]=useState(false);
  const isP=type==="password";
  const base={width:"100%",boxSizing:"border-box",background:error?"#1a0808":ok?"#081a0f":"#0f172a",border:`1.5px solid ${error?"#f87171":ok?"#22c55e":"#2d3f55"}`,color:"#f1f5f9",borderRadius:12,padding:`11px ${isP?"42px":"13px"} 11px ${icon?"38px":"13px"}`,fontSize:13,outline:"none",colorScheme:"dark",transition:"all 0.2s",boxShadow:error?"0 0 0 3px #f8717122":ok?"0 0 0 3px #22c55e22":"none",resize:rows?"vertical":"none"};
  return (
    <div>
      <div style={{position:"relative"}}>
        {icon&&<span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none",zIndex:1}}>{icon}</span>}
        {rows
          ? <textarea value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} rows={rows} style={base}/>
          : <input type={isP?(show?"text":"password"):type} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} style={base}/>
        }
        {isP&&<button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:15,padding:0}}>{show?"🙈":"👁️"}</button>}
        {!isP&&ok&&<span style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",color:"#22c55e",fontSize:15}}>✓</span>}
      </div>
      {error&&<div style={{color:"#f87171",fontSize:11,marginTop:4,paddingLeft:3}}>⚠ {error}</div>}
      {!error&&ok&&hint&&<div style={{color:"#22c55e",fontSize:11,marginTop:4,paddingLeft:3}}>✓ {hint}</div>}
    </div>
  );
}

// ============================================================
// TODO DETAIL MODAL  (GET BY ID)
// ============================================================
function TodoDetail({ todo, onClose, onUpdate, onDelete, onToggle }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const [priority, setPriority] = useState(todo.priority);

  const save = () => {
    if (!text.trim()) return;
    onUpdate(todo.id, { text: text.trim(), priority });
    setEditing(false);
  };

  const p = PRIORITY[todo.priority];

  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"linear-gradient(145deg,#080f20,#060c18)",border:"1px solid #1e293b",borderRadius:24,padding:32,width:"100%",maxWidth:520,boxShadow:"0 32px 80px #000000aa",position:"relative"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div>
            <div style={{color:"#475569",fontSize:11,fontWeight:700,letterSpacing:2,marginBottom:6}}>GET /todos/{todo.id} · DETAIL</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:22}}>📋</span>
              <span style={{color:"#818cf8",fontWeight:800,fontSize:18}}>Задача #{todo.id}</span>
            </div>
          </div>
          <button onClick={onClose} style={{background:"#1e293b",border:"none",color:"#94a3b8",cursor:"pointer",width:32,height:32,borderRadius:8,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        {/* ID badge */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {[["🆔 ID",`#${todo.id}`],["📊 Статус",todo.completed?"✅ Выполнено":"⏳ Активно"],["🎯 Приоритет",PRIORITY[todo.priority].label],["🕐 Создана",fmtDate(todo.createdAt)]].map(([k,v])=>(
            <div key={k} style={{background:"#0f172a",borderRadius:12,padding:"10px 14px",border:"1px solid #1e293b"}}>
              <div style={{color:"#475569",fontSize:10,marginBottom:3}}>{k}</div>
              <div style={{color:"#f1f5f9",fontWeight:600,fontSize:13}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Text */}
        {editing ? (
          <div style={{marginBottom:16,display:"flex",flexDirection:"column",gap:10}}>
            <Input icon="✏️" rows={3} value={text} onChange={e=>setText(e.target.value)} placeholder="Текст задачи"/>
            <div style={{display:"flex",gap:8}}>
              {Object.entries(PRIORITY).map(([k,v])=>(
                <button key={k} onClick={()=>setPriority(k)}
                  style={{flex:1,padding:"8px 0",background:priority===k?v.bg:"#0f172a",border:`1.5px solid ${priority===k?v.color:"#1e293b"}`,borderRadius:10,color:priority===k?v.color:"#475569",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {v.label}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={save} style={{flex:1,background:"linear-gradient(135deg,#6366f1,#3b82f6)",color:"#fff",border:"none",borderRadius:10,padding:"10px 0",fontWeight:700,cursor:"pointer"}}>💾 Сохранить</button>
              <button onClick={()=>setEditing(false)} style={{flex:1,background:"#1e293b",color:"#64748b",border:"1px solid #334155",borderRadius:10,padding:"10px 0",fontWeight:700,cursor:"pointer"}}>Отмена</button>
            </div>
          </div>
        ) : (
          <div style={{background:"#0f172a",borderRadius:14,padding:"16px 18px",marginBottom:20,border:`1px solid ${p.color}33`}}>
            <div style={{color:todo.completed?"#475569":"#f1f5f9",fontSize:15,lineHeight:1.6,textDecoration:todo.completed?"line-through":"none"}}>{todo.text}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onToggle(todo.id)} style={{flex:1,background:todo.completed?"#16213022":"#22c55e18",border:`1px solid ${todo.completed?"#334155":"#22c55e44"}`,color:todo.completed?"#64748b":"#22c55e",borderRadius:12,padding:"11px 0",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            {todo.completed?"↩ Вернуть":"✅ Выполнено"}
          </button>
          {!editing&&(
            <button onClick={()=>setEditing(true)} style={{flex:1,background:"#6366f118",border:"1px solid #6366f144",color:"#818cf8",borderRadius:12,padding:"11px 0",fontWeight:700,fontSize:13,cursor:"pointer"}}>✏️ Изменить</button>
          )}
          <button onClick={()=>{onDelete(todo.id);onClose();}} style={{flex:1,background:"#ef444418",border:"1px solid #ef444433",color:"#f87171",borderRadius:12,padding:"11px 0",fontWeight:700,fontSize:13,cursor:"pointer"}}>🗑 Удалить</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TODO PAGE
// ============================================================
function TodoPage({ state, enhancedDispatch }) {
  // useSelector для каждого нужного куска стейта
  const todos        = useSelector(state, useCallback(selectors.getTodosFiltered, []));
  const allTodos     = useSelector(state, useCallback(selectors.getTodosAll, []));
  const todoFilter   = useSelector(state, useCallback(selectors.getTodosFilter, []));
  const stats        = useSelector(state, useCallback(selectors.getTodosStats, []));
  const user         = useSelector(state, useCallback(selectors.getUser, []));

  const [newText, setNewText]       = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [textError, setTextError]   = useState("");
  const [detailId, setDetailId]     = useState(null); // GET BY ID
  const [editInlineId, setEditInlineId] = useState(null);
  const [editText, setEditText]     = useState("");

  // GET BY ID — найти todo для детального просмотра
  const detailTodo = detailId ? allTodos.find(t => t.id === detailId) : null;

  const handleAdd = () => {
    if (!newText.trim()) { setTextError("Введите текст задачи"); return; }
    setTextError("");
    const result = enhancedDispatch(addTodo(newText, newPriority, user?.id));
    if (result?.error) { setTextError(result.error); return; }
    setNewText("");
    setNewPriority("medium");
  };

  const startEdit = (todo) => {
    setEditInlineId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = (id) => {
    if (!editText.trim()) return;
    enhancedDispatch(updateTodo(id, { text: editText.trim() }));
    setEditInlineId(null);
  };

  const FILTERS = [
    {key:"all",label:`Все (${stats.total})`},
    {key:"active",label:`Активные (${stats.active})`},
    {key:"completed",label:`Выполненные (${stats.completed})`},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#020617",color:"#fff",fontFamily:"'Segoe UI',system-ui,sans-serif",padding:"0 0 80px"}}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#6366f108,#a855f708)",borderBottom:"1px solid #1e293b",padding:"32px 48px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:"10%",width:300,height:300,borderRadius:"50%",background:"#6366f10a",filter:"blur(60px)",pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,border:"1px solid #6366f133",background:"#6366f10a",borderRadius:100,padding:"5px 16px",color:"#818cf8",fontSize:11,fontWeight:700,marginBottom:16,letterSpacing:2}}>
            useSelector · CRUD · GET BY ID
          </div>
          <h2 style={{fontSize:"clamp(24px,4vw,40px)",fontWeight:900,margin:"0 0 8px",background:"linear-gradient(135deg,#f8fafc,#818cf8,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-2}}>
            📋 Todo List
          </h2>
          <p style={{color:"#64748b",margin:0,fontSize:14}}>Управление задачами с полным CRUD + детальный просмотр по ID</p>
        </div>

        {/* Stats */}
        <div style={{display:"flex",gap:12,marginTop:24,flexWrap:"wrap"}}>
          {[
            {label:"Всего",value:stats.total,color:"#818cf8",bg:"#6366f115"},
            {label:"Активных",value:stats.active,color:"#06b6d4",bg:"#06b6d415"},
            {label:"Выполнено",value:stats.completed,color:"#22c55e",bg:"#22c55e15"},
            {label:"Срочных 🔴",value:stats.high,color:"#ef4444",bg:"#ef444415"},
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,border:`1px solid ${s.color}33`,borderRadius:14,padding:"10px 20px",textAlign:"center",minWidth:90}}>
              <div style={{color:s.color,fontWeight:900,fontSize:22}}>{s.value}</div>
              <div style={{color:"#64748b",fontSize:11,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"28px 48px",maxWidth:900,margin:"0 auto"}}>

        {/* CREATE */}
        <div style={{background:"linear-gradient(145deg,#080f20,#060c18)",border:"1px solid #1e293b",borderRadius:20,padding:24,marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <span style={{background:"#22c55e22",color:"#22c55e",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:20,letterSpacing:1.5}}>CREATE</span>
            <span style={{color:"#f1f5f9",fontWeight:700,fontSize:15}}>Новая задача</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Input icon="✏️" placeholder="Введите задачу..." value={newText}
              onChange={e=>{setNewText(e.target.value);setTextError("");}}
              error={textError} ok={newText.length>2&&!textError}/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {Object.entries(PRIORITY).map(([k,v])=>(
                <button key={k} onClick={()=>setNewPriority(k)}
                  style={{flex:1,minWidth:100,padding:"9px 0",background:newPriority===k?v.bg:"#0f172a",border:`1.5px solid ${newPriority===k?v.color:"#1e293b"}`,borderRadius:10,color:newPriority===k?v.color:"#475569",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
                  {v.label}
                </button>
              ))}
            </div>
            <button onClick={handleAdd}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
              style={{background:"linear-gradient(135deg,#6366f1,#3b82f6)",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 4px 20px #6366f144",transition:"all 0.2s"}}>
              + Добавить задачу
            </button>
          </div>
        </div>

        {/* FILTERS + READ */}
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {FILTERS.map(f=>(
            <button key={f.key} onClick={()=>enhancedDispatch(setTodoFilter(f.key))}
              style={{padding:"8px 20px",background:todoFilter===f.key?"linear-gradient(135deg,#6366f1,#3b82f6)":"#0f172a",color:todoFilter===f.key?"#fff":"#64748b",border:`1px solid ${todoFilter===f.key?"transparent":"#1e293b"}`,borderRadius:100,fontWeight:600,fontSize:12,cursor:"pointer",transition:"all 0.2s"}}>
              {f.label}
            </button>
          ))}
        </div>

        {/* LIST — READ */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {todos.length === 0 && (
            <div style={{textAlign:"center",padding:"48px 0",color:"#334155",border:"1px dashed #1e293b",borderRadius:16}}>
              <div style={{fontSize:40,marginBottom:12,opacity:0.3}}>📋</div>
              <div>Задач нет — добавьте первую!</div>
            </div>
          )}

          {todos.map(todo => {
            const p = PRIORITY[todo.priority];
            const isEditingThis = editInlineId === todo.id;
            return (
              <div key={todo.id}
                style={{background:"linear-gradient(145deg,#0f172a,#0a1628)",border:`1px solid ${todo.completed?"#1e293b":p.color+"33"}`,borderRadius:16,padding:"16px 18px",display:"flex",alignItems:"flex-start",gap:14,transition:"all 0.2s",opacity:todo.completed?0.7:1}}>

                {/* Checkbox */}
                <button onClick={()=>enhancedDispatch(toggleTodo(todo.id))}
                  style={{width:24,height:24,borderRadius:7,border:`2px solid ${todo.completed?"#22c55e":p.color}`,background:todo.completed?"#22c55e":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1,transition:"all 0.2s"}}>
                  {todo.completed&&<span style={{color:"#fff",fontSize:13}}>✓</span>}
                </button>

                {/* Content */}
                <div style={{flex:1,minWidth:0}}>
                  {isEditingThis ? (
                    <div style={{display:"flex",gap:8}}>
                      <input value={editText} onChange={e=>setEditText(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter")saveEdit(todo.id);if(e.key==="Escape")setEditInlineId(null);}}
                        autoFocus
                        style={{flex:1,background:"#1e293b",border:"1px solid #6366f1",color:"#f1f5f9",borderRadius:8,padding:"6px 10px",fontSize:13,outline:"none"}}/>
                      <button onClick={()=>saveEdit(todo.id)} style={{background:"#22c55e22",border:"1px solid #22c55e44",color:"#22c55e",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:12}}>✓</button>
                      <button onClick={()=>setEditInlineId(null)} style={{background:"#334155",border:"none",color:"#94a3b8",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  ) : (
                    <div style={{color:todo.completed?"#475569":"#f1f5f9",fontSize:14,fontWeight:500,textDecoration:todo.completed?"line-through":"none",lineHeight:1.5,marginBottom:6}}>{todo.text}</div>
                  )}
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <span style={{background:p.bg,color:p.color,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{p.label}</span>
                    <span style={{color:"#334155",fontSize:10}}>#{todo.id}</span>
                    <span style={{color:"#334155",fontSize:10}}>{fmtDate(todo.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  {/* GET BY ID — детальный просмотр */}
                  <button onClick={()=>setDetailId(todo.id)}
                    title="Детальный просмотр (GET by ID)"
                    style={{background:"#6366f118",border:"1px solid #6366f133",color:"#818cf8",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    🔍
                  </button>
                  {/* UPDATE inline */}
                  {!isEditingThis&&(
                    <button onClick={()=>startEdit(todo)}
                      title="Редактировать (UPDATE)"
                      style={{background:"#f59e0b18",border:"1px solid #f59e0b33",color:"#f59e0b",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      ✏️
                    </button>
                  )}
                  {/* DELETE */}
                  <button onClick={()=>enhancedDispatch(deleteTodo(todo.id))}
                    title="Удалить (DELETE)"
                    style={{background:"#ef444418",border:"1px solid #ef444433",color:"#f87171",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* useSelector info */}
        <div style={{marginTop:28,background:"#0f172a",borderRadius:16,padding:"16px 20px",border:"1px solid #1e293b"}}>
          <div style={{color:"#475569",fontSize:10,fontWeight:700,letterSpacing:2,marginBottom:10}}>useSelector — АКТИВНЫЕ ДАННЫЕ</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
            {[
              ["selectTodosFiltered", `${todos.length} задач`],
              ["selectTodosStats",    `${stats.active} активных`],
              ["selectUser",         user?.username||"—"],
              ["selectTodoFilter",   todoFilter],
            ].map(([sel,val])=>(
              <div key={sel} style={{background:"#080f20",borderRadius:10,padding:"8px 12px",border:"1px solid #1e293b"}}>
                <div style={{color:"#4ade80",fontSize:10,fontFamily:"monospace",marginBottom:2}}>{sel}(state)</div>
                <div style={{color:"#f1f5f9",fontWeight:700,fontSize:13}}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAIL MODAL — GET BY ID */}
      {detailTodo && (
        <TodoDetail
          todo={detailTodo}
          onClose={()=>setDetailId(null)}
          onUpdate={(id,updates)=>enhancedDispatch(updateTodo(id,updates))}
          onDelete={id=>enhancedDispatch(deleteTodo(id))}
          onToggle={id=>enhancedDispatch(toggleTodo(id))}
        />
      )}
    </div>
  );
}

// ============================================================
// AUTH PAGE
// ============================================================
function AuthPage({ state, enhancedDispatch }) {
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({username:"",email:"",password:"",confirm:""});
  const [touched,setTouched]=useState({});
  const [authError,setAuthError]=useState("");
  const set=(f,v)=>setForm(p=>({...p,[f]:v}));
  const touch=f=>setTouched(p=>({...p,[f]:true}));
  const errors={
    username:touched.username?validateUsername(form.username):null,
    email:   touched.email?validateEmail(form.email):null,
    password:touched.password?validatePassword(form.password):null,
    confirm: touched.confirm?(form.confirm!==form.password?"Пароли не совпадают":null):null,
  };
  const handleSubmit=()=>{
    setAuthError("");
    if(mode==="register"){
      setTouched({username:true,email:true,password:true,confirm:true});
      if(Object.values(errors).some(Boolean)||!form.username||!form.email||!form.password||form.password!==form.confirm)return;
      const r=enhancedDispatch(registerUser(form.username,form.email,form.password));
      if(r?.error)setAuthError(r.error);
      else if(state.auth.error)setAuthError(state.auth.error);
    }else{
      setTouched({email:true,password:true});
      if(!form.email||!form.password)return;
      const r=enhancedDispatch(loginUser(form.email,form.password));
      if(r?.error||state.auth.error)setAuthError("Неверный email или пароль");
    }
  };
  return(
    <div style={{background:"#020617",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{position:"fixed",top:"20%",left:"15%",width:400,height:400,borderRadius:"50%",background:"#6366f108",filter:"blur(80px)",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:420,background:"linear-gradient(145deg,#080f20,#060c18)",border:"1px solid #1e293b",borderRadius:28,padding:"36px 32px",boxShadow:"0 24px 80px #00000088"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{background:"linear-gradient(135deg,#6366f1,#3b82f6)",borderRadius:14,padding:"10px 14px",fontWeight:900,fontSize:20}}>GR</div>
            <div style={{textAlign:"left"}}>
              <div style={{fontWeight:900,fontSize:18,color:"#f1f5f9"}}>GameRent Hub</div>
              <div style={{color:"#475569",fontSize:11}}>Бишкек 🇰🇬</div>
            </div>
          </div>
          <div style={{color:"#64748b",fontSize:13}}>{mode==="login"?"Войдите чтобы арендовать":"Создайте аккаунт бесплатно"}</div>
        </div>
        <div style={{display:"flex",background:"#0f172a",borderRadius:12,padding:4,marginBottom:24,border:"1px solid #1e293b"}}>
          {[["login","🔑 Вход"],["register","📝 Регистрация"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setAuthError("");setTouched({});}}
              style={{flex:1,padding:"9px 0",background:mode===m?"linear-gradient(135deg,#6366f1,#3b82f6)":"none",color:mode===m?"#fff":"#64748b",border:"none",borderRadius:9,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all 0.2s"}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {mode==="register"&&<Input icon="👤" placeholder="Имя пользователя" value={form.username} onChange={e=>set("username",e.target.value)} onBlur={()=>touch("username")} error={errors.username} ok={touched.username&&!errors.username&&!!form.username} hint="Имя корректно"/>}
          <Input icon="📧" type="email" placeholder="Email" value={form.email} onChange={e=>set("email",e.target.value)} onBlur={()=>touch("email")} error={errors.email} ok={touched.email&&!errors.email&&!!form.email} hint="Email корректен"/>
          <Input icon="🔒" type="password" placeholder={mode==="register"?"Придумайте пароль":"Пароль"} value={form.password} onChange={e=>set("password",e.target.value)} onBlur={()=>touch("password")} error={errors.password} ok={touched.password&&!errors.password&&!!form.password}/>
          {mode==="register"&&<Input icon="🔐" type="password" placeholder="Повторите пароль" value={form.confirm} onChange={e=>set("confirm",e.target.value)} onBlur={()=>touch("confirm")} error={errors.confirm} ok={touched.confirm&&!errors.confirm&&form.confirm===form.password} hint="Пароли совпадают"/>}
          {(authError||state.auth.error)&&<div style={{background:"#f8717115",border:"1px solid #f8717144",borderRadius:10,padding:"10px 14px",color:"#f87171",fontSize:12}}>🔒 {authError||state.auth.error}</div>}
          <button onClick={handleSubmit}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
            style={{background:"linear-gradient(135deg,#6366f1,#3b82f6)",color:"#fff",border:"none",borderRadius:12,padding:"14px 0",fontWeight:900,fontSize:15,cursor:"pointer",boxShadow:"0 4px 20px #6366f155",transition:"all 0.2s",marginTop:4}}>
            {mode==="login"?"🚀 Войти":"✨ Создать аккаунт"}
          </button>
          {mode==="login"&&state.auth.users.length>0&&(
            <div style={{background:"#6366f110",border:"1px solid #6366f133",borderRadius:10,padding:"8px 12px",fontSize:11,color:"#818cf8"}}>
              💡 Аккаунты: {state.auth.users.map(u=>u.email).join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MINI COMPONENTS для главной страницы
// ============================================================
function ProductCard({item,inCart,enhancedDispatch}){
  const[hov,setHov]=useState(false);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"linear-gradient(145deg,#0f172a,#0a1628)",border:`1px solid ${hov?item.color+"77":"#1e293b"}`,borderRadius:20,padding:"18px 16px",position:"relative",display:"flex",flexDirection:"column",gap:10,transition:"all 0.3s",transform:hov?"translateY(-4px)":"translateY(0)",boxShadow:hov?`0 16px 32px ${item.color}22`:"none"}}>
      <div style={{position:"absolute",inset:0,borderRadius:20,opacity:hov?1:0,background:`radial-gradient(circle at top right,${item.color}0d,transparent 60%)`,transition:"opacity 0.3s",pointerEvents:"none"}}/>
      {item.badge&&<span style={{position:"absolute",top:10,right:10,background:item.color,color:"#fff",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:20}}>{item.badge}</span>}
      <div style={{fontSize:34}}>{item.emoji}</div>
      <div><div style={{color:"#f1f5f9",fontWeight:700,fontSize:13}}>{item.name}</div><div style={{color:"#475569",fontSize:11,marginTop:2}}>{item.specs}</div></div>
      <div><span style={{color:item.color,fontWeight:900,fontSize:18}}>{item.pricePerDay.toLocaleString()}</span><span style={{color:"#475569",fontSize:11}}> сом/день</span></div>
      <button onClick={()=>!inCart&&enhancedDispatch(addToCart(item))}
        style={{background:inCart?"#1e293b":`linear-gradient(135deg,${item.color},${item.color}bb)`,color:inCart?"#475569":"#fff",border:"none",borderRadius:9,padding:"9px 0",fontWeight:700,fontSize:12,cursor:inCart?"not-allowed":"pointer",marginTop:"auto"}}>
        {inCart?"✓ В корзине":"+ В корзину"}
      </button>
    </div>
  );
}

function CartItemComp({item,enhancedDispatch}){
  return(
    <div style={{background:"linear-gradient(135deg,#1e293b,#162032)",borderRadius:12,padding:"11px 13px",display:"flex",flexDirection:"column",gap:7,border:"1px solid #2d3f55"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:"#e2e8f0",fontSize:12,fontWeight:600}}>{item.emoji} {item.name}</span>
        <button onClick={()=>enhancedDispatch(removeFromCart(item.id))} style={{background:"#334155",border:"none",color:"#94a3b8",cursor:"pointer",width:24,height:24,borderRadius:6,fontSize:12}}>✕</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <span style={{color:"#64748b",fontSize:11}}>Дней:</span>
        <div style={{display:"flex",alignItems:"center",gap:3,background:"#0f172a",borderRadius:7,padding:"2px 5px"}}>
          <button onClick={()=>enhancedDispatch(setRentalDays(item.id,item.days-1))} style={{background:"#334155",border:"none",color:"#fff",width:24,height:24,borderRadius:5,cursor:"pointer",fontWeight:900}}>−</button>
          <span style={{color:"#fff",fontWeight:800,minWidth:22,textAlign:"center",fontSize:13}}>{item.days}</span>
          <button onClick={()=>enhancedDispatch(setRentalDays(item.id,item.days+1))} style={{background:"#334155",border:"none",color:"#fff",width:24,height:24,borderRadius:5,cursor:"pointer",fontWeight:900}}>+</button>
        </div>
        <span style={{marginLeft:"auto",color:item.color,fontWeight:800,fontSize:13}}>{(item.pricePerDay*item.days).toLocaleString()} сом</span>
      </div>
    </div>
  );
}

// ============================================================
// DEVTOOLS
// ============================================================
function DevTools({state}){
  const[open,setOpen]=useState(false);
  const stats=selectors.getTodosStats(state);
  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:12,padding:"10px 16px",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"monospace",boxShadow:"0 4px 20px #7c3aed55"}}>
        ⚡ Redux + Middleware
      </button>
      {open&&(
        <div style={{position:"absolute",bottom:50,right:0,width:380,background:"#0d0d1a",border:"1px solid #7c3aed55",borderRadius:16,padding:16,maxHeight:480,overflowY:"auto",boxShadow:"0 20px 60px #00000099",fontFamily:"monospace"}}>
          <div style={{color:"#a78bfa",fontWeight:700,fontSize:12,marginBottom:8}}>⚡ Global State</div>
          <div style={{marginBottom:10,padding:"8px 10px",background:"#1a1a2e",borderRadius:8,fontSize:10,lineHeight:2}}>
            <span style={{color:"#4ade80"}}>validationMW</span> → <span style={{color:"#f59e0b"}}>authMW</span> → <span style={{color:"#818cf8"}}>loggerMW</span> → <span style={{color:"#f1f5f9"}}>rootReducer</span>
          </div>
          <pre style={{margin:0,fontSize:10,color:"#e2e8f0",whiteSpace:"pre-wrap",lineHeight:1.7}}>
{JSON.stringify({
  "auth.user": state.auth.user?{username:state.auth.user.username}:null,
  "todos.total": stats.total,
  "todos.active": stats.active,
  "todos.completed": stats.completed,
  "todos.filter": state.todos.filter,
  "cart.count": state.cart.items.length,
  "cart.total": `${selectors.getCartTotal(state).toLocaleString()} сом`,
},null,2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [state, rawDispatch] = useReducer(rootReducer, initialState);
  const [page, setPage] = useState("shop"); // "shop" | "todos"

  const enhancedDispatch = useCallback(
    makeEnhancedDispatch(rawDispatch, () => state),
    [state, rawDispatch]
  );

  // useSelector примеры на уровне App
  const user      = useSelector(state, useCallback(selectors.getUser,[]));
  const cartCount = useSelector(state, useCallback(selectors.getCartCount,[]));
  const cartTotal = useSelector(state, useCallback(selectors.getCartTotal,[]));
  const filtered  = useSelector(state, useCallback(selectors.getFiltered,[]));
  const todoStats = useSelector(state, useCallback(selectors.getTodosStats,[]));

  const FILTERS=[{key:"all",label:"🌐 Все"},{key:"console",label:"🎮 Консоли"},{key:"vr",label:"🥽 VR"},{key:"game",label:"💿 Игры"},{key:"accessory",label:"🎲 Акс."}];

  // bookingReducer state shorthand
  const {name,phone,date,success}=state.booking;
  const [errors,setErrors]=useState({});
  const [touched,setTouched]=useState({});
  const touch=f=>setTouched(p=>({...p,[f]:true}));
  const liveErr={name:touched.name?validateName(name):null,phone:touched.phone?validatePhone(phone):null,date:touched.date?validateDate(date):null};
  const iStyle=f=>({width:"100%",boxSizing:"border-box",background:liveErr[f]?"#1a0808":touched[f]&&!liveErr[f]?"#081a0f":"#0f172a",border:`1.5px solid ${liveErr[f]?"#f87171":touched[f]&&!liveErr[f]?"#22c55e":"#2d3f55"}`,color:"#f1f5f9",borderRadius:12,padding:"11px 13px 11px 38px",fontSize:13,outline:"none",colorScheme:"dark",transition:"all 0.2s"});
  const handleBook=()=>{setTouched({name:true,phone:true,date:true});const e={name:validateName(name),phone:validatePhone(phone),date:validateDate(date),cart:state.cart.items.length===0?"Корзина пуста":null};setErrors(e);if(Object.values(e).every(v=>!v))enhancedDispatch(submitOrder());};

  if (!user) return <AuthPage state={state} enhancedDispatch={enhancedDispatch}/>;

  return (
    <div style={{minHeight:"100vh",width:"100vw",maxWidth:"100vw",background:"#020617",color:"#fff",fontFamily:"'Segoe UI',system-ui,sans-serif",overflowX:"hidden"}}>

      {/* HEADER */}
      <header style={{width:"100%",background:"rgba(2,6,23,0.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid #1e293b",padding:"0 48px",height:68,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxSizing:"border-box"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{background:"linear-gradient(135deg,#6366f1,#3b82f6)",borderRadius:12,padding:"7px 12px",fontWeight:900,fontSize:16,boxShadow:"0 4px 16px #6366f155"}}>GR</div>
          <div><div style={{fontWeight:800,fontSize:17,letterSpacing:-0.5}}>GameRent Hub</div><div style={{color:"#475569",fontSize:11}}>Бишкек 🇰🇬</div></div>
        </div>

        {/* NAV */}
        <div style={{display:"flex",gap:6,background:"#0f172a",borderRadius:12,padding:4,border:"1px solid #1e293b"}}>
          {[["shop","🛍 Магазин"],["todos","📋 Todo"]].map(([p,l])=>(
            <button key={p} onClick={()=>setPage(p)}
              style={{padding:"8px 18px",background:page===p?"linear-gradient(135deg,#6366f1,#3b82f6)":"none",color:page===p?"#fff":"#64748b",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.2s",position:"relative"}}>
              {l}
              {p==="todos"&&todoStats.active>0&&(
                <span style={{position:"absolute",top:-4,right:-4,background:"#ef4444",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{todoStats.active}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,padding:"6px 12px"}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}}>{user.username[0].toUpperCase()}</div>
            <div><div style={{color:"#f1f5f9",fontSize:12,fontWeight:600}}>{user.username}</div><div style={{color:"#475569",fontSize:9}}>{user.email}</div></div>
          </div>
          <div style={{background:cartCount?"linear-gradient(135deg,#6366f1,#3b82f6)":"#1e293b",color:cartCount?"#fff":"#475569",borderRadius:10,padding:"7px 16px",fontWeight:700,fontSize:13,transition:"all 0.3s"}}>🛒 {cartCount}</div>
          <button onClick={()=>enhancedDispatch(logoutUser())} style={{background:"#1e293b",color:"#94a3b8",border:"1px solid #334155",borderRadius:9,padding:"7px 14px",fontWeight:600,fontSize:12,cursor:"pointer"}}>Выйти →</button>
        </div>
      </header>

      {/* TODO PAGE */}
      {page==="todos" && <TodoPage state={state} enhancedDispatch={enhancedDispatch}/>}

      {/* SHOP PAGE */}
      {page==="shop" && (
        <>
          {/* HERO */}
          <div style={{width:"100%",padding:"56px 48px 36px",textAlign:"center",background:"radial-gradient(ellipse 100% 60% at 50% 0%,#6366f10e,transparent 70%)",boxSizing:"border-box",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-80,left:"10%",width:400,height:400,borderRadius:"50%",background:"#6366f108",filter:"blur(80px)",pointerEvents:"none"}}/>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,border:"1px solid #6366f133",background:"#6366f10a",borderRadius:100,padding:"5px 18px",color:"#818cf8",fontSize:11,fontWeight:700,marginBottom:20,letterSpacing:2}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",display:"inline-block",boxShadow:"0 0 8px #4ade80"}}/>
              Добро пожаловать, {user.username}! 🎮
            </div>
            <h1 style={{fontSize:"clamp(30px,5vw,56px)",fontWeight:900,margin:"0 0 14px",background:"linear-gradient(135deg,#f8fafc 0%,#818cf8 55%,#3b82f6 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-3,lineHeight:1.05}}>
              Арендуй топовые<br/>игровые устройства
            </h1>
            <p style={{color:"#64748b",fontSize:15,margin:0}}>Доставка по Бишкеку · от <strong style={{color:"#818cf8"}}>100 сом/день</strong></p>
          </div>

          {/* FILTERS */}
          <div style={{display:"flex",gap:8,justifyContent:"center",padding:"0 48px 24px",flexWrap:"wrap",boxSizing:"border-box"}}>
            {FILTERS.map(f=>(
              <button key={f.key} onClick={()=>enhancedDispatch(setFilter(f.key))}
                style={{background:state.inventory.filter===f.key?"linear-gradient(135deg,#6366f1,#3b82f6)":"#0f172a",color:state.inventory.filter===f.key?"#fff":"#64748b",border:`1px solid ${state.inventory.filter===f.key?"transparent":"#1e293b"}`,borderRadius:100,padding:"8px 20px",fontWeight:600,fontSize:12,cursor:"pointer",transition:"all 0.2s"}}>
                {f.label}
              </button>
            ))}
          </div>

          {/* MAIN GRID */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:24,padding:"0 48px 60px",width:"100%",boxSizing:"border-box",alignItems:"start"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14}}>
              {filtered.map(item=><ProductCard key={item.id} item={item} inCart={selectors.getInCart(state,item.id)} enhancedDispatch={enhancedDispatch}/>)}
            </div>

            {/* CART */}
            <div style={{background:"linear-gradient(145deg,#080f20,#060c18)",border:"1px solid #1e293b",borderRadius:22,padding:24,position:"sticky",top:80,boxShadow:"0 8px 48px #00000066"}}>
              {success?(
                <div style={{textAlign:"center",padding:"28px 0"}}>
                  <div style={{fontSize:56,marginBottom:12}}>🎉</div>
                  <div style={{color:"#4ade80",fontWeight:900,fontSize:20,marginBottom:10}}>Заказ оформлен!</div>
                  <div style={{color:"#94a3b8",fontSize:13,lineHeight:2.2,marginBottom:20,background:"#0f172a",borderRadius:14,padding:"14px 18px",border:"1px solid #1e293b"}}>
                    👤 <b style={{color:"#f1f5f9"}}>{name}</b><br/>
                    📅 <b style={{color:"#f1f5f9"}}>{new Date(date).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}</b><br/>
                    💰 <b style={{color:"#4ade80",fontSize:18}}>{cartTotal.toLocaleString()} сом</b>
                  </div>
                  <button onClick={()=>enhancedDispatch(clearOrder())} style={{background:"linear-gradient(135deg,#6366f1,#3b82f6)",color:"#fff",border:"none",borderRadius:12,padding:"12px 26px",fontWeight:800,cursor:"pointer",fontSize:14}}>← Новый заказ</button>
                </div>
              ):(
                <>
                  <div style={{fontWeight:800,fontSize:16,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                    🛒 Корзина
                    <span style={{background:cartCount?"#6366f122":"#1e293b",color:cartCount?"#818cf8":"#475569",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:600}}>{cartCount} шт.</span>
                  </div>
                  {cartCount===0?(
                    <div style={{textAlign:"center",color:"#334155",padding:"26px 0",lineHeight:2.5,border:"1px dashed #1e293b",borderRadius:12,marginBottom:14}}>
                      <div style={{fontSize:28,opacity:0.3,marginBottom:4}}>🎮</div>
                      <div style={{fontSize:12}}>Корзина пуста</div>
                    </div>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12,maxHeight:240,overflowY:"auto"}}>
                      {state.cart.items.map(item=><CartItemComp key={item.id} item={item} enhancedDispatch={enhancedDispatch}/>)}
                    </div>
                  )}
                  {errors.cart&&<div style={{color:"#f87171",fontSize:11,marginBottom:8,background:"#f8717110",border:"1px solid #f8717133",borderRadius:8,padding:"8px 12px"}}>⚠️ {errors.cart}</div>}
                  {cartCount>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#6366f110",border:"1px solid #6366f122",borderRadius:12,padding:"12px 16px",marginBottom:16}}>
                    <span style={{color:"#94a3b8",fontWeight:600,fontSize:13}}>Итого:</span>
                    <span style={{color:"#818cf8",fontWeight:900,fontSize:22}}>{cartTotal.toLocaleString()} сом</span>
                  </div>}
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                      <div style={{flex:1,height:1,background:"#1e293b"}}/>
                      <span style={{color:"#6366f1",fontSize:9,fontWeight:800,letterSpacing:2,whiteSpace:"nowrap"}}>ДАННЫЕ ДЛЯ БРОНИРОВАНИЯ</span>
                      <div style={{flex:1,height:1,background:"#1e293b"}}/>
                    </div>
                    {[{f:"name",icon:"👤",ph:"Ваше имя",t:"text",ch:e=>enhancedDispatch(setBookingField("name",e.target.value.replace(/[^а-яёА-ЯЁa-zA-Z\s-]/g,"")))},
                      {f:"phone",icon:"📱",ph:"+996 (700) 000-000",t:"tel",ch:e=>enhancedDispatch(setBookingField("phone",formatPhone(e.target.value)))},
                      {f:"date",icon:"📅",ph:"",t:"date",ch:e=>{enhancedDispatch(setBookingField("date",e.target.value));touch("date");},min:getTodayStr2()}].map(({f,icon,ph,t,ch,min})=>(
                      <div key={f}>
                        <div style={{position:"relative"}}>
                          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,pointerEvents:"none",zIndex:1}}>{icon}</span>
                          <input type={t} placeholder={ph} value={state.booking[f]} onChange={ch} onBlur={()=>touch(f)} min={min} style={iStyle(f)}/>
                          {touched[f]&&!liveErr[f]&&state.booking[f]&&<span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"#22c55e",fontSize:14}}>✓</span>}
                        </div>
                        {liveErr[f]&&<div style={{color:"#f87171",fontSize:10,marginTop:3,paddingLeft:3}}>⚠ {liveErr[f]}</div>}
                        {f==="date"&&!liveErr[f]&&touched[f]&&state.booking[f]&&<div style={{color:"#22c55e",fontSize:10,marginTop:3,paddingLeft:3}}>✓ {new Date(state.booking[f]).toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"})}</div>}
                      </div>
                    ))}
                    <button onClick={handleBook}
                      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
                      style={{marginTop:4,background:"linear-gradient(135deg,#6366f1,#3b82f6)",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",fontWeight:900,fontSize:14,cursor:"pointer",boxShadow:"0 4px 20px #6366f155",transition:"all 0.2s"}}>
                      🚀 Забронировать
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <footer style={{borderTop:"1px solid #0f172a",padding:"24px 48px",boxSizing:"border-box",background:"linear-gradient(180deg,transparent,#020617)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{background:"linear-gradient(135deg,#6366f1,#3b82f6)",borderRadius:9,padding:"5px 10px",fontWeight:900,fontSize:13}}>GR</div>
                <div><div style={{color:"#f1f5f9",fontWeight:700,fontSize:14}}>GameRent Hub</div><div style={{color:"#334155",fontSize:10}}>Бишкек 🇰🇬</div></div>
              </div>
              <div style={{textAlign:"center",padding:"8px 16px",background:"#0f172a",borderRadius:10,border:"1px solid #1e293b"}}>
                <div style={{color:"#475569",fontSize:9,fontWeight:700,letterSpacing:1.5,marginBottom:3}}>MIDDLEWARE CHAIN</div>
                <code style={{color:"#818cf8",fontSize:10}}>
                  <span style={{color:"#4ade80"}}>validationMW</span> → <span style={{color:"#f59e0b"}}>authMW</span> → <span style={{color:"#f87171"}}>loggerMW</span> → <span style={{color:"#818cf8"}}>rootReducer</span>
                </code>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{color:"#4ade80",fontWeight:700,fontSize:13}}>Наличные · Mbank · Optima</div>
                <div style={{color:"#334155",fontSize:10,marginTop:3}}>📞 +996 (700) 000-000</div>
              </div>
            </div>
          </footer>
        </>
      )}

      <DevTools state={state}/>
    </div>
  );
}