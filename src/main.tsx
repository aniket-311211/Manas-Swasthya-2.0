import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { Component, ErrorInfo, ReactNode } from "react";
import App from "./App.tsx";
import "./index.css";
import { setupI18n } from "./i18n";

// ─── Global Error Boundary ────────────────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "16px", padding: "40px", maxWidth: "640px", width: "100%" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>💥</div>
            <h1 style={{ color: "#fca5a5", fontSize: "22px", fontWeight: 700, margin: "0 0 12px" }}>App Runtime Error</h1>
            <p style={{ color: "#94a3b8", margin: "0 0 16px", fontSize: "14px" }}>
              The app crashed. See the error below. Open browser console (F12) for full details.
            </p>
            <pre style={{ background: "rgba(0,0,0,0.4)", color: "#f87171", padding: "16px", borderRadius: "10px", fontSize: "12px", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {this.state.error?.message}
              {"\n\n"}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: "20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Key Check ───────────────────────────────────────────────────────────────
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const isKeyMissing =
  !PUBLISHABLE_KEY ||
  PUBLISHABLE_KEY === "your_clerk_publishable_key_here" ||
  PUBLISHABLE_KEY.trim() === "";

// ─── Setup Page (shown when .env not configured) ──────────────────────────────
const SetupPage = () => (
  <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px" }}>
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "48px", maxWidth: "600px", width: "100%", backdropFilter: "blur(20px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🧠</div>
        <h1 style={{ color: "#fff", fontSize: "26px", fontWeight: 700, margin: "0 0 8px" }}>ManasSwasthya — Setup Required</h1>
        <p style={{ color: "#94a3b8", fontSize: "15px", margin: 0 }}>
          Your <code style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "2px 6px", borderRadius: "4px" }}>.env</code> file needs to be configured.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "20px" }}>
          <p style={{ color: "#fca5a5", fontWeight: 600, margin: "0 0 6px" }}>1. Clerk Publishable Key</p>
          <p style={{ color: "#94a3b8", margin: "0 0 8px", fontSize: "13px" }}>Get from <strong style={{ color: "#93c5fd" }}>dashboard.clerk.com</strong> → API Keys</p>
          <code style={{ display: "block", background: "rgba(0,0,0,0.3)", color: "#f59e0b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code>
        </div>
        <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "12px", padding: "20px" }}>
          <p style={{ color: "#93c5fd", fontWeight: 600, margin: "0 0 6px" }}>2. Gemini AI API Key</p>
          <p style={{ color: "#94a3b8", margin: "0 0 8px", fontSize: "13px" }}>Get from <strong style={{ color: "#93c5fd" }}>aistudio.google.com/apikey</strong></p>
          <code style={{ display: "block", background: "rgba(0,0,0,0.3)", color: "#f59e0b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>VITE_GEMINI_API_KEY=AIza...{"\n"}GEMINI_API_KEY=AIza...</code>
        </div>
        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px", padding: "20px" }}>
          <p style={{ color: "#86efac", fontWeight: 600, margin: "0 0 6px" }}>3. Neon PostgreSQL URL</p>
          <p style={{ color: "#94a3b8", margin: "0 0 8px", fontSize: "13px" }}>Get from <strong style={{ color: "#93c5fd" }}>console.neon.tech</strong> → Connection Details</p>
          <code style={{ display: "block", background: "rgba(0,0,0,0.3)", color: "#f59e0b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>DATABASE_URL=postgresql://user:pass@host/db?sslmode=require</code>
        </div>
      </div>
      <div style={{ marginTop: "28px", padding: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", textAlign: "center" }}>
        <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 4px" }}>After updating <code style={{ color: "#f59e0b" }}>nexus-mind-care/.env</code>, run:</p>
        <code style={{ color: "#a3e635", fontSize: "13px" }}>npm run dev</code>
      </div>
    </div>
  </div>
);

// ─── Boot ────────────────────────────────────────────────────────────────────
if (isKeyMissing) {
  createRoot(document.getElementById("root")!).render(<SetupPage />);
} else {
  const mount = () => {
    createRoot(document.getElementById("root")!).render(
      <ErrorBoundary>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <App />
        </ClerkProvider>
      </ErrorBoundary>
    );
  };

  setupI18n().then(mount).catch((err) => {
    console.error("i18n init failed, mounting anyway:", err);
    mount();
  });
}
