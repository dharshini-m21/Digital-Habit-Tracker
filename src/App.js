import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar } from "recharts";

// ─── Utilities ───────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const QUOTES = [
    "Small daily improvements lead to stunning results.",
    "Discipline is choosing between what you want now and what you want most.",
    "The secret to getting ahead is getting started.",
    "Success is the sum of small efforts repeated day in and day out.",
    "You don't have to be great to start, but you must start to be great.",
    "Habits are the compound interest of self-improvement.",
    "Every expert was once a beginner. Keep going.",
];
const BADGES = [
    { id: "first_habit", label: "First Step", desc: "Added your first habit", icon: "🌱", req: (s) => s.habits.length >= 1 },
    { id: "week_streak", label: "Week Warrior", desc: "7-day streak on any habit", icon: "🔥", req: (s) => Object.values(s.streaks).some(v => v >= 7) },
    { id: "month_master", label: "Month Master", desc: "30-day streak on any habit", icon: "👑", req: (s) => Object.values(s.streaks).some(v => v >= 30) },
    { id: "todo_champ", label: "Task Champion", desc: "Complete 10 todos", icon: "⚡", req: (s) => s.weekTodos.filter(t => t.done).length + s.monthTodos.filter(t => t.done).length >= 10 },
    { id: "consistency", label: "Consistency King", desc: "5 habits tracked today", icon: "💎", req: (s) => { const t = today(); return s.habits.filter(h => s.tracking[h.id]?.[t]).length >= 5; } },
];
const CATEGORIES = ["Health", "Fitness", "Learning", "Mindfulness", "Productivity", "Social", "Finance", "Other"];
const COLORS = { Health: "#10b981", Fitness: "#f59e0b", Learning: "#6366f1", Mindfulness: "#8b5cf6", Productivity: "#3b82f6", Social: "#ec4899", Finance: "#14b8a6", Other: "#6b7280" };

const defaultState = {
    user: null, habits: [], tracking: {}, weekTodos: [], monthTodos: [],
    streaks: {}, theme: "dark", quote: QUOTES[0],
};

function loadState() {
    try { return { ...defaultState, ...JSON.parse(localStorage.getItem("habitracker") || "{}") }; }
    catch { return defaultState; }
}
function saveState(s) {
    localStorage.setItem("habitracker", JSON.stringify(s));
}

// ─── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [err, setErr] = useState("");

    const submit = () => {
        if (!form.email || !form.password) { setErr("Please fill all fields"); return; }
        if (mode === "signup" && !form.name) { setErr("Name is required"); return; }
        const users = JSON.parse(localStorage.getItem("ht_users") || "[]");
        if (mode === "signup") {
            if (users.find(u => u.email === form.email)) { setErr("Email already exists"); return; }
            const user = { id: genId(), name: form.name, email: form.email, password: form.password, joined: today() };
            localStorage.setItem("ht_users", JSON.stringify([...users, user]));
            onAuth(user);
        } else {
            const user = users.find(u => u.email === form.email && u.password === form.password);
            if (!user) { setErr("Invalid credentials"); return; }
            onAuth(user);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-deep)", padding: "2rem" }}>
            <div style={{ width: "100%", maxWidth: 420, background: "var(--card)", borderRadius: 20, padding: "2.5rem", border: "1px solid var(--border)" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>✦</div>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "var(--text)", margin: 0 }}>HabitFlow</h1>
                    <p style={{ color: "var(--muted)", fontSize: 14, margin: "6px 0 0" }}>Build better habits, one day at a time</p>
                </div>
                <div style={{ display: "flex", background: "var(--bg)", borderRadius: 12, padding: 4, marginBottom: "1.5rem" }}>
                    {["login", "signup"].map(m => (
                        <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{
                            flex: 1, padding: "10px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all .2s",
                            background: mode === m ? "var(--accent)" : "transparent",
                            color: mode === m ? "#fff" : "var(--muted)"
                        }}>{m === "login" ? "Sign In" : "Sign Up"}</button>
                    ))}
                </div>
                {mode === "signup" && (
                    <input placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 12, background: "var(--bg)", color: "var(--text)", fontSize: 14, boxSizing: "border-box" }} />
                )}
                <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 12, background: "var(--bg)", color: "var(--text)", fontSize: 14, boxSizing: "border-box" }} />
                <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && submit()}
                    style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 8, background: "var(--bg)", color: "var(--text)", fontSize: 14, boxSizing: "border-box" }} />
                {err && <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
                <button onClick={submit} style={{
                    width: "100%", padding: "14px", background: "linear-gradient(135deg, var(--accent), var(--accent2))", border: "none",
                    borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 8
                }}>{mode === "login" ? "Sign In" : "Create Account"}</button>
                <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 16 }}>
                    Demo: use any email/password to sign up
                </p>
            </div>
        </div>
    );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "habits", label: "Habit Tracker", icon: "◎" },
    { id: "weekly", label: "Weekly Todos", icon: "☑" },
    { id: "monthly", label: "Monthly Goals", icon: "◈" },
    { id: "analytics", label: "Analytics", icon: "◆" },
    { id: "badges", label: "Achievements", icon: "★" },
    { id: "settings", label: "Settings", icon: "⊙" },
];

function Sidebar({ active, setActive, user, onLogout, theme, setTheme, sidebarOpen, setSidebarOpen }) {
    return (
        <>
            {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 40, display: window.innerWidth > 768 ? "none" : "block" }} />}
            <aside style={{
                position: "fixed", top: 0, left: 0, height: "100vh", width: 240,
                background: "var(--sidebar)", borderRight: "1px solid var(--border)",
                display: "flex", flexDirection: "column", zIndex: 50, padding: "1.5rem 0",
                transform: sidebarOpen || window.innerWidth > 768 ? "translateX(0)" : "translateX(-100%)",
                transition: "transform .3s cubic-bezier(.4,0,.2,1)"
            }}>
                <div style={{ padding: "0 1.5rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{user?.name || "User"}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{user?.email}</div>
                        </div>
                    </div>
                </div>
                <nav style={{ flex: 1, padding: "1rem 0.75rem", overflowY: "auto" }}>
                    {NAV.map(n => (
                        <button key={n.id} onClick={() => { setActive(n.id); setSidebarOpen(false); }} style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                            borderRadius: 12, border: "none", cursor: "pointer", marginBottom: 2,
                            background: active === n.id ? "var(--accent-subtle)" : "transparent",
                            color: active === n.id ? "var(--accent)" : "var(--muted)",
                            fontWeight: active === n.id ? 700 : 500, fontSize: 14, transition: "all .15s", textAlign: "left"
                        }}>
                            <span style={{ fontSize: 18 }}>{n.icon}</span>
                            {n.label}
                        </button>
                    ))}
                </nav>
                <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{
                        width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)",
                        background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8
                    }}>
                        {theme === "dark" ? "☀ Light Mode" : "☾ Dark Mode"}
                    </button>
                    <button onClick={onLogout} style={{
                        width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #f8717155",
                        background: "transparent", color: "#f87171", cursor: "pointer", fontSize: 13
                    }}>Sign Out</button>
                </div>
            </aside>
        </>
    );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ state, dispatch }) {
    const t = today();
    const todayHabits = state.habits;
    const doneToday = todayHabits.filter(h => state.tracking[h.id]?.[t]).length;
    const pct = todayHabits.length ? Math.round(doneToday / todayHabits.length * 100) : 0;
    const maxStreak = Math.max(0, ...Object.values(state.streaks));
    const pendingWeek = state.weekTodos.filter(t => !t.done).length;
    const pendingMonth = state.monthTodos.filter(t => !t.done && t.status !== "done").length;

    const weekData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dk = d.toISOString().slice(0, 10);
            const total = state.habits.length;
            const done = state.habits.filter(h => state.tracking[h.id]?.[dk]).length;
            days.push({ day: DAYS[d.getDay()], pct: total ? Math.round(done / total * 100) : 0 });
        }
        return days;
    }, [state.habits, state.tracking]);

    const quote = useMemo(() => QUOTES[new Date().getDay() % QUOTES.length], []);

    return (
        <div>
            <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "var(--text)", margin: 0 }}>
                    Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {state.user?.name?.split(" ")[0]} ✦
                </h2>
                <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: 14 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            </div>

            <div style={{ background: "linear-gradient(135deg, var(--accent), var(--accent2))", borderRadius: 20, padding: "1.25rem 1.5rem", marginBottom: "1.5rem", color: "#fff" }}>
                <p style={{ margin: 0, fontSize: 13, opacity: .8 }}>Daily Quote</p>
                <p style={{ margin: "6px 0 0", fontSize: 15, fontStyle: "italic", lineHeight: 1.5 }}>"{quote}"</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
                {[
                    { label: "Today's Progress", value: `${pct}%`, sub: `${doneToday}/${todayHabits.length} habits`, color: "var(--accent)" },
                    { label: "Best Streak", value: `${maxStreak}d`, sub: "consecutive days", color: "#f59e0b" },
                    { label: "Weekly Todos", value: pendingWeek, sub: "pending tasks", color: "#10b981" },
                    { label: "Monthly Goals", value: pendingMonth, sub: "in progress", color: "#8b5cf6" },
                ].map(c => (
                    <div key={c.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem" }}>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>{c.label}</p>
                        <p style={{ margin: "8px 0 2px", fontSize: 30, fontWeight: 800, color: c.color, fontFamily: "'Playfair Display', serif" }}>{c.value}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{c.sub}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: "1.5rem" }}>
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem", gridColumn: "span 2" }}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: 15, color: "var(--text)", fontWeight: 700 }}>7-Day Completion Rate</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={weekData} barSize={28}>
                            <XAxis dataKey="day" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                            <Tooltip formatter={v => `${v}%`} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }} />
                            <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                                {weekData.map((_, i) => <Cell key={i} fill={i === 6 ? "var(--accent)" : "var(--accent-subtle)"} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 15, color: "var(--text)", fontWeight: 700 }}>Today's Habits</h3>
                {todayHabits.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: "2rem 0" }}>No habits yet. Add some in the Habit Tracker!</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {todayHabits.map(h => {
                            const done = !!state.tracking[h.id]?.[t];
                            return (
                                <div key={h.id} onClick={() => dispatch({ type: "TOGGLE_TRACK", hid: h.id, date: t })}
                                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, cursor: "pointer", border: `1px solid ${done ? COLORS[h.category] + "44" : "var(--border)"}`, background: done ? COLORS[h.category] + "11" : "transparent", transition: "all .2s" }}>
                                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? COLORS[h.category] : "var(--border)"}`, background: done ? COLORS[h.category] : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}>
                                        {done && <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>✓</span>}
                                    </div>
                                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: done ? "var(--muted)" : "var(--text)", textDecoration: done ? "line-through" : "none" }}>{h.name}</span>
                                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: COLORS[h.category] + "22", color: COLORS[h.category], fontWeight: 600 }}>{h.category}</span>
                                    {state.streaks[h.id] > 0 && <span style={{ fontSize: 12, color: "#f59e0b" }}>🔥{state.streaks[h.id]}</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Habit Tracker (Monthly Grid) ────────────────────────────────────────────
function HabitTracker({ state, dispatch }) {
    const [selY, setSelY] = useState(new Date().getFullYear());
    const [selM, setSelM] = useState(new Date().getMonth());
    const [adding, setAdding] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: "", category: "Health" });
    const days = daysInMonth(selY, selM);
    const t = today();

    const getCompletion = (hid) => {
        let count = 0;
        for (let d = 1; d <= days; d++) {
            const dk = `${selY}-${pad(selM + 1)}-${pad(d)}`;
            if (state.tracking[hid]?.[dk]) count++;
        }
        return count;
    };

    const getLongestStreak = (hid) => {
        let max = 0, cur = 0;
        for (let d = 1; d <= days; d++) {
            const dk = `${selY}-${pad(selM + 1)}-${pad(d)}`;
            if (state.tracking[hid]?.[dk]) { cur++; max = Math.max(max, cur); } else cur = 0;
        }
        return max;
    };

    const addHabit = () => {
        if (!newHabit.name.trim()) return;
        dispatch({ type: "ADD_HABIT", habit: { id: genId(), name: newHabit.name.trim(), category: newHabit.category, created: today() } });
        setNewHabit({ name: "", category: "Health" }); setAdding(false);
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "var(--text)", margin: 0 }}>Habit Tracker</h2>
                    <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 0" }}>Track your daily habits</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={selM} onChange={e => setSelM(+e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 13 }}>
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select value={selY} onChange={e => setSelY(+e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 13 }}>
                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={() => setAdding(true)} style={{ padding: "8px 18px", borderRadius: 10, background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add Habit</button>
                </div>
            </div>

            {adding && (
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem", marginBottom: "1.5rem", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <input placeholder="Habit name (e.g. Exercise)" value={newHabit.name} onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addHabit()}
                        style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14 }} />
                    <select value={newHabit.category} onChange={e => setNewHabit(p => ({ ...p, category: e.target.value }))}
                        style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14 }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={addHabit} style={{ padding: "10px 20px", borderRadius: 10, background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Add</button>
                    <button onClick={() => setAdding(false)} style={{ padding: "10px 14px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontSize: 14 }}>Cancel</button>
                </div>
            )}

            {state.habits.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--muted)" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>◎</div>
                    <p style={{ fontSize: 16 }}>No habits yet. Click "+ Add Habit" to start!</p>
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted)", fontSize: 12, fontWeight: 600, background: "var(--card)", borderRadius: "12px 0 0 0", position: "sticky", left: 0, minWidth: 160 }}>Habit</th>
                                {Array.from({ length: days }, (_, i) => i + 1).map(d => {
                                    const dk = `${selY}-${pad(selM + 1)}-${pad(d)}`;
                                    const isToday = dk === t;
                                    return (
                                        <th key={d} style={{ padding: "10px 0", color: isToday ? "var(--accent)" : "var(--muted)", fontSize: 11, fontWeight: isToday ? 800 : 600, minWidth: 32, textAlign: "center" }}>{d}</th>
                                    );
                                })}
                                <th style={{ padding: "10px 14px", color: "var(--muted)", fontSize: 12, fontWeight: 600, minWidth: 100, textAlign: "center" }}>Stats</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.habits.map((h, ri) => {
                                const comp = getCompletion(h.id);
                                const ls = getLongestStreak(h.id);
                                const compPct = Math.round(comp / days * 100);
                                return (
                                    <tr key={h.id} style={{ borderTop: "1px solid var(--border)" }}>
                                        <td style={{ padding: "10px 14px", background: "var(--card)", position: "sticky", left: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[h.category], flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{h.name}</div>
                                                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{h.category}</div>
                                                </div>
                                                <button onClick={() => dispatch({ type: "DELETE_HABIT", hid: h.id })} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 16, opacity: 0.5 }}>×</button>
                                            </div>
                                        </td>
                                        {Array.from({ length: days }, (_, i) => i + 1).map(d => {
                                            const dk = `${selY}-${pad(selM + 1)}-${pad(d)}`;
                                            const done = !!state.tracking[h.id]?.[dk];
                                            const isFuture = dk > t;
                                            return (
                                                <td key={d} style={{ textAlign: "center", padding: 4 }}>
                                                    <div onClick={() => !isFuture && dispatch({ type: "TOGGLE_TRACK", hid: h.id, date: dk })}
                                                        style={{
                                                            width: 22, height: 22, borderRadius: 5, margin: "0 auto", cursor: isFuture ? "default" : "pointer", opacity: isFuture ? 0.3 : 1,
                                                            background: done ? COLORS[h.category] : "var(--bg)", border: `1.5px solid ${done ? COLORS[h.category] : "var(--border)"}`, transition: "all .15s",
                                                            display: "flex", alignItems: "center", justifyContent: "center"
                                                        }}>
                                                        {done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS[h.category] }}>{compPct}%</div>
                                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{comp}d · 🔥{ls}</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Weekly Todos ─────────────────────────────────────────────────────────────
function WeeklyTodos({ state, dispatch }) {
    const [filter, setFilter] = useState("all");
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ text: "", priority: "normal" });

    const todos = state.weekTodos.filter(t => {
        if (filter === "done") return t.done;
        if (filter === "pending") return !t.done;
        if (filter === "high") return t.priority === "high";
        return true;
    });
    const done = state.weekTodos.filter(t => t.done).length;
    const pct = state.weekTodos.length ? Math.round(done / state.weekTodos.length * 100) : 0;

    const add = () => {
        if (!form.text.trim()) return;
        dispatch({ type: "ADD_WEEK_TODO", todo: { id: genId(), text: form.text.trim(), priority: form.priority, done: false, created: today() } });
        setForm({ text: "", priority: "normal" }); setAdding(false);
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "var(--text)", margin: 0 }}>Weekly Todos</h2>
                    <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 0" }}>{done}/{state.weekTodos.length} completed</p>
                </div>
                <button onClick={() => setAdding(true)} style={{ padding: "8px 18px", borderRadius: 10, background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add Task</button>
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Progress</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--accent)" }}>{pct}%</span>
                </div>
                <div style={{ height: 10, background: "var(--bg)", borderRadius: 8 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,var(--accent),var(--accent2))", borderRadius: 8, transition: "width .4s" }} />
                </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
                {["all", "pending", "done", "high"].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: 10, border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`, background: filter === f ? "var(--accent-subtle)" : "transparent", color: filter === f ? "var(--accent)" : "var(--muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        {f === "high" ? "🔴 High Priority" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {adding && (
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input placeholder="Task description..." value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} onKeyDown={e => e.key === "Enter" && add()}
                        style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14 }} />
                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14 }}>
                        <option value="normal">Normal</option>
                        <option value="high">High Priority</option>
                        <option value="low">Low Priority</option>
                    </select>
                    <button onClick={add} style={{ padding: "10px 20px", borderRadius: 10, background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Add</button>
                    <button onClick={() => setAdding(false)} style={{ padding: "10px 14px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer" }}>Cancel</button>
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {todos.length === 0 && <p style={{ color: "var(--muted)", textAlign: "center", padding: "3rem 0", fontSize: 14 }}>No tasks found.</p>}
                {todos.map(todo => (
                    <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--card)", border: `1px solid ${todo.done ? "var(--border)" : todo.priority === "high" ? "#f8717133" : "var(--border)"}`, borderRadius: 12, transition: "all .15s" }}>
                        <div onClick={() => dispatch({ type: "TOGGLE_WEEK_TODO", id: todo.id })}
                            style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${todo.done ? "var(--accent)" : "var(--border)"}`, background: todo.done ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                            {todo.done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: todo.done ? "var(--muted)" : "var(--text)", textDecoration: todo.done ? "line-through" : "none" }}>{todo.text}</span>
                        {todo.priority === "high" && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#f8717122", color: "#f87171", fontWeight: 700 }}>High</span>}
                        {todo.priority === "low" && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#6b728022", color: "#6b7280", fontWeight: 700 }}>Low</span>}
                        <button onClick={() => dispatch({ type: "DELETE_WEEK_TODO", id: todo.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1 }}>×</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Monthly Todos ─────────────────────────────────────────────────────────────
function MonthlyTodos({ state, dispatch }) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ text: "", deadline: "", priority: "normal" });
    const done = state.monthTodos.filter(t => t.status === "done").length;
    const pct = state.monthTodos.length ? Math.round(done / state.monthTodos.length * 100) : 0;
    const STATUSES = ["todo", "in-progress", "done"];
    const STATUS_COLORS = { "todo": "#6b7280", "in-progress": "#f59e0b", "done": "#10b981" };

    const add = () => {
        if (!form.text.trim()) return;
        dispatch({ type: "ADD_MONTH_TODO", todo: { id: genId(), text: form.text.trim(), deadline: form.deadline, priority: form.priority, status: "todo", created: today() } });
        setForm({ text: "", deadline: "", priority: "normal" }); setAdding(false);
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "var(--text)", margin: 0 }}>Monthly Goals</h2>
                    <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 0" }}>{done}/{state.monthTodos.length} completed · {pct}%</p>
                </div>
                <button onClick={() => setAdding(true)} style={{ padding: "8px 18px", borderRadius: 10, background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add Goal</button>
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Monthly Progress</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#10b981" }}>{pct}%</span>
                </div>
                <div style={{ height: 10, background: "var(--bg)", borderRadius: 8 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#34d399)", borderRadius: 8, transition: "width .4s" }} />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    {STATUSES.map(s => {
                        const cnt = state.monthTodos.filter(t => t.status === s).length;
                        return <span key={s} style={{ fontSize: 12, color: STATUS_COLORS[s], fontWeight: 600 }}>{s}: {cnt}</span>;
                    })}
                </div>
            </div>

            {adding && (
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input placeholder="Goal description..." value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} onKeyDown={e => e.key === "Enter" && add()}
                        style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14 }} />
                    <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                        style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14 }} />
                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14 }}>
                        <option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option>
                    </select>
                    <button onClick={add} style={{ padding: "10px 20px", borderRadius: 10, background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Add</button>
                    <button onClick={() => setAdding(false)} style={{ padding: "10px 14px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer" }}>Cancel</button>
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {state.monthTodos.length === 0 && <p style={{ color: "var(--muted)", textAlign: "center", padding: "3rem 0", fontSize: 14 }}>No monthly goals yet. Add your first!</p>}
                {state.monthTodos.map(todo => (
                    <div key={todo.id} style={{ padding: "14px 16px", background: "var(--card)", border: "1px solid var(--border)", borderLeft: `4px solid ${STATUS_COLORS[todo.status]}`, borderRadius: 12 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: todo.status === "done" ? "var(--muted)" : "var(--text)", textDecoration: todo.status === "done" ? "line-through" : "none" }}>{todo.text}</div>
                                {todo.deadline && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Deadline: {fmtDate(todo.deadline)}</div>}
                            </div>
                            <select value={todo.status} onChange={e => dispatch({ type: "UPDATE_MONTH_TODO_STATUS", id: todo.id, status: e.target.value })}
                                style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${STATUS_COLORS[todo.status]}`, background: STATUS_COLORS[todo.status] + "22", color: STATUS_COLORS[todo.status], fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button onClick={() => dispatch({ type: "DELETE_MONTH_TODO", id: todo.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18 }}>×</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Analytics ─────────────────────────────────────────────────────────────────
function Analytics({ state }) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const monthlyData = useMemo(() => MONTHS.map((m, mi) => {
        const days = daysInMonth(year, mi);
        let total = 0, done = 0;
        state.habits.forEach(h => {
            for (let d = 1; d <= days; d++) {
                const dk = `${year}-${pad(mi + 1)}-${pad(d)}`;
                total++;
                if (state.tracking[h.id]?.[dk]) done++;
            }
        });
        return { month: m.slice(0, 3), pct: total ? Math.round(done / total * 100) : 0 };
    }), [state.habits, state.tracking]);

    const categoryData = useMemo(() => {
        const cats = {};
        state.habits.forEach(h => {
            if (!cats[h.category]) cats[h.category] = { name: h.category, total: 0, done: 0 };
            const days = daysInMonth(year, month);
            for (let d = 1; d <= days; d++) {
                const dk = `${year}-${pad(month + 1)}-${pad(d)}`;
                cats[h.category].total++;
                if (state.tracking[h.id]?.[dk]) cats[h.category].done++;
            }
        });
        return Object.values(cats).map(c => ({ ...c, pct: c.total ? Math.round(c.done / c.total * 100) : 0 }));
    }, [state.habits, state.tracking]);

    const heatData = useMemo(() => {
        const rows = [];
        for (let w = 11; w >= 0; w--) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const dt = new Date(); dt.setDate(dt.getDate() - (w * 7 + (6 - d)));
                const dk = dt.toISOString().slice(0, 10);
                const total = state.habits.length;
                const done = state.habits.filter(h => state.tracking[h.id]?.[dk]).length;
                week.push({ dk, pct: total ? Math.round(done / total * 100) : 0, done, total });
            }
            rows.push(week);
        }
        return rows;
    }, [state.habits, state.tracking]);

    const heatColor = (pct) => {
        if (pct === 0) return "var(--bg)";
        if (pct < 25) return "#6366f133";
        if (pct < 50) return "#6366f166";
        if (pct < 75) return "#6366f199";
        return "#6366f1";
    };

    return (
        <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "var(--text)", margin: "0 0 1.5rem" }}>Analytics</h2>

            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 15, color: "var(--text)", fontWeight: 700 }}>Activity Heatmap (Last 12 Weeks)</h3>
                <div style={{ display: "flex", gap: 3 }}>
                    {heatData.map((week, wi) => (
                        <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {week.map((day, di) => (
                                <div key={di} title={`${day.dk}: ${day.done}/${day.total} habits`}
                                    style={{ width: 14, height: 14, borderRadius: 3, background: heatColor(day.pct), border: "1px solid var(--border)", cursor: "default", transition: "all .15s" }} />
                            ))}
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 12 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>Less</span>
                    {[0, 25, 50, 75, 100].map(p => <div key={p} style={{ width: 12, height: 12, borderRadius: 3, background: heatColor(p), border: "1px solid var(--border)" }} />)}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>More</span>
                </div>
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 15, color: "var(--text)", fontWeight: 700 }}>Monthly Completion Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyData}>
                        <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                        <Tooltip formatter={v => `${v}%`} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }} />
                        <Line type="monotone" dataKey="pct" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: "var(--accent)", r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {categoryData.length > 0 && (
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem" }}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: 15, color: "var(--text)", fontWeight: 700 }}>Habit Performance by Category</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {categoryData.map(c => (
                            <div key={c.name}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.name}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS[c.name] }}>{c.pct}%</span>
                                </div>
                                <div style={{ height: 8, background: "var(--bg)", borderRadius: 6 }}>
                                    <div style={{ height: "100%", width: `${c.pct}%`, background: COLORS[c.name], borderRadius: 6, transition: "width .4s" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function Badges({ state }) {
    const earned = BADGES.filter(b => b.req(state));
    const notEarned = BADGES.filter(b => !b.req(state));
    return (
        <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "var(--text)", margin: "0 0 1.5rem" }}>Achievements</h2>
            {earned.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                    <h3 style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 1rem" }}>Earned ({earned.length})</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                        {earned.map(b => (
                            <div key={b.id} style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", borderRadius: 16, padding: "1.5rem", textAlign: "center" }}>
                                <div style={{ fontSize: 36, marginBottom: 10 }}>{b.icon}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{b.label}</div>
                                <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginTop: 4 }}>{b.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div>
                <h3 style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 1rem" }}>Locked ({notEarned.length})</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                    {notEarned.map(b => (
                        <div key={b.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem", textAlign: "center", opacity: 0.6 }}>
                            <div style={{ fontSize: 36, marginBottom: 10, filter: "grayscale(1)" }}>{b.icon}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>{b.label}</div>
                            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{b.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function Settings({ state, dispatch }) {
    const [name, setName] = useState(state.user?.name || "");
    const [saved, setSaved] = useState(false);
    const exportData = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "habitflow-backup.json"; a.click();
    };
    const clearData = () => {
        if (window.confirm("This will clear all your habit data. Are you sure?")) {
            dispatch({ type: "CLEAR_DATA" });
        }
    };
    const save = () => {
        dispatch({ type: "UPDATE_USER", name });
        setSaved(true); setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "var(--text)", margin: "0 0 1.5rem" }}>Settings</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem" }}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Profile</h3>
                    <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>Display Name</label>
                    <div style={{ display: "flex", gap: 10 }}>
                        <input value={name} onChange={e => setName(e.target.value)}
                            style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14 }} />
                        <button onClick={save} style={{ padding: "10px 20px", borderRadius: 10, background: saved ? "#10b981" : "var(--accent)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", transition: "background .3s" }}>
                            {saved ? "✓ Saved" : "Save"}
                        </button>
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)" }}>Email: {state.user?.email} · Joined: {state.user?.joined}</p>
                </div>

                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem" }}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Data Management</h3>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={exportData} style={{ padding: "10px 20px", borderRadius: 10, background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Export Backup</button>
                        <button onClick={clearData} style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", border: "1px solid #f87171", color: "#f87171", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Clear All Data</button>
                    </div>
                </div>

                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem" }}>
                    <h3 style={{ margin: "0 0 0.5rem", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>About HabitFlow</h3>
                    <p style={{ color: "var(--muted)", fontSize: 14, margin: 0, lineHeight: 1.7 }}>
                        HabitFlow is your premium productivity companion. Track habits, manage todos, and analyze your progress — all in one place. Data is stored locally in your browser.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function computeStreak(tracking, hid) {
    let streak = 0;
    const d = new Date();
    while (true) {
        const dk = d.toISOString().slice(0, 10);
        if (tracking[hid]?.[dk]) { streak++; d.setDate(d.getDate() - 1); } else break;
    }
    return streak;
}

function reducer(state, action) {
    let next;
    switch (action.type) {
        case "LOGIN": return { ...state, user: action.user };
        case "LOGOUT": return { ...defaultState, theme: state.theme };
        case "UPDATE_USER": return { ...state, user: { ...state.user, name: action.name } };
        case "CLEAR_DATA": return { ...state, habits: [], tracking: {}, weekTodos: [], monthTodos: [], streaks: {} };
        case "ADD_HABIT": return { ...state, habits: [...state.habits, action.habit] };
        case "DELETE_HABIT": {
            const habits = state.habits.filter(h => h.id !== action.hid);
            const tracking = { ...state.tracking }; delete tracking[action.hid];
            const streaks = { ...state.streaks }; delete streaks[action.hid];
            return { ...state, habits, tracking, streaks };
        }
        case "TOGGLE_TRACK": {
            const prev = state.tracking[action.hid]?.[action.date];
            const tracking = { ...state.tracking, [action.hid]: { ...state.tracking[action.hid], [action.date]: !prev } };
            const streaks = { ...state.streaks, [action.hid]: computeStreak(tracking, action.hid) };
            return { ...state, tracking, streaks };
        }
        case "ADD_WEEK_TODO": return { ...state, weekTodos: [...state.weekTodos, action.todo] };
        case "TOGGLE_WEEK_TODO": return { ...state, weekTodos: state.weekTodos.map(t => t.id === action.id ? { ...t, done: !t.done } : t) };
        case "DELETE_WEEK_TODO": return { ...state, weekTodos: state.weekTodos.filter(t => t.id !== action.id) };
        case "ADD_MONTH_TODO": return { ...state, monthTodos: [...state.monthTodos, action.todo] };
        case "UPDATE_MONTH_TODO_STATUS": return { ...state, monthTodos: state.monthTodos.map(t => t.id === action.id ? { ...t, status: action.status, done: action.status === "done" } : t) };
        case "DELETE_MONTH_TODO": return { ...state, monthTodos: state.monthTodos.filter(t => t.id !== action.id) };
        case "SET_THEME": return { ...state, theme: action.theme };
        default: return state;
    }
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
    const [state, rawDispatch] = useState(() => loadState());
    const [active, setActive] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const dispatch = useCallback((action) => {
        rawDispatch(prev => {
            const next = reducer(prev, action);
            saveState(next);
            return next;
        });
    }, []);

    const theme = state.theme || "dark";

    const CSS = theme === "dark" ? {
        "--bg-deep": "#0a0a0f",
        "--bg": "#12121a",
        "--sidebar": "#0f0f16",
        "--card": "#1a1a24",
        "--border": "#ffffff14",
        "--text": "#f0f0f5",
        "--muted": "#8888aa",
        "--accent": "#6366f1",
        "--accent2": "#8b5cf6",
        "--accent-subtle": "#6366f122",
    } : {
        "--bg-deep": "#f0f2f7",
        "--bg": "#f8f9fc",
        "--sidebar": "#ffffff",
        "--card": "#ffffff",
        "--border": "#e2e4ee",
        "--text": "#1a1b2e",
        "--muted": "#6b7280",
        "--accent": "#6366f1",
        "--accent2": "#8b5cf6",
        "--accent-subtle": "#6366f115",
    };

    if (!state.user) {
        return (
            <div style={CSS}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap');* { box-sizing: border-box; } input, select { outline: none; } button { font-family: inherit; }`}</style>
                <AuthScreen onAuth={u => dispatch({ type: "LOGIN", user: u })} />
            </div>
        );
    }

    const PAGE = { dashboard: Dashboard, habits: HabitTracker, weekly: WeeklyTodos, monthly: MonthlyTodos, analytics: Analytics, badges: Badges, settings: Settings };
    const PageComp = PAGE[active];

    return (
        <div style={{ ...CSS, minHeight: "100vh", background: "var(--bg-deep)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap');* { box-sizing: border-box; } input, select, button { font-family: inherit; } input:focus, select:focus { border-color: var(--accent) !important; } ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }`}</style>
            <Sidebar active={active} setActive={setActive} user={state.user} onLogout={() => dispatch({ type: "LOGOUT" })} theme={theme} setTheme={t => dispatch({ type: "SET_THEME", theme: t })} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main style={{ marginLeft: window.innerWidth > 768 ? 240 : 0, minHeight: "100vh", padding: "2rem 1.5rem" }}>
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <button onClick={() => setSidebarOpen(true)} style={{ display: window.innerWidth > 768 ? "none" : "block", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", color: "var(--text)", cursor: "pointer", marginBottom: "1rem", fontSize: 18 }}>☰</button>
                    <PageComp state={state} dispatch={dispatch} />
                </div>
            </main>
        </div>
    );
}
