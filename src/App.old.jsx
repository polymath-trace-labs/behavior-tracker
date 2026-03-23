import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tmpjvwlivjbtjjqzngba.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcGp2d2xpdmpidGpqcXpuZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTU1NzcsImV4cCI6MjA4OTQzMTU3N30.E99AEV1Jim0DX6jxZTDyQL1u3k2Pj-O2fso3t6a0EII";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MAX_USERS = 7;

const BEHAVIORS = [
  { id: "follows_first_ask", label: "Follows instruction on first ask", icon: "☝️" },
  { id: "completes_task", label: "Completes assigned task without reminders", icon: "✅" },
  { id: "accepts_no", label: "Accepts 'No' without major protest", icon: "🛑" },
  { id: "transitions", label: "Transitions between activities calmly", icon: "🔄" },
  { id: "morning_routine", label: "Completes morning routine independently", icon: "🌅" },
  { id: "bedtime_routine", label: "Follows bedtime routine without struggle", icon: "🌙" },
];

const SCORE_LABELS = {
  1: { label: "Tough Day", color: "#ef4444", bg: "#fef2f2", emoji: "😤" },
  2: { label: "Needed a Lot of Help", color: "#f97316", bg: "#fff7ed", emoji: "😕" },
  3: { label: "Some Struggles", color: "#eab308", bg: "#fefce8", emoji: "😐" },
  4: { label: "Pretty Good", color: "#22c55e", bg: "#f0fdf4", emoji: "🙂" },
  5: { label: "Nailed It!", color: "#6366f1", bg: "#eef2ff", emoji: "🌟" },
};

const ROLE_CONFIG = {
  admin:  { label: "Admin",        color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  icon: "👑" },
  parent: { label: "Parent",       color: "#22c55e", bg: "rgba(34,197,94,0.15)",   icon: "👪" },
  school: { label: "School Staff", color: "#6366f1", bg: "rgba(99,102,241,0.15)",  icon: "🏫" },
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

// ── SHARED STYLES ────────────────────────────────────────────
const card = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 16, padding: 20,
};
const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
  color: "#e2e8f0", fontFamily: "'Georgia',serif", boxSizing: "border-box",
  outline: "none",
};
const btn = (accent="#6366f1") => ({
  border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "700",
  fontFamily: "'Georgia',serif", transition: "all 0.15s",
  background: `linear-gradient(135deg,${accent},${accent}cc)`,
  color: "#fff",
});

// ── LOGIN SCREEN ─────────────────────────────────────────────
function LoginScreen({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [pin, setPin]           = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  const handlePinKey = (val) => {
    if (pin.length >= 5) return;
    setPin(prev => prev + val);
    setError("");
  };
  const handleDelete = () => { setPin(p => p.slice(0,-1)); setError(""); };

  const handleLogin = async () => {
    if (!username.trim()) { setError("Please enter your username."); return; }
    if (pin.length !== 5) { setError("PIN must be 5 digits."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("*")
        .ilike("username", username.trim())
        .single();
      if (error || !data) throw new Error("User not found.");
      if (data.pin !== pin) {
        setShake(true); setError("Incorrect PIN.");
        setPin(""); setTimeout(() => setShake(false), 600);
        return;
      }
      sessionStorage.setItem("bt_user", JSON.stringify({ id: data.id, username: data.username, role: data.role }));
      onSuccess({ id: data.id, username: data.username, role: data.role });
    } catch (e) {
      setShake(true); setError(e.message || "Login failed.");
      setPin(""); setTimeout(() => setShake(false), 600);
    } finally { setLoading(false); }
  };

  // auto-submit when 5 digits entered
  useEffect(() => { if (pin.length === 5) handleLogin(); }, [pin]);

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Georgia',serif", padding:24 }}>
      <div style={{ width:"100%", maxWidth:360, ...card, padding:"40px 32px", textAlign:"center", boxShadow:"0 25px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ width:64, height:64, borderRadius:18, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, margin:"0 auto 20px" }}>⭐</div>
        <div style={{ fontSize:21, fontWeight:"800", color:"#f1f5f9", marginBottom:4 }}>Behavior Tracker</div>
        <div style={{ fontSize:13, color:"#64748b", marginBottom:28 }}>Sign in to continue</div>

        {/* Username */}
        <input
          value={username}
          onChange={e => { setUsername(e.target.value); setError(""); }}
          placeholder="Username"
          autoCapitalize="none"
          style={{ ...inputStyle, marginBottom:20, textAlign:"center", fontSize:15, letterSpacing:1 }}
          onKeyDown={e => e.key==="Enter" && pin.length===5 && handleLogin()}
        />

        {/* PIN dots */}
        <div style={{ fontSize:12, color:"#64748b", marginBottom:10 }}>5-digit PIN</div>
        <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:20, animation: shake?"shake 0.5s ease":"none" }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width:14, height:14, borderRadius:"50%", background: i<pin.length ? (error?"#ef4444":"#6366f1") : "rgba(255,255,255,0.15)", border:`2px solid ${i<pin.length?(error?"#ef4444":"#6366f1"):"rgba(255,255,255,0.2)"}`, transition:"all 0.15s", transform:i<pin.length?"scale(1.2)":"scale(1)" }} />
          ))}
        </div>

        {error && <div style={{ fontSize:12, color:"#f87171", marginBottom:14, background:"rgba(239,68,68,0.1)", padding:"6px 12px", borderRadius:8 }}>{error}</div>}

        {/* Keypad */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i) => (
            <button key={i}
              onClick={() => k==="⌫" ? handleDelete() : k!==""?handlePinKey(String(k)):null}
              disabled={k===""||loading}
              style={{ padding:"16px 0", background: k==="⌫"?"rgba(239,68,68,0.15)":k===""?"transparent":"rgba(255,255,255,0.07)", border: k===""?"none":`1px solid rgba(255,255,255,${k==="⌫"?"0.1":"0.08"})`, borderRadius:10, cursor:k===""?"default":"pointer", fontSize:k==="⌫"?16:18, fontWeight:"700", color:k==="⌫"?"#f87171":"#e2e8f0", transition:"all 0.1s", fontFamily:"'Georgia',serif" }}
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
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newPin, setNewPin]       = useState("");
  const [newRole, setNewRole]     = useState("parent");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_users").select("*").order("created_at", { ascending: true });
    setUsers(data || []);
    setLoading(false);
  };

  const addUser = async () => {
    setError(""); setSuccess("");
    if (!newUsername.trim()) { setError("Username is required."); return; }
    if (!/^\d{5}$/.test(newPin)) { setError("PIN must be exactly 5 digits."); return; }
    if (users.length >= MAX_USERS) { setError(`Maximum of ${MAX_USERS} users allowed.`); return; }
    const exists = users.find(u => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (exists) { setError("That username is already taken."); return; }
    setSaving(true);
    const { error } = await supabase.from("app_users").insert({ username: newUsername.trim(), pin: newPin, role: newRole });
    if (error) { setError("Failed to create user."); }
    else { setSuccess(`User "${newUsername.trim()}" created!`); setNewUsername(""); setNewPin(""); setNewRole("parent"); loadUsers(); }
    setSaving(false);
  };

  const deleteUser = async (id, uname) => {
    if (uname === currentUser.username) { setError("You cannot delete your own account."); return; }
    await supabase.from("app_users").delete().eq("id", id);
    setDeleteConfirm(null);
    setSuccess(`User "${uname}" removed.`);
    loadUsers();
  };

  const updateRole = async (id, role) => {
    await supabase.from("app_users").update({ role }).eq("id", id);
    loadUsers();
  };

  const updatePin = async (id, uname) => {
    const newp = prompt(`Enter new 5-digit PIN for "${uname}":`);
    if (!newp) return;
    if (!/^\d{5}$/.test(newp)) { setError("PIN must be exactly 5 digits."); return; }
    await supabase.from("app_users").update({ pin: newp }).eq("id", id);
    setSuccess(`PIN updated for "${uname}".`);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", fontFamily:"'Georgia',serif", color:"#e2e8f0" }}>
      {/* Header */}
      <div style={{ background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"18px 24px" }}>
        <div style={{ maxWidth:720, margin:"0 auto", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onBack} style={{ ...btn("#334155"), padding:"8px 14px", fontSize:13 }}>← Back</button>
          <div style={{ fontSize:18, fontWeight:"800", color:"#f1f5f9" }}>👑 User Management</div>
          <div style={{ marginLeft:"auto", fontSize:12, color:"#64748b" }}>{users.length}/{MAX_USERS} users</div>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"24px 16px", display:"flex", flexDirection:"column", gap:20 }}>

        {error   && <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, fontSize:13, color:"#fca5a5" }}>{error}</div>}
        {success && <div style={{ padding:"10px 14px", background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:10, fontSize:13, color:"#86efac" }}>{success}</div>}

        {/* Add user */}
        <div style={{ ...card }}>
          <div style={{ fontSize:15, fontWeight:"700", color:"#e2e8f0", marginBottom:16 }}>➕ Add New User</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="Username" style={inputStyle} />
            <input value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,"").slice(0,5))} placeholder="5-digit PIN" style={inputStyle} maxLength={5} />
            <select value={newRole} onChange={e=>setNewRole(e.target.value)} style={{ ...inputStyle }}>
              <option value="parent">👪 Parent — full access</option>
              <option value="school">🏫 School Staff — read only</option>
              <option value="admin">👑 Admin — manage users</option>
            </select>
            <button onClick={addUser} disabled={saving||users.length>=MAX_USERS} style={{ ...btn(), padding:"12px", fontSize:14, opacity:users.length>=MAX_USERS?0.5:1 }}>
              {saving ? "Creating..." : users.length>=MAX_USERS ? `Max ${MAX_USERS} users reached` : "Create User"}
            </button>
          </div>
        </div>

        {/* User list */}
        <div style={{ ...card }}>
          <div style={{ fontSize:15, fontWeight:"700", color:"#e2e8f0", marginBottom:16 }}>👥 Current Users</div>
          {loading ? (
            <div style={{ textAlign:"center", color:"#475569", padding:20 }}>Loading...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign:"center", color:"#475569", padding:20, fontSize:13 }}>No users yet.</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {users.map(u => {
                const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.parent;
                const isMe = u.username === currentUser.username;
                return (
                  <div key={u.id} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:rc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{rc.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:"700", color:"#f1f5f9" }}>
                          {u.username} {isMe && <span style={{ fontSize:10, color:"#64748b" }}>(you)</span>}
                        </div>
                        <div style={{ fontSize:11, color:rc.color, fontWeight:"600" }}>{rc.label}</div>
                      </div>

                      {/* Role change */}
                      {!isMe && (
                        <select
                          value={u.role}
                          onChange={e => updateRole(u.id, e.target.value)}
                          style={{ padding:"5px 8px", borderRadius:8, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"#e2e8f0", fontSize:12, cursor:"pointer", fontFamily:"'Georgia',serif" }}
                        >
                          <option value="parent">👪 Parent</option>
                          <option value="school">🏫 School</option>
                          <option value="admin">👑 Admin</option>
                        </select>
                      )}

                      {/* Reset PIN */}
                      <button onClick={() => updatePin(u.id, u.username)} style={{ ...btn("#334155"), padding:"6px 10px", fontSize:11 }}>Reset PIN</button>

                      {/* Delete */}
                      {!isMe && (
                        deleteConfirm === u.id ? (
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => deleteUser(u.id, u.username)} style={{ ...btn("#ef4444"), padding:"6px 10px", fontSize:11 }}>Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ ...btn("#334155"), padding:"6px 10px", fontSize:11 }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setError(""); setDeleteConfirm(u.id); }} style={{ ...btn("#ef4444"), padding:"6px 10px", fontSize:11 }}>Remove</button>
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
  const [user, setUser]     = useState(() => { try { return JSON.parse(sessionStorage.getItem("bt_user")); } catch { return null; } });
  const [screen, setScreen] = useState("tracker"); // tracker | admin

  const handleLogin  = (u) => { setUser(u); setScreen("tracker"); };
  const handleLogout = () => { sessionStorage.removeItem("bt_user"); setUser(null); setScreen("tracker"); };

  if (!user) return <LoginScreen onSuccess={handleLogin} />;
  if (screen === "admin") return <AdminPanel currentUser={user} onBack={() => setScreen("tracker")} />;
  return <BehaviorTracker user={user} onLogout={handleLogout} onAdmin={user.role==="admin" ? ()=>setScreen("admin") : null} />;
}

// ── MAIN TRACKER ─────────────────────────────────────────────
function BehaviorTracker({ user, onLogout, onAdmin }) {
  const isSchool   = user.role === "school";
  const [view, setView]               = useState(isSchool ? "report" : "today");
  const [entries, setEntries]         = useState({});
  const [todayScores, setTodayScores] = useState({});
  const [todayNote, setTodayNote]     = useState("");
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [selectedBehavior, setSelectedBehavior] = useState(BEHAVIORS[0].id);
  const [error, setError]             = useState(null);

  const todayKey = getTodayKey();
  const today    = new Date();
  const dayName  = DAYS[today.getDay()];
  const rc       = ROLE_CONFIG[user.role] || ROLE_CONFIG.parent;

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.from("behavior_entries").select("*").order("entry_date",{ascending:false}).limit(30);
      if (error) throw error;
      const map = {};
      data.forEach(row => { map[row.entry_date] = { scores:row.scores, note:row.note }; });
      setEntries(map);
      if (map[todayKey]) { setTodayScores(map[todayKey].scores||{}); setTodayNote(map[todayKey].note||""); }
    } catch { setError("Could not connect to database."); }
    finally { setLoading(false); }
  };

  const saveToday = async () => {
    setSaving(true); setError(null);
    try {
      const { error } = await supabase.from("behavior_entries").upsert({ entry_date:todayKey, scores:todayScores, note:todayNote, updated_at:new Date().toISOString() },{ onConflict:"entry_date" });
      if (error) throw error;
      setEntries(prev => ({ ...prev, [todayKey]:{ scores:todayScores, note:todayNote } }));
      setSaved(true); setTimeout(()=>setSaved(false),2500);
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  const allScored  = BEHAVIORS.every(b => todayScores[b.id]);
  const todayAvg   = allScored ? (Object.values(todayScores).reduce((a,b)=>a+b,0)/BEHAVIORS.length).toFixed(1) : null;
  const last14     = getLast14Days();
  const chartData  = last14.map(key => {
    const entry = entries[key];
    if (!entry||!entry.scores) return { key, avg:null, scores:{} };
    const vals = Object.values(entry.scores);
    return { key, avg:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null, scores:entry.scores };
  });
  const behaviorTrend = last14.map(key => ({ key, score:entries[key]?.scores?.[selectedBehavior]||null }));
  const hasData       = chartData.some(d=>d.avg!==null);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"'Georgia',serif" }}>
      <div style={{ fontSize:48 }}>⭐</div>
      <div style={{ color:"#94a3b8", fontSize:16 }}>Loading tracker...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", fontFamily:"'Georgia',serif", color:"#e2e8f0" }}>
      {/* Header */}
      <div style={{ background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"18px 24px 0", backdropFilter:"blur(10px)" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⭐</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:19, fontWeight:"bold", color:"#f1f5f9", letterSpacing:"-0.3px" }}>Daily Behavior Tracker</div>
              <div style={{ fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:6 }}>
                {dayName}, {MONTHS[today.getMonth()]} {today.getDate()}
                <span style={{ padding:"1px 7px", borderRadius:20, fontSize:10, fontWeight:"700", background:rc.bg, color:rc.color }}>{rc.icon} {rc.label}</span>
                <span style={{ color:"#475569" }}>· {user.username}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={loadEntries} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:8, padding:"6px 10px", color:"#94a3b8", cursor:"pointer", fontSize:16 }} title="Refresh">🔄</button>
              {onAdmin && <button onClick={onAdmin} style={{ background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:8, padding:"6px 10px", color:"#fbbf24", cursor:"pointer", fontSize:13, fontWeight:"700" }}>👑</button>}
              <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:8, padding:"6px 10px", color:"#94a3b8", cursor:"pointer", fontSize:13, fontWeight:"600" }}>🚪</button>
            </div>
          </div>
          {error && <div style={{ marginTop:8, padding:"8px 12px", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, fontSize:12, color:"#fca5a5" }}>{error}</div>}
          <div style={{ display:"flex", gap:4, marginTop:14 }}>
            {[
              { id:"today",  label:"📋 Today",         hide:isSchool },
              { id:"trends", label:"📈 Trends" },
              { id:"report", label:"🏫 School Report" },
            ].filter(t=>!t.hide).map(tab=>(
              <button key={tab.id} onClick={()=>setView(tab.id)} style={{ padding:"8px 18px", border:"none", borderRadius:"8px 8px 0 0", cursor:"pointer", fontSize:13, fontWeight:view===tab.id?"700":"500", background:view===tab.id?"rgba(99,102,241,0.3)":"transparent", color:view===tab.id?"#a5b4fc":"#64748b", borderBottom:view===tab.id?"2px solid #6366f1":"2px solid transparent", transition:"all 0.2s" }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"24px 16px" }}>

        {/* TODAY */}
        {view==="today" && !isSchool && (
          <div>
            {todayAvg && (
              <div style={{ background:"linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))", border:"1px solid rgba(99,102,241,0.3)", borderRadius:16, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ fontSize:48 }}>{SCORE_LABELS[Math.round(todayAvg)]?.emoji}</div>
                <div>
                  <div style={{ fontSize:28, fontWeight:"bold", color:SCORE_LABELS[Math.round(todayAvg)]?.color }}>{todayAvg} / 5.0</div>
                  <div style={{ fontSize:14, color:"#94a3b8" }}>Today's Average · {SCORE_LABELS[Math.round(todayAvg)]?.label}</div>
                </div>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {BEHAVIORS.map(b => {
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
              <div style={{ fontSize:13, color:"#94a3b8", marginBottom:6 }}>📝 Parent Notes (optional)</div>
              <textarea value={todayNote} onChange={e=>setTodayNote(e.target.value)} placeholder="Any context about today? Medication timing, sleep, big events..." style={{ width:"100%", minHeight:80, padding:"12px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#e2e8f0", fontSize:13, resize:"vertical", fontFamily:"'Georgia',serif", boxSizing:"border-box" }} />
            </div>
            <button onClick={saveToday} disabled={!allScored||saving} style={{ marginTop:16, width:"100%", padding:"16px", background:allScored?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.08)", border:"none", borderRadius:12, cursor:allScored?"pointer":"not-allowed", fontSize:16, fontWeight:"700", color:allScored?"#fff":"#475569", transition:"all 0.2s", boxShadow:allScored?"0 8px 24px rgba(99,102,241,0.4)":"none" }}>
              {saving?"💾 Saving...":saved?"✅ Saved to Database!":allScored?"💾 Save Today's Check-In":`Rate all ${BEHAVIORS.length} behaviors to save`}
            </button>
          </div>
        )}

        {/* TRENDS */}
        {view==="trends" && (
          <div>
            {isSchool && <div style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#a5b4fc" }}>👁️ School view — read only. Data entered by parents.</div>}
            <div style={{ ...card, marginBottom:20 }}>
              <div style={{ fontSize:15, fontWeight:"700", color:"#e2e8f0", marginBottom:4 }}>📊 Overall Daily Average — Last 14 Days</div>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:20 }}>Each bar = average score across all 6 behaviors that day</div>
              {!hasData?(
                <div style={{ textAlign:"center", color:"#475569", padding:40, fontSize:14 }}>No data yet. Complete at least one daily check-in to see trends.</div>
              ):(
                <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:140 }}>
                  {chartData.map(d=>{
                    const pct = d.avg?(d.avg/5)*100:0;
                    const color = d.avg?d.avg>=4?"#22c55e":d.avg>=3?"#eab308":"#ef4444":"#1e293b";
                    const isToday = d.key===todayKey;
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
            <div style={{ ...card }}>
              <div style={{ fontSize:15, fontWeight:"700", color:"#e2e8f0", marginBottom:12 }}>🔍 Drill Down by Behavior</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
                {BEHAVIORS.map(b=>(
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
                const avg=(scored.reduce((a,b)=>a+b.score,0)/scored.length).toFixed(1);
                const improving=scored.length>=4&&scored.slice(-3).reduce((a,b)=>a+b.score,0)>scored.slice(0,3).reduce((a,b)=>a+b.score,0);
                return <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(99,102,241,0.1)", borderRadius:8, fontSize:13, color:"#94a3b8" }}>2-week avg: <strong style={{ color:"#a5b4fc" }}>{avg}/5</strong>{" · "}<span style={{ color:improving?"#22c55e":"#f97316" }}>{improving?"📈 Trending Up":"📉 Needs Support"}</span></div>;
              })()}
            </div>
          </div>
        )}

        {/* REPORT */}
        {view==="report" && (
          <div>
            <div style={{ background:"#fff", borderRadius:16, padding:"28px 24px", color:"#1e293b", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
              <div style={{ borderBottom:"3px solid #6366f1", paddingBottom:16, marginBottom:20 }}>
                <div style={{ fontSize:22, fontWeight:"800", color:"#1e293b", marginBottom:4 }}>Behavioral Progress Report</div>
                <div style={{ fontSize:13, color:"#64748b" }}>For School Communication · Generated {MONTHS[today.getMonth()]} {today.getDate()}, {today.getFullYear()}</div>
                <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["ADHD","ODD","Home Observation"].map(tag=>(
                    <span key={tag} style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:"700", background:"#eef2ff", color:"#6366f1" }}>{tag}</span>
                  ))}
                </div>
              </div>
              {(()=>{
                const scored=chartData.filter(d=>d.avg!==null);
                if(!scored.length) return <div style={{ textAlign:"center", color:"#94a3b8", padding:30, fontSize:13 }}>Complete daily check-ins to generate this report.</div>;
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
                    <div style={{ fontSize:14, fontWeight:"700", color:"#1e293b", marginBottom:10 }}>Behavior Breakdown (14-Day Average)</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
                      {BEHAVIORS.map(b=>{
                        const vals=scored.map(d=>d.scores[b.id]).filter(Boolean);
                        if(!vals.length) return null;
                        const avg=(vals.reduce((a,c)=>a+c,0)/vals.length).toFixed(1);
                        const pct=(parseFloat(avg)/5)*100;
                        const color=parseFloat(avg)>=4?"#22c55e":parseFloat(avg)>=3?"#eab308":"#ef4444";
                        return (
                          <div key={b.id}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:12, color:"#475569" }}>{b.icon} {b.label}</span>
                              <span style={{ fontSize:12, fontWeight:"700", color }}>{avg}/5</span>
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
                          const note=entries[d.key]?.note||"";
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
                      <strong>For School Staff:</strong> This report reflects parent-observed home behavior only. Ratings use a 1–5 scale where 5 = fully followed instruction without prompting, and 1 = significant resistance/refusal. Please compare with classroom observations for a complete picture.
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
