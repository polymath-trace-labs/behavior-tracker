import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tmpjvwlivjbtjjqzngba.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcGp2d2xpdmpidGpqcXpuZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTU1NzcsImV4cCI6MjA4OTQzMTU3N30.E99AEV1Jim0DX6jxZTDyQL1u3k2Pj-O2fso3t6a0EII";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MAX_USERS = 10;

const HOME_BEHAVIORS = [
  { id: "follows_first_ask",  label: "Follows instruction on first ask",         icon: "☝️" },
  { id: "completes_task",     label: "Completes assigned task without reminders", icon: "✅" },
  { id: "accepts_no",         label: "Accepts 'No' without major protest",        icon: "🛑" },
  { id: "transitions",        label: "Transitions between activities calmly",     icon: "🔄" },
  { id: "morning_routine",    label: "Completes morning routine independently",   icon: "🌅" },
  { id: "bedtime_routine",    label: "Follows bedtime routine without struggle",  icon: "🌙" },
];

const CLASSROOM_BEHAVIORS = [
  { id: "on_task",            label: "Stays on task during lessons",              icon: "📚" },
  { id: "follows_teacher",    label: "Follows teacher instructions",              icon: "☝️" },
  { id: "peer_interactions",  label: "Appropriate peer interactions",             icon: "🤝" },
  { id: "transitions_class",  label: "Transitions between activities calmly",     icon: "🔄" },
  { id: "accepts_no_class",   label: "Accepts 'No' without major protest",        icon: "🛑" },
];

const SCORE_LABELS = {
  1: { label: "Tough Day",           color: "#ef4444", bg: "#fef2f2", emoji: "😤" },
  2: { label: "Needed a Lot of Help",color: "#f97316", bg: "#fff7ed", emoji: "😕" },
  3: { label: "Some Struggles",      color: "#eab308", bg: "#fefce8", emoji: "😐" },
  4: { label: "Pretty Good",         color: "#22c55e", bg: "#f0fdf4", emoji: "🙂" },
  5: { label: "Nailed It!",          color: "#6366f1", bg: "#eef2ff", emoji: "🌟" },
};

const ROLE_CONFIG = {
  admin:   { label: "Admin",        color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  icon: "👑" },
  parent:  { label: "Parent",       color: "#22c55e", bg: "rgba(34,197,94,0.15)",   icon: "👪" },
  teacher: { label: "Teacher",      color: "#06b6d4", bg: "rgba(6,182,212,0.15)",   icon: "🍎" },
  school:  { label: "School Staff", color: "#6366f1", bg: "rgba(99,102,241,0.15)",  icon: "🏫" },
};

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatDateKey(key) {
  const [y,m,d] = key.split("-");
  const date = new Date(+y,+m-1,+d);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}
function getLast14Days() {
  const days = [];
  for (let i=13;i>=0;i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }
  return days;
}
function avg(scores, behaviors) {
  const vals = behaviors.map(b => scores[b.id]).filter(Boolean);
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
}

const card  = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:16, padding:20 };
const iStyle = { width:"100%", padding:"11px 14px", borderRadius:10, fontSize:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#e2e8f0", fontFamily:"'Georgia',serif", boxSizing:"border-box", outline:"none" };
const mkBtn = (bg="#6366f1") => ({ border:"none", borderRadius:10, cursor:"pointer", fontWeight:"700", fontFamily:"'Georgia',serif", transition:"all 0.15s", background:bg, color:"#fff" });

// ── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [pin, setPin]           = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  const tryLogin = async (p) => {
    if (!username.trim()) { setError("Please enter your username."); setPin(""); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from("app_users").select("*").ilike("username", username.trim()).single();
      if (error || !data) throw new Error("User not found.");
      if (data.pin !== p) throw new Error("Incorrect PIN.");
      const u = { id:data.id, username:data.username, role:data.role };
      sessionStorage.setItem("bt_user", JSON.stringify(u));
      onSuccess(u);
    } catch(e) {
      setShake(true); setError(e.message); setPin("");
      setTimeout(()=>setShake(false),600);
    } finally { setLoading(false); }
  };

  const handleKey = (val) => {
    if (pin.length >= 5) return;
    const next = pin + val;
    setPin(next); setError("");
    if (next.length === 5) setTimeout(()=>tryLogin(next), 200);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Georgia',serif", padding:24 }}>
      <div style={{ width:"100%", maxWidth:360, ...card, padding:"40px 32px", textAlign:"center", boxShadow:"0 25px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ width:64, height:64, borderRadius:18, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, margin:"0 auto 20px" }}>⭐</div>
        <div style={{ fontSize:21, fontWeight:"800", color:"#f1f5f9", marginBottom:4 }}>Behavior Tracker</div>
        <div style={{ fontSize:13, color:"#64748b", marginBottom:28 }}>Sign in to continue</div>

        <input value={username} onChange={e=>{setUsername(e.target.value);setError("");}} placeholder="Username" autoCapitalize="none" style={{ ...iStyle, marginBottom:20, textAlign:"center", fontSize:15, letterSpacing:1 }} />

        <div style={{ fontSize:12, color:"#64748b", marginBottom:10 }}>5-digit PIN</div>
        <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:20, animation:shake?"shake 0.5s ease":"none" }}>
          {[0,1,2,3,4].map(i=>(
            <div key={i} style={{ width:14, height:14, borderRadius:"50%", background:i<pin.length?(error?"#ef4444":"#6366f1"):"rgba(255,255,255,0.15)", border:`2px solid ${i<pin.length?(error?"#ef4444":"#6366f1"):"rgba(255,255,255,0.2)"}`, transition:"all 0.15s", transform:i<pin.length?"scale(1.2)":"scale(1)" }} />
          ))}
        </div>

        {error && <div style={{ fontSize:12, color:"#f87171", marginBottom:14, background:"rgba(239,68,68,0.1)", padding:"6px 12px", borderRadius:8 }}>{error}</div>}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
            <button key={i} onClick={()=>k==="⌫"?setPin(p=>{setError("");return p.slice(0,-1);}):k!==""?handleKey(String(k)):null} disabled={k===""||loading}
              style={{ padding:"16px 0", background:k==="⌫"?"rgba(239,68,68,0.15)":k===""?"transparent":"rgba(255,255,255,0.07)", border:k===""?"none":`1px solid rgba(255,255,255,${k==="⌫"?"0.1":"0.08"})`, borderRadius:10, cursor:k===""?"default":"pointer", fontSize:k==="⌫"?16:18, fontWeight:"700", color:k==="⌫"?"#f87171":"#e2e8f0", fontFamily:"'Georgia',serif" }}
            >{k}</button>
          ))}
        </div>
        {loading && <div style={{ marginTop:16, fontSize:13, color:"#94a3b8" }}>Signing in...</div>}
        <div style={{ marginTop:20, fontSize:11, color:"#334155" }}>Contact your administrator if you need access</div>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

// ── ADMIN PANEL ──────────────────────────────────────────────
function AdminPanel({ currentUser, onBack }) {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newPin, setNewPin]         = useState("");
  const [newRole, setNewRole]       = useState("parent");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(()=>{ loadUsers(); },[]);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_users").select("*").order("created_at",{ascending:true});
    setUsers(data||[]); setLoading(false);
  };

  const addUser = async () => {
    setError(""); setSuccess("");
    if (!newUsername.trim()) { setError("Username is required."); return; }
    if (!/^\d{5}$/.test(newPin)) { setError("PIN must be exactly 5 digits."); return; }
    if (users.length >= MAX_USERS) { setError(`Maximum of ${MAX_USERS} users allowed.`); return; }
    if (users.find(u=>u.username.toLowerCase()===newUsername.trim().toLowerCase())) { setError("That username is already taken."); return; }
    setSaving(true);
    const { error } = await supabase.from("app_users").insert({ username:newUsername.trim(), pin:newPin, role:newRole });
    if (error) { setError("Failed to create user."); }
    else { setSuccess(`User "${newUsername.trim()}" created!`); setNewUsername(""); setNewPin(""); setNewRole("parent"); loadUsers(); }
    setSaving(false);
  };

  const deleteUser = async (id, uname) => {
    if (uname === currentUser.username) { setError("You cannot delete your own account."); return; }
    await supabase.from("app_users").delete().eq("id",id);
    setDeleteConfirm(null); setSuccess(`User "${uname}" removed.`); loadUsers();
  };

  const updateRole = async (id, role) => {
    await supabase.from("app_users").update({role}).eq("id",id); loadUsers();
  };

  const resetPin = async (id, uname) => {
    const newp = prompt(`Enter new 5-digit PIN for "${uname}":`);
    if (!newp) return;
    if (!/^\d{5}$/.test(newp)) { setError("PIN must be exactly 5 digits."); return; }
    await supabase.from("app_users").update({pin:newp}).eq("id",id);
    setSuccess(`PIN updated for "${uname}".`);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", fontFamily:"'Georgia',serif", color:"#e2e8f0" }}>
      <div style={{ background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"18px 24px" }}>
        <div style={{ maxWidth:720, margin:"0 auto", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onBack} style={{ ...mkBtn("#334155"), padding:"8px 14px", fontSize:13 }}>← Back</button>
          <div style={{ fontSize:18, fontWeight:"800", color:"#f1f5f9" }}>👑 User Management</div>
          <div style={{ marginLeft:"auto", fontSize:12, color:"#64748b" }}>{users.length}/{MAX_USERS} users</div>
        </div>
      </div>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"24px 16px", display:"flex", flexDirection:"column", gap:20 }}>
        {error   && <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, fontSize:13, color:"#fca5a5" }}>{error}</div>}
        {success && <div style={{ padding:"10px 14px", background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:10, fontSize:13, color:"#86efac" }}>{success}</div>}

        <div style={card}>
          <div style={{ fontSize:15, fontWeight:"700", color:"#e2e8f0", marginBottom:16 }}>➕ Add New User</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="Username" style={iStyle} />
            <input value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,"").slice(0,5))} placeholder="5-digit PIN" style={iStyle} maxLength={5} />
            <select value={newRole} onChange={e=>setNewRole(e.target.value)} style={iStyle}>
              <option value="parent">👪 Parent — full home access</option>
              <option value="teacher">🍎 Teacher — full classroom access</option>
              <option value="school">🏫 School Staff — read only</option>
              <option value="admin">👑 Admin — manage users</option>
            </select>
            <button onClick={addUser} disabled={saving||users.length>=MAX_USERS} style={{ ...mkBtn(), padding:"12px", fontSize:14, opacity:users.length>=MAX_USERS?0.5:1 }}>
              {saving?"Creating...":users.length>=MAX_USERS?`Max ${MAX_USERS} users reached`:"Create User"}
            </button>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize:15, fontWeight:"700", color:"#e2e8f0", marginBottom:16 }}>👥 Current Users</div>
          {loading ? <div style={{ textAlign:"center", color:"#475569", padding:20 }}>Loading...</div> : users.length===0 ? <div style={{ textAlign:"center", color:"#475569", padding:20, fontSize:13 }}>No users yet.</div> : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {users.map(u=>{
                const rc = ROLE_CONFIG[u.role]||ROLE_CONFIG.school;
                const isMe = u.username===currentUser.username;
                return (
                  <div key={u.id} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:rc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{rc.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:"700", color:"#f1f5f9" }}>{u.username} {isMe&&<span style={{ fontSize:10, color:"#64748b" }}>(you)</span>}</div>
                        <div style={{ fontSize:11, color:rc.color, fontWeight:"600" }}>{rc.label}</div>
                      </div>
                      {!isMe&&(
                        <select value={u.role} onChange={e=>updateRole(u.id,e.target.value)} style={{ padding:"5px 8px", borderRadius:8, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"#e2e8f0", fontSize:12, cursor:"pointer", fontFamily:"'Georgia',serif" }}>
                          <option value="parent">👪 Parent</option>
                          <option value="teacher">🍎 Teacher</option>
                          <option value="school">🏫 School</option>
                          <option value="admin">👑 Admin</option>
                        </select>
                      )}
                      <button onClick={()=>resetPin(u.id,u.username)} style={{ ...mkBtn("#334155"), padding:"6px 10px", fontSize:11 }}>Reset PIN</button>
                      {!isMe&&(
                        deleteConfirm===u.id?(
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={()=>deleteUser(u.id,u.username)} style={{ ...mkBtn("#ef4444"), padding:"6px 10px", fontSize:11 }}>Confirm</button>
                            <button onClick={()=>setDeleteConfirm(null)} style={{ ...mkBtn("#334155"), padding:"6px 10px", fontSize:11 }}>Cancel</button>
                          </div>
                        ):(
                          <button onClick={()=>{setError("");setDeleteConfirm(u.id);}} style={{ ...mkBtn("#ef4444"), padding:"6px 10px", fontSize:11 }}>Remove</button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]     = useState(()=>{ try { return JSON.parse(sessionStorage.getItem("bt_user")); } catch { return null; } });
  const [screen, setScreen] = useState("tracker");
  const handleLogin  = (u) => { setUser(u); setScreen("tracker"); };
  const handleLogout = ()  => { sessionStorage.removeItem("bt_user"); setUser(null); setScreen("tracker"); };
  if (!user) return <LoginScreen onSuccess={handleLogin} />;
  if (screen==="admin") return <AdminPanel currentUser={user} onBack={()=>setScreen("tracker")} />;
  return <BehaviorTracker user={user} onLogout={handleLogout} onAdmin={user.role==="admin"?()=>setScreen("admin"):null} />;
}

// ── MAIN TRACKER ─────────────────────────────────────────────
function BehaviorTracker({ user, onLogout, onAdmin }) {
  const isSchool  = user.role === "school";
  const isTeacher = user.role === "teacher";
  const isParent  = user.role === "parent" || user.role === "admin";
  const BEHAVIORS = isTeacher ? CLASSROOM_BEHAVIORS : HOME_BEHAVIORS;
  const TABLE     = isTeacher ? "classroom_entries" : "behavior_entries";

  const defaultView = isSchool ? "report" : "today";
  const [view, setView]               = useState(defaultView);
  const [entries, setEntries]         = useState({});
  const [todayScores, setTodayScores] = useState({});
  const [todayNote, setTodayNote]     = useState("");
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [selectedBehavior, setSelectedBehavior] = useState(BEHAVIORS[0].id);
  const [error, setError]             = useState(null);
  const [editingDay, setEditingDay]   = useState(null);
  const [deleteConfirmDay, setDeleteConfirmDay] = useState(null);

  const todayKey = getTodayKey();
  const today    = new Date();
  const dayName  = DAYS[today.getDay()];
  const rc       = ROLE_CONFIG[user.role]||ROLE_CONFIG.school;

  useEffect(()=>{ loadEntries(); },[]);

  const loadEntries = async () => {
    setLoading(true); setError(null);
    try {
      // Load both tables for school/admin
      const tables = (isSchool || user.role==="admin") ? ["behavior_entries","classroom_entries"] : [TABLE];
      const results = await Promise.all(tables.map(t=>supabase.from(t).select("*").order("entry_date",{ascending:false}).limit(30)));
      const map = {};
      results.forEach((res,i)=>{
        const tbl = tables[i];
        (res.data||[]).forEach(row=>{
          if (!map[row.entry_date]) map[row.entry_date] = { home:{}, classroom:{} };
          if (tbl==="behavior_entries") { map[row.entry_date].home = { scores:row.scores, note:row.note }; }
          else { map[row.entry_date].classroom = { scores:row.scores, note:row.note }; }
        });
      });
      // For parent/teacher, simpler map
      if (!isSchool && user.role!=="admin") {
        const simple = {};
        (results[0].data||[]).forEach(row=>{ simple[row.entry_date]={ scores:row.scores, note:row.note }; });
        setEntries(simple);
        if (simple[todayKey]) { setTodayScores(simple[todayKey].scores||{}); setTodayNote(simple[todayKey].note||""); }
      } else {
        setEntries(map);
      }
    } catch { setError("Could not connect to database."); }
    finally { setLoading(false); }
  };

  const saveToday = async () => {
    setSaving(true); setError(null);
    try {
      const { error } = await supabase.from(TABLE).upsert({ entry_date:todayKey, scores:todayScores, note:todayNote, updated_at:new Date().toISOString() },{ onConflict:"entry_date" });
      if (error) throw error;
      setEntries(prev=>({ ...prev, [todayKey]:{ scores:todayScores, note:todayNote } }));
      setSaved(true); setTimeout(()=>setSaved(false),2500);
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  const deleteDay = async (dateKey) => {
    try {
      await supabase.from(TABLE).delete().eq("entry_date", dateKey);
      setEntries(prev=>{ const n={...prev}; delete n[dateKey]; return n; });
      if (dateKey===todayKey) { setTodayScores({}); setTodayNote(""); }
      setDeleteConfirmDay(null);
    } catch { setError("Failed to delete entry."); }
  };

  const startEdit = (dateKey) => {
    const entry = entries[dateKey];
    if (!entry) return;
    setTodayScores(entry.scores||{});
    setTodayNote(entry.note||"");
    setEditingDay(dateKey);
    setView("today");
  };

  const saveEdit = async () => {
    if (!editingDay) return;
    setSaving(true);
    try {
      await supabase.from(TABLE).upsert({ entry_date:editingDay, scores:todayScores, note:todayNote, updated_at:new Date().toISOString() },{ onConflict:"entry_date" });
      setEntries(prev=>({ ...prev, [editingDay]:{ scores:todayScores, note:todayNote } }));
      setEditingDay(null); setSaved(true); setTimeout(()=>setSaved(false),2500);
    } catch { setError("Failed to save edit."); }
    finally { setSaving(false); }
  };

  // Chart data — for school/admin use classroom table; for teacher use classroom; for parent use home
  const getChartScores = (key) => {
    if (isSchool || user.role==="admin") return entries[key]?.classroom?.scores||null;
    return entries[key]?.scores||null;
  };

  const last14    = getLast14Days();
  const chartData = last14.map(key=>{
    const scores = getChartScores(key);
    if (!scores) return { key, avg:null, scores:{} };
    const a = avg(scores, isTeacher||isSchool||user.role==="admin" ? CLASSROOM_BEHAVIORS : HOME_BEHAVIORS);
    return { key, avg:a, scores };
  });
  const behaviorTrend = last14.map(key=>({ key, score: getChartScores(key)?.[selectedBehavior]||null }));
  const hasData = chartData.some(d=>d.avg!==null);
  const allScored = BEHAVIORS.every(b=>todayScores[b.id]);
  const todayAvg  = allScored ? (Object.values(todayScores).reduce((a,b)=>a+b,0)/BEHAVIORS.length).toFixed(1) : null;

  const REPORT_BEHAVIORS = CLASSROOM_BEHAVIORS;

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"'Georgia',serif" }}>
      <div style={{ fontSize:48 }}>⭐</div>
      <div style={{ color:"#94a3b8", fontSize:16 }}>Loading tracker...</div>
    </div>
  );

  const tabs = [
    { id:"today",  label:"📋 Today",          hide: isSchool },
    { id:"trends", label:"📈 Trends" },
    { id:"report", label:"🏫 School Report" },
  ].filter(t=>!t.hide);

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", fontFamily:"'Georgia',serif", color:"#e2e8f0" }}>
      {/* Header */}
      <div style={{ background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"18px 24px 0", backdropFilter:"blur(10px)" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⭐</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:19, fontWeight:"bold", color:"#f1f5f9" }}>Daily Behavior Tracker</div>
              <div style={{ fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                {dayName}, {MONTHS[today.getMonth()]} {today.getDate()}
                <span style={{ padding:"1px 7px", borderRadius:20, fontSize:10, fontWeight:"700", background:rc.bg, color:rc.color }}>{rc.icon} {rc.label}</span>
                <span style={{ color:"#475569" }}>· {user.username}</span>
                {editingDay && <span style={{ color:"#f59e0b", fontWeight:"700" }}>· Editing {formatDateKey(editingDay)}</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={loadEntries} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:8, padding:"6px 10px", color:"#94a3b8", cursor:"pointer", fontSize:16 }}>🔄</button>
              {onAdmin && <button onClick={onAdmin} style={{ background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:8, padding:"6px 10px", color:"#fbbf24", cursor:"pointer", fontSize:13, fontWeight:"700" }}>👑</button>}
              <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:8, padding:"6px 10px", color:"#94a3b8", cursor:"pointer", fontSize:13, fontWeight:"600" }}>🚪</button>
            </div>
          </div>
          {error && <div style={{ marginTop:8, padding:"8px 12px", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, fontSize:12, color:"#fca5a5" }}>{error}</div>}
          <div style={{ display:"flex", gap:4, marginTop:14 }}>
            {tabs.map(tab=>(
              <button key={tab.id} onClick={()=>setView(tab.id)} style={{ padding:"8px 18px", border:"none", borderRadius:"8px 8px 0 0", cursor:"pointer", fontSize:13, fontWeight:view===tab.id?"700":"500", background:view===tab.id?"rgba(99,102,241,0.3)":"transparent", color:view===tab.id?"#a5b4fc":"#64748b", borderBottom:view===tab.id?"2px solid #6366f1":"2px solid transparent", transition:"all 0.2s" }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"24px 16px" }}>

        {/* TODAY / EDIT */}
        {view==="today" && !isSchool && (
          <div>
            {/* Context banner for teacher */}
            {isTeacher && (
              <div style={{ background:"rgba(6,182,212,0.1)", border:"1px solid rgba(6,182,212,0.2)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#67e8f9" }}>
                🍎 Classroom behaviors — rate based on today's school day
              </div>
            )}

            {todayAvg && (
              <div style={{ background:"linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))", border:"1px solid rgba(99,102,241,0.3)", borderRadius:16, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ fontSize:48 }}>{SCORE_LABELS[Math.round(todayAvg)]?.emoji}</div>
                <div>
                  <div style={{ fontSize:28, fontWeight:"bold", color:SCORE_LABELS[Math.round(todayAvg)]?.color }}>{todayAvg} / 5.0</div>
                  <div style={{ fontSize:14, color:"#94a3b8" }}>Average · {SCORE_LABELS[Math.round(todayAvg)]?.label}</div>
                </div>
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {BEHAVIORS.map(b=>{
                const score = todayScores[b.id];
                return (
                  <div key={b.id} style={{ background:score?`${SCORE_LABELS[score].bg}15`:"rgba(255,255,255,0.04)", border:score?`1px solid ${SCORE_LABELS[score].color}40`:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px 16px", transition:"all 0.3s" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <span style={{ fontSize:20 }}>{b.icon}</span>
                      <span style={{ fontSize:14, fontWeight:"600", color:"#e2e8f0" }}>{b.label}</span>
                      {score && <span style={{ marginLeft:"auto", fontSize:11, padding:"2px 8px", borderRadius:20, fontWeight:"700", background:SCORE_LABELS[score].color, color:"#fff" }}>{SCORE_LABELS[score].label}</span>}
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {[1,2,3,4,5].map(n=>(
                        <button key={n} onClick={()=>setTodayScores(prev=>({...prev,[b.id]:n}))} style={{ flex:1, padding:"10px 0", border:"none", borderRadius:8, cursor:"pointer", fontSize:18, background:score===n?SCORE_LABELS[n].color:"rgba(255,255,255,0.08)", transform:score===n?"scale(1.12)":"scale(1)", transition:"all 0.15s", boxShadow:score===n?`0 4px 12px ${SCORE_LABELS[n].color}50`:"none" }}>{SCORE_LABELS[n].emoji}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:13, color:"#94a3b8", marginBottom:6 }}>📝 Notes (optional)</div>
              <textarea value={todayNote} onChange={e=>setTodayNote(e.target.value)} placeholder={isTeacher?"Any classroom context? Substitutes, events, incidents...":"Any context about today? Medication timing, sleep, big events..."} style={{ width:"100%", minHeight:80, padding:"12px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#e2e8f0", fontSize:13, resize:"vertical", fontFamily:"'Georgia',serif", boxSizing:"border-box" }} />
            </div>

            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              {editingDay && (
                <button onClick={()=>{ setEditingDay(null); setTodayScores(entries[todayKey]?.scores||{}); setTodayNote(entries[todayKey]?.note||""); }} style={{ ...mkBtn("#334155"), padding:"16px", fontSize:14, flex:1 }}>Cancel Edit</button>
              )}
              <button onClick={editingDay?saveEdit:saveToday} disabled={!allScored||saving} style={{ flex:2, padding:"16px", background:allScored?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.08)", border:"none", borderRadius:12, cursor:allScored?"pointer":"not-allowed", fontSize:16, fontWeight:"700", color:allScored?"#fff":"#475569", transition:"all 0.2s", boxShadow:allScored?"0 8px 24px rgba(99,102,241,0.4)":"none" }}>
                {saving?"💾 Saving...":saved?"✅ Saved!":allScored?(editingDay?"💾 Save Edit":"💾 Save Check-In"):`Rate all ${BEHAVIORS.length} behaviors to save`}
              </button>
            </div>
          </div>
        )}

        {/* TRENDS */}
        {view==="trends" && (
          <div>
            {isSchool && <div style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#a5b4fc" }}>👁️ School view — read only. Showing classroom behavior data.</div>}

            <div style={{ ...card, marginBottom:20 }}>
              <div style={{ fontSize:15, fontWeight:"700", color:"#e2e8f0", marginBottom:4 }}>
                📊 {isTeacher||isSchool||user.role==="admin" ? "Classroom" : "Home"} Daily Average — Last 14 Days
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:20 }}>Each bar = average score across all behaviors that day</div>
              {!hasData?(
                <div style={{ textAlign:"center", color:"#475569", padding:40, fontSize:14 }}>No data yet.</div>
              ):(
                <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:140 }}>
                  {chartData.map(d=>{
                    const pct=d.avg?(d.avg/5)*100:0;
                    const color=d.avg?d.avg>=4?"#22c55e":d.avg>=3?"#eab308":"#ef4444":"#1e293b";
                    const isToday=d.key===todayKey;
                    return (
                      <div key={d.key} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                        {d.avg&&<div style={{ fontSize:9, color:"#94a3b8", fontWeight:"600" }}>{d.avg.toFixed(1)}</div>}
                        <div style={{ width:"100%", height:110, display:"flex", alignItems:"flex-end" }}>
                          <div style={{ width:"100%", height:d.avg?`${pct}%`:"4px", background:d.avg?color:"#1e293b", borderRadius:"4px 4px 0 0", transition:"height 0.5s ease", boxShadow:isToday?`0 0 12px ${color}80`:"none", border:isToday?`1px solid ${color}`:"none", minHeight:4 }} />
                        </div>
                        <div style={{ fontSize:8, color:isToday?"#a5b4fc":"#475569", fontWeight:isToday?"700":"400" }}>{formatDateKey(d.key).split(" ")[0]}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ display:"flex", gap:16, marginTop:16, flexWrap:"wrap" }}>
                {[["#22c55e","Good (4–5)"],["#eab308","Okay (3)"],["#ef4444","Hard (1–2)"]].map(([c,l])=>(
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:c }} />
                    <span style={{ fontSize:11, color:"#64748b" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Drill down */}
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:"700", color:"#e2e8f0", marginBottom:12 }}>🔍 Drill Down by Behavior</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
                {(isTeacher||isSchool||user.role==="admin"?CLASSROOM_BEHAVIORS:HOME_BEHAVIORS).map(b=>(
                  <button key={b.id} onClick={()=>setSelectedBehavior(b.id)} style={{ padding:"6px 12px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:selectedBehavior===b.id?"700":"500", background:selectedBehavior===b.id?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.06)", color:selectedBehavior===b.id?"#a5b4fc":"#64748b", border:selectedBehavior===b.id?"1px solid #6366f1":"1px solid transparent" }}>{b.icon} {b.label}</button>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:120 }}>
                {behaviorTrend.map(d=>{
                  const pct=d.score?(d.score/5)*100:0;
                  const color=d.score?d.score>=4?"#22c55e":d.score>=3?"#eab308":"#ef4444":"#1e293b";
                  return (
                    <div key={d.key} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <div style={{ width:"100%", height:100, display:"flex", alignItems:"flex-end" }}>
                        <div style={{ width:"100%", height:d.score?`${pct}%`:"4px", background:d.score?color:"#1e293b", borderRadius:"4px 4px 0 0", transition:"height 0.5s ease", minHeight:4 }} />
                      </div>
                      <div style={{ fontSize:8, color:"#475569" }}>{formatDateKey(d.key).split(" ")[0]}</div>
                    </div>
                  );
                })}
              </div>
              {hasData&&(()=>{
                const scored=behaviorTrend.filter(d=>d.score);
                if(!scored.length) return null;
                const a=(scored.reduce((x,b)=>x+b.score,0)/scored.length).toFixed(1);
                const improving=scored.length>=4&&scored.slice(-3).reduce((x,b)=>x+b.score,0)>scored.slice(0,3).reduce((x,b)=>x+b.score,0);
                return <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(99,102,241,0.1)", borderRadius:8, fontSize:13, color:"#94a3b8" }}>2-week avg: <strong style={{ color:"#a5b4fc" }}>{a}/5</strong>{" · "}<span style={{ color:improving?"#22c55e":"#f97316" }}>{improving?"📈 Trending Up":"📉 Needs Support"}</span></div>;
              })()}
            </div>

            {/* Edit / Delete past entries — parents and teachers only */}
            {!isSchool && (
              <div style={{ ...card, marginTop:20 }}>
                <div style={{ fontSize:15, fontWeight:"700", color:"#e2e8f0", marginBottom:4 }}>✏️ Edit or Delete a Past Entry</div>
                <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>Fix an error or remove a day's data</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {last14.slice().reverse().map(key=>{
                    const entry = entries[key];
                    if (!entry||!entry.scores) return null;
                    const a = avg(entry.scores, BEHAVIORS);
                    const color = a>=4?"#22c55e":a>=3?"#eab308":"#ef4444";
                    const isToday = key===todayKey;
                    return (
                      <div key={key} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 14px" }}>
                        <div style={{ flex:1 }}>
                          <span style={{ fontSize:13, fontWeight:"600", color:"#e2e8f0" }}>{formatDateKey(key)}</span>
                          {isToday && <span style={{ marginLeft:6, fontSize:10, color:"#6366f1", fontWeight:"700" }}>TODAY</span>}
                          <span style={{ marginLeft:10, fontSize:12, fontWeight:"700", color }}>{a?.toFixed(1)}/5</span>
                        </div>
                        {deleteConfirmDay===key?(
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={()=>deleteDay(key)} style={{ ...mkBtn("#ef4444"), padding:"5px 10px", fontSize:11 }}>Delete</button>
                            <button onClick={()=>setDeleteConfirmDay(null)} style={{ ...mkBtn("#334155"), padding:"5px 10px", fontSize:11 }}>Cancel</button>
                          </div>
                        ):(
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={()=>startEdit(key)} style={{ ...mkBtn("#6366f1"), padding:"5px 10px", fontSize:11 }}>✏️ Edit</button>
                            <button onClick={()=>setDeleteConfirmDay(key)} style={{ ...mkBtn("#ef4444"), padding:"5px 10px", fontSize:11 }}>🗑️ Delete</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {last14.every(key=>!entries[key]?.scores) && <div style={{ textAlign:"center", color:"#475569", padding:20, fontSize:13 }}>No entries yet.</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCHOOL REPORT — classroom data only */}
        {view==="report" && (
          <div>
            <div style={{ background:"#fff", borderRadius:16, padding:"28px 24px", color:"#1e293b", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
              <div style={{ borderBottom:"3px solid #6366f1", paddingBottom:16, marginBottom:20 }}>
                <div style={{ fontSize:22, fontWeight:"800", color:"#1e293b", marginBottom:4 }}>Behavioral Progress Report</div>
                <div style={{ fontSize:13, color:"#64748b" }}>Classroom Observations · Generated {MONTHS[today.getMonth()]} {today.getDate()}, {today.getFullYear()}</div>
                <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["ADHD","ODD","Classroom Observation"].map(tag=>(
                    <span key={tag} style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:"700", background:"#eef2ff", color:"#6366f1" }}>{tag}</span>
                  ))}
                </div>
              </div>
              {(()=>{
                // Use classroom_entries data for report
                const scored = last14.map(key=>{
                  const s = isSchool||user.role==="admin" ? entries[key]?.classroom?.scores : entries[key]?.scores;
                  if (!s) return null;
                  const a = avg(s, REPORT_BEHAVIORS);
                  return a!==null?{ key, avg:a, scores:s }:null;
                }).filter(Boolean);

                if(!scored.length) return <div style={{ textAlign:"center", color:"#94a3b8", padding:30, fontSize:13 }}>No classroom data yet. Teacher check-ins will appear here.</div>;
                const overallAvg=(scored.reduce((a,b)=>a+b.avg,0)/scored.length).toFixed(1);
                const recentAvg=scored.slice(-7).length?(scored.slice(-7).reduce((a,b)=>a+b.avg,0)/scored.slice(-7).length).toFixed(1):null;
                const improving=recentAvg&&scored.length>=8?parseFloat(recentAvg)>parseFloat((scored.slice(0,7).reduce((a,b)=>a+b.avg,0)/Math.min(7,scored.length)).toFixed(1)):null;
                return (
                  <>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:16, marginBottom:20, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                      {[{label:"Days Tracked",value:scored.length,sub:"of last 14"},{label:"Overall Avg",value:`${overallAvg}/5`,sub:SCORE_LABELS[Math.round(overallAvg)]?.label},{label:"Trend",value:improving===null?"—":improving?"📈 Up":"📉 Down",sub:"last 7 days vs prior"}].map(stat=>(
                        <div key={stat.label} style={{ textAlign:"center" }}>
                          <div style={{ fontSize:22, fontWeight:"800", color:"#6366f1" }}>{stat.value}</div>
                          <div style={{ fontSize:11, fontWeight:"700", color:"#1e293b" }}>{stat.label}</div>
                          <div style={{ fontSize:10, color:"#94a3b8" }}>{stat.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:14, fontWeight:"700", color:"#1e293b", marginBottom:10 }}>Classroom Behavior Breakdown (14-Day Average)</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
                      {REPORT_BEHAVIORS.map(b=>{
                        const vals=scored.map(d=>d.scores[b.id]).filter(Boolean);
                        if(!vals.length) return null;
                        const a=(vals.reduce((x,c)=>x+c,0)/vals.length).toFixed(1);
                        const pct=(parseFloat(a)/5)*100;
                        const color=parseFloat(a)>=4?"#22c55e":parseFloat(a)>=3?"#eab308":"#ef4444";
                        return (
                          <div key={b.id}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:12, color:"#475569" }}>{b.icon} {b.label}</span>
                              <span style={{ fontSize:12, fontWeight:"700", color }}>{a}/5</span>
                            </div>
                            <div style={{ height:8, background:"#e2e8f0", borderRadius:4, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:4 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize:14, fontWeight:"700", color:"#1e293b", marginBottom:10 }}>Recent Daily Scores</div>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                      <thead><tr style={{ background:"#f1f5f9" }}>
                        <th style={{ padding:"8px 10px", textAlign:"left", color:"#64748b" }}>Date</th>
                        <th style={{ padding:"8px 10px", textAlign:"center", color:"#64748b" }}>Avg</th>
                        <th style={{ padding:"8px 10px", textAlign:"left", color:"#64748b" }}>Rating</th>
                        <th style={{ padding:"8px 10px", textAlign:"left", color:"#64748b" }}>Notes</th>
                      </tr></thead>
                      <tbody>
                        {scored.slice(-7).reverse().map(d=>{
                          const noteData = isSchool||user.role==="admin" ? entries[d.key]?.classroom : entries[d.key];
                          const note = noteData?.note||"";
                          const rounded=Math.round(d.avg);
                          const color=d.avg>=4?"#22c55e":d.avg>=3?"#d97706":"#ef4444";
                          return (
                            <tr key={d.key} style={{ borderBottom:"1px solid #f1f5f9" }}>
                              <td style={{ padding:"8px 10px", color:"#1e293b", fontWeight:"600" }}>{formatDateKey(d.key)}</td>
                              <td style={{ padding:"8px 10px", textAlign:"center", fontWeight:"800", color }}>{d.avg.toFixed(1)}</td>
                              <td style={{ padding:"8px 10px", color:"#64748b" }}>{SCORE_LABELS[rounded]?.emoji} {SCORE_LABELS[rounded]?.label}</td>
                              <td style={{ padding:"8px 10px", color:"#94a3b8", fontStyle:"italic" }}>{note||"—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ marginTop:20, padding:"12px 16px", background:"#fefce8", borderLeft:"4px solid #eab308", borderRadius:"0 8px 8px 0", fontSize:12, color:"#713f12" }}>
                      <strong>Note:</strong> This report reflects teacher-observed classroom behavior. Ratings use a 1–5 scale where 5 = consistently demonstrated without prompting, and 1 = significant difficulty. For home behavior data, please request the parent report separately.
                    </div>
                  </>
                );
              })()}
            </div>
            <button onClick={()=>window.print()} style={{ marginTop:16, width:"100%", padding:"14px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", borderRadius:12, cursor:"pointer", fontSize:15, fontWeight:"700", color:"#fff", boxShadow:"0 8px 24px rgba(99,102,241,0.4)" }}>
              🖨️ Print / Save as PDF for School
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
