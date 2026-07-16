"use client";

import { useEffect, useState } from "react";

type Daily = {
  date: string;
  visits: number;
  uniqueUsers: number;
  questionsAnswered: number;
  questionsCorrect: number;
  anamnesisCompleted: number;
  scenariosStarted: number;
  scenariosCompleted: number;
  examsCompleted: number;
  examScoreSum: number;
};

type StatsPayload = {
  ok: boolean;
  persistent: boolean;
  generatedAt: number;
  totalUsers: number;
  today: Daily;
  last14days: Daily[];
  totals: Omit<Daily, "date">;
  topics: { topic: string; answered: number; correct: number; accuracy: number }[];
  scenarios: { id: string; started: number; completed: number; completionRate: number }[];
  anamnesis: { id: string; completed: number }[];
  examAccuracy: number;
  examAvgScore: number;
  scenarioCompletionRate: number;
};

const PW_KEY = "admin-pw";

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatsPayload | null>(null);

  useEffect(() => {
    const p = sessionStorage.getItem(PW_KEY);
    if (p) {
      setSaved(p);
      fetchStats(p);
    }
  }, []);

  const fetchStats = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/stats", {
        headers: { "x-admin-password": password },
        cache: "no-store",
      });
      if (r.status === 401) {
        sessionStorage.removeItem(PW_KEY);
        setSaved(null);
        setError("סיסמה שגויה");
        return;
      }
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "בעיה בשליפה");
      setData(j);
      sessionStorage.setItem(PW_KEY, password);
      setSaved(password);
    } catch (e: any) {
      setError(e?.message || "שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(PW_KEY);
    setSaved(null);
    setData(null);
    setPw("");
  };

  if (!saved) {
    return (
      <main dir="rtl" style={styles.gate}>
        <div style={styles.gateCard}>
          <div style={styles.gateIcon}>🔐</div>
          <h1 style={styles.gateTitle}>אזור ניהול</h1>
          <p style={styles.gateHint}>גישה עם סיסמת אדמין</p>
          <input
            type="password"
            placeholder="סיסמה"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pw && fetchStats(pw)}
            style={styles.gateInput}
            autoFocus
          />
          <button
            onClick={() => pw && fetchStats(pw)}
            disabled={!pw || loading}
            style={styles.gateBtn}
          >
            {loading ? "טוען..." : "כניסה"}
          </button>
          {error && <div style={styles.gateError}>{error}</div>}
          <a href="/" style={styles.gateBack}>
            ← חזרה ליישום
          </a>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main dir="rtl" style={styles.gate}>
        <div style={{ color: "#F26522", fontWeight: 700 }}>טוען נתונים…</div>
      </main>
    );
  }

  const wowNum = (n: number) => (n || 0).toLocaleString("he-IL");
  const maxVisits = Math.max(1, ...data.last14days.map((d) => d.visits));

  return (
    <main dir="rtl" style={styles.page}>
      <header style={styles.topBar}>
        <div style={styles.brand}>
          <span style={styles.brandDot}>+</span>
          <span>לוח ניהול</span>
          <span style={styles.brandSub}>· תרגול חובשים</span>
        </div>
        <div style={styles.topActions}>
          <button
            onClick={() => saved && fetchStats(saved)}
            style={styles.refreshBtn}
            disabled={loading}
          >
            {loading ? "מרענן…" : "🔄 רענן"}
          </button>
          <a href="/" style={styles.homeBtn}>
            ליישום ←
          </a>
          <button onClick={logout} style={styles.logoutBtn}>
            יציאה
          </button>
        </div>
      </header>

      {!data.persistent && (
        <div style={styles.warnBanner}>
          ⚠️ אין מסד נתונים מחובר. הסטטיסטיקות שנצפו כאן שוכנות בזיכרון של השרת
          ויימחקו בהיפוך cold-start. חבר <b>Vercel KV</b> ב-Dashboard כדי
          לצבור נתונים לאורך זמן.
        </div>
      )}

      <section style={styles.wrap}>
        {/* KPIs */}
        <div style={styles.kpiGrid}>
          <KpiCard
            icon="👥"
            label="משתמשים ייחודיים סה״כ"
            value={wowNum(data.totalUsers)}
            accent="#F26522"
          />
          <KpiCard
            icon="🚪"
            label="כניסות היום"
            value={wowNum(data.today?.visits || 0)}
            sub={`${wowNum(data.today?.uniqueUsers || 0)} משתמשים ייחודיים`}
            accent="#0d9488"
          />
          <KpiCard
            icon="📝"
            label="שאלות נענו (14 יום)"
            value={wowNum(data.totals.questionsAnswered)}
            sub={`דיוק כללי: ${data.examAccuracy}%`}
            accent="#7c3aed"
          />
          <KpiCard
            icon="🎯"
            label="ציון ממוצע במבחן"
            value={data.examAvgScore + "%"}
            sub={`${wowNum(data.totals.examsCompleted)} מבחנים הושלמו`}
            accent="#dc2626"
          />
          <KpiCard
            icon="🎙️"
            label="אנמנזות שהושלמו (14 יום)"
            value={wowNum(data.totals.anamnesisCompleted)}
            accent="#6366f1"
          />
          <KpiCard
            icon="🚨"
            label="תרחישים - השלמה"
            value={data.scenarioCompletionRate + "%"}
            sub={`${wowNum(data.totals.scenariosStarted)} התחלות · ${wowNum(
              data.totals.scenariosCompleted
            )} השלמות`}
            accent="#ea580c"
          />
        </div>

        {/* Daily chart - visits over 14 days */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.h2}>כניסות ב-14 הימים האחרונים</h2>
            <span style={styles.mutedSm}>מקסימום: {wowNum(maxVisits)}</span>
          </div>
          <div style={styles.chart}>
            {data.last14days.map((d) => {
              const pct = Math.max(2, Math.round((100 * d.visits) / maxVisits));
              const isToday = d.date === data.today.date;
              return (
                <div key={d.date} style={styles.chartCol}>
                  <div style={styles.chartVal}>{d.visits}</div>
                  <div style={styles.chartBarWrap}>
                    <div
                      style={{
                        ...styles.chartBar,
                        height: pct + "%",
                        background: isToday
                          ? "linear-gradient(180deg, #F26522, #C7401F)"
                          : "linear-gradient(180deg, #FFB147, #F26522)",
                      }}
                    />
                  </div>
                  <div style={styles.chartLbl}>{d.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two column: topics + scenarios */}
        <div style={styles.twoCol}>
          <div style={styles.card}>
            <h2 style={styles.h2}>נושאים - שאלות + דיוק</h2>
            {data.topics.length === 0 ? (
              <div style={styles.empty}>אין נתונים עדיין.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>נושא</th>
                    <th style={styles.thNum}>נענו</th>
                    <th style={styles.thNum}>נכונות</th>
                    <th style={styles.thNum}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topics.map((t) => (
                    <tr key={t.topic}>
                      <td style={styles.td}>{t.topic}</td>
                      <td style={styles.tdNum}>{wowNum(t.answered)}</td>
                      <td style={styles.tdNum}>{wowNum(t.correct)}</td>
                      <td
                        style={{
                          ...styles.tdNum,
                          color:
                            t.accuracy >= 75
                              ? "#059669"
                              : t.accuracy >= 50
                              ? "#d97706"
                              : "#dc2626",
                          fontWeight: 700,
                        }}
                      >
                        {t.accuracy}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>תרחישים - התחלות + השלמות</h2>
            {data.scenarios.length === 0 ? (
              <div style={styles.empty}>אין נתונים עדיין.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>מזהה</th>
                    <th style={styles.thNum}>התחיל</th>
                    <th style={styles.thNum}>סיים</th>
                    <th style={styles.thNum}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scenarios.map((s) => (
                    <tr key={s.id}>
                      <td style={styles.tdSmall}>{s.id}</td>
                      <td style={styles.tdNum}>{wowNum(s.started)}</td>
                      <td style={styles.tdNum}>{wowNum(s.completed)}</td>
                      <td
                        style={{
                          ...styles.tdNum,
                          color:
                            s.completionRate >= 75
                              ? "#059669"
                              : s.completionRate >= 50
                              ? "#d97706"
                              : "#dc2626",
                          fontWeight: 700,
                        }}
                      >
                        {s.completionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Anamnesis */}
        <div style={styles.card}>
          <h2 style={styles.h2}>מקרי אנמנזה - השלמות</h2>
          {data.anamnesis.length === 0 ? (
            <div style={styles.empty}>אין נתונים עדיין.</div>
          ) : (
            <div style={styles.anamnesisGrid}>
              {data.anamnesis.map((a) => (
                <div key={a.id} style={styles.anamnesisCell}>
                  <div style={styles.anamnesisId}>{a.id}</div>
                  <div style={styles.anamnesisNum}>{wowNum(a.completed)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer style={styles.footer}>
          עודכן: {new Date(data.generatedAt).toLocaleString("he-IL")}
          {" · "}
          מקור אחסון: {data.persistent ? "Vercel KV (מחזיק)" : "זיכרון בלבד"}
        </footer>
      </section>
    </main>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div style={{ ...styles.kpi, borderTop: `4px solid ${accent}` }}>
      <div style={styles.kpiIcon}>{icon}</div>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
      {sub && <div style={styles.kpiSub}>{sub}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  gate: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #FFF9F3 0%, #FDF1E4 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily:
      '"Segoe UI", -apple-system, BlinkMacSystemFont, "Arial Hebrew", sans-serif',
  },
  gateCard: {
    background: "#fff",
    padding: 40,
    borderRadius: 24,
    boxShadow: "0 20px 50px rgba(199,64,31,0.15)",
    maxWidth: 400,
    width: "100%",
    textAlign: "center",
  },
  gateIcon: { fontSize: 48, marginBottom: 12 },
  gateTitle: {
    fontSize: 26,
    fontWeight: 900,
    margin: "0 0 8px",
    color: "#1A1614",
  },
  gateHint: { color: "#7A6F65", marginBottom: 24, fontSize: 14 },
  gateInput: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid #F0E4D6",
    fontSize: 16,
    marginBottom: 12,
    fontFamily: "inherit",
    direction: "ltr",
    textAlign: "center",
    letterSpacing: "0.15em",
  },
  gateBtn: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #F26522, #C7401F)",
    color: "#fff",
    border: 0,
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  gateError: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: 600,
  },
  gateBack: {
    display: "block",
    marginTop: 20,
    fontSize: 13,
    color: "#7A6F65",
    textDecoration: "none",
  },
  page: {
    minHeight: "100vh",
    background: "#FFF9F3",
    color: "#1A1614",
    fontFamily:
      '"Segoe UI", -apple-system, BlinkMacSystemFont, "Arial Hebrew", sans-serif',
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "#fff",
    borderBottom: "1px solid #F0E4D6",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontWeight: 900,
    fontSize: 17,
  },
  brandDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, #F26522, #C7401F)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 900,
  },
  brandSub: { color: "#7A6F65", fontWeight: 500 },
  topActions: { display: "flex", gap: 10, alignItems: "center" },
  refreshBtn: {
    padding: "8px 16px",
    borderRadius: 999,
    background: "#F26522",
    color: "#fff",
    border: 0,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  homeBtn: {
    padding: "8px 16px",
    borderRadius: 999,
    background: "#1A1614",
    color: "#FFF9F3",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
  },
  logoutBtn: {
    padding: "8px 16px",
    borderRadius: 999,
    background: "transparent",
    color: "#7A6F65",
    border: "1px solid #F0E4D6",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  warnBanner: {
    margin: "16px 32px 0",
    padding: 14,
    borderRadius: 14,
    background: "#FEF3C7",
    color: "#78350F",
    border: "1px solid #FDE68A",
    fontSize: 14,
    lineHeight: 1.55,
  },
  wrap: { padding: "24px 32px 60px", maxWidth: 1280, margin: "0 auto" },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  kpi: {
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(199,64,31,0.06)",
  },
  kpiIcon: { fontSize: 24, marginBottom: 6 },
  kpiLabel: {
    fontSize: 12,
    color: "#7A6F65",
    fontWeight: 700,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: 900,
    color: "#1A1614",
    lineHeight: 1,
    letterSpacing: -0.5,
  },
  kpiSub: { fontSize: 12, color: "#7A6F65", marginTop: 6 },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    boxShadow: "0 4px 12px rgba(199,64,31,0.06)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  h2: { fontSize: 17, fontWeight: 800, margin: 0, color: "#1A1614" },
  mutedSm: { fontSize: 12, color: "#7A6F65", fontWeight: 600 },
  chart: {
    display: "grid",
    gridTemplateColumns: "repeat(14, 1fr)",
    gap: 8,
    height: 200,
    alignItems: "end",
  },
  chartCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    height: "100%",
  },
  chartVal: { fontSize: 11, color: "#7A6F65", fontWeight: 700 },
  chartBarWrap: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "end",
  },
  chartBar: {
    width: "100%",
    borderRadius: "6px 6px 0 0",
    transition: "height 0.5s ease",
  },
  chartLbl: { fontSize: 10, color: "#7A6F65", fontWeight: 600 },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginTop: 16,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "right",
    padding: "10px 8px",
    fontSize: 12,
    color: "#7A6F65",
    fontWeight: 700,
    borderBottom: "1px solid #F0E4D6",
  },
  thNum: {
    textAlign: "left",
    padding: "10px 8px",
    fontSize: 12,
    color: "#7A6F65",
    fontWeight: 700,
    borderBottom: "1px solid #F0E4D6",
  },
  td: {
    padding: "10px 8px",
    fontSize: 14,
    borderBottom: "1px solid #FDF1E4",
  },
  tdSmall: {
    padding: "10px 8px",
    fontSize: 12,
    borderBottom: "1px solid #FDF1E4",
    fontFamily: "monospace",
    direction: "ltr",
    textAlign: "left",
  },
  tdNum: {
    padding: "10px 8px",
    fontSize: 14,
    textAlign: "left",
    fontVariantNumeric: "tabular-nums",
    borderBottom: "1px solid #FDF1E4",
  },
  empty: {
    padding: 30,
    textAlign: "center",
    color: "#7A6F65",
    fontSize: 14,
  },
  anamnesisGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
  },
  anamnesisCell: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    background: "#FDF1E4",
    borderRadius: 10,
  },
  anamnesisId: {
    fontSize: 12,
    fontFamily: "monospace",
    direction: "ltr",
    color: "#3E3A36",
  },
  anamnesisNum: {
    fontSize: 18,
    fontWeight: 800,
    color: "#C7401F",
  },
  footer: {
    marginTop: 32,
    textAlign: "center",
    fontSize: 12,
    color: "#7A6F65",
  },
};
