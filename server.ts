import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-Memory Data Stores for real-time multi-device sync
export interface ServerLiveSession {
  sessionId: string;
  userId: string;
  username: string;
  fullName: string;
  role: "admin" | "employee";
  jobTitle: string;
  phone?: string;
  email?: string;
  device: string;
  browser: string;
  ip?: string;
  loginAt: string;
  lastHeartbeat: number;
  isBlocked?: boolean;
  status: "online" | "idle" | "terminated";
  token: string;
  terminationReason?: "concurrent_login" | "admin_forced" | "user_blocked" | "inactivity" | "logout";
  terminationMessage?: string;
  terminatedAt?: number;
}

let activeLiveSessions: Map<string, ServerLiveSession> = new Map();
let serverUsers: any[] = [];
let serverProjects: any[] = [];
let serverRules: any = null;

// Periodic cleanup of sessions terminated or dead for more than 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeLiveSessions.entries()) {
    const age = now - (session.lastHeartbeat || 0);
    // If no heartbeat for 45 seconds, mark as idle
    if (session.status === "online" && age > 40 * 1000) {
      session.status = "idle";
    }
    // If no heartbeat for > 3 minutes and not already terminated, terminate due to lost connection
    if (session.status !== "terminated" && age > 180 * 1000) {
      session.status = "terminated";
      session.terminationReason = "inactivity";
      session.terminationMessage = "Sesión cerrada por desconexión / inactividad prolongada.";
    }
    // Remove obsolete sessions from memory after 15 minutes
    if (session.status === "terminated" && session.terminatedAt && now - session.terminatedAt > 15 * 60 * 1000) {
      activeLiveSessions.delete(sessionId);
    }
  }
}, 5000);

// =========================================================================
// API ENDPOINTS - REALTIME SESSION MONITOR & MULTI-DEVICE MANAGEMENT
// =========================================================================

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: Date.now(), 
    activeOnlineUsers: Array.from(activeLiveSessions.values()).filter(s => s.status === "online").length 
  });
});

// 2. Register / Login session with SINGLE ACTIVE DEVICE ENFORCEMENT
app.post("/api/sessions/login", (req, res) => {
  try {
    const { userId, username, fullName, role, jobTitle, phone, email, device, browser } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({ success: false, error: "userId y username son obligatorios" });
    }

    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const token = `tct_tok_${now}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionId = `sess_${userId}_${now}_${Math.random().toString(36).substring(2, 6)}`;

    // SINGLE DEVICE PER USER RULE:
    // If user has other active/idle sessions, terminate them immediately with "concurrent_login"
    let terminatedPreviousCount = 0;
    for (const [existingId, existingSession] of activeLiveSessions.entries()) {
      if (
        (existingSession.userId === userId || existingSession.username.toLowerCase() === username.toLowerCase()) &&
        existingSession.status !== "terminated"
      ) {
        existingSession.status = "terminated";
        existingSession.terminationReason = "concurrent_login";
        existingSession.terminationMessage = "Tu cuenta ha sido abierta en otro equipo/dispositivo. Por política de seguridad institucional, esta sesión fue cerrada automáticamente.";
        existingSession.terminatedAt = now;
        terminatedPreviousCount++;
        console.log(`[TCT Security] User "${username}" logged in from new device (${device}). Superceded session ${existingId} on ${existingSession.device}.`);
      }
    }

    const newSession: ServerLiveSession = {
      sessionId,
      userId,
      username,
      fullName: fullName || username,
      role: role || "employee",
      jobTitle: jobTitle || (role === "admin" ? "Administrador General" : "Técnico de Producción"),
      phone: phone || "",
      email: email || "",
      device: device || "Dispositivo Web",
      browser: browser || "Navegador Web",
      ip: clientIp,
      loginAt: new Date().toISOString(),
      lastHeartbeat: now,
      isBlocked: false,
      status: "online",
      token
    };

    activeLiveSessions.set(sessionId, newSession);

    res.json({
      success: true,
      sessionId,
      token,
      hadPreviousSession: terminatedPreviousCount > 0,
      session: newSession
    });
  } catch (err: any) {
    console.error("Error in /api/sessions/login:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Heartbeat ping (called by client every 2-3 seconds)
app.post("/api/sessions/heartbeat", (req, res) => {
  try {
    const { sessionId, token, isIdle } = req.body;
    if (!sessionId || !token) {
      return res.status(400).json({ valid: false, error: "sessionId y token requeridos" });
    }

    const session = activeLiveSessions.get(sessionId);
    if (!session) {
      return res.json({
        valid: false,
        status: "terminated",
        reason: "inactivity",
        message: "Sesión expirada o no encontrada en el servidor. Inicie sesión nuevamente."
      });
    }

    // Verify token
    if (session.token !== token) {
      return res.json({
        valid: false,
        status: "terminated",
        reason: "concurrent_login",
        message: "Token de sesión no coincide. Se inició sesión en otro dispositivo."
      });
    }

    // Check if session was terminated (by admin, block, or concurrent login)
    if (session.status === "terminated") {
      return res.json({
        valid: false,
        status: "terminated",
        reason: session.terminationReason || "admin_forced",
        message: session.terminationMessage || "Esta sesión ha sido finalizada."
      });
    }

    // Session is valid, update heartbeat
    session.lastHeartbeat = Date.now();
    session.status = isIdle ? "idle" : "online";

    res.json({
      valid: true,
      status: session.status
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// 4. Get all active sessions for Admin Monitor
app.get("/api/sessions/active", (req, res) => {
  try {
    const now = Date.now();
    const sessionsList: ServerLiveSession[] = [];

    for (const session of activeLiveSessions.values()) {
      // If terminated and older than 5 mins, skip
      if (session.status === "terminated" && session.terminatedAt && now - session.terminatedAt > 5 * 60 * 1000) {
        continue;
      }
      // Check if stale
      const diff = now - (session.lastHeartbeat || 0);
      if (session.status !== "terminated") {
        if (diff > 60 * 1000) {
          session.status = "idle";
        }
      }
      sessionsList.push(session);
    }

    // Sort: online first, then idle, then newest login
    sessionsList.sort((a, b) => {
      if (a.status === "online" && b.status !== "online") return -1;
      if (b.status === "online" && a.status !== "online") return 1;
      return (b.lastHeartbeat || 0) - (a.lastHeartbeat || 0);
    });

    res.json({
      success: true,
      totalCount: sessionsList.length,
      onlineCount: sessionsList.filter(s => s.status === "online").length,
      idleCount: sessionsList.filter(s => s.status === "idle").length,
      sessions: sessionsList
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Terminate / Kick a session (Admin action)
app.post("/api/sessions/terminate", (req, res) => {
  try {
    const { sessionId, userId, reason } = req.body;
    let terminatedCount = 0;

    if (sessionId) {
      const session = activeLiveSessions.get(sessionId);
      if (session) {
        session.status = "terminated";
        session.terminationReason = "admin_forced";
        session.terminationMessage = reason || "Tu sesión fue cerrada remotamente por el Administrador de Corporación TCT.";
        session.terminatedAt = Date.now();
        terminatedCount++;
      }
    } else if (userId) {
      for (const session of activeLiveSessions.values()) {
        if (session.userId === userId) {
          session.status = "terminated";
          session.terminationReason = "admin_forced";
          session.terminationMessage = reason || "Tu sesión fue cerrada remotamente por el Administrador.";
          session.terminatedAt = Date.now();
          terminatedCount++;
        }
      }
    }

    res.json({ success: true, terminatedCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Block user account and kick all their sessions (Admin action)
app.post("/api/sessions/block-user", (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId requerido" });
    }

    // Terminate all sessions for this user
    for (const session of activeLiveSessions.values()) {
      if (session.userId === userId) {
        session.isBlocked = true;
        session.status = "terminated";
        session.terminationReason = "user_blocked";
        session.terminationMessage = "Tu cuenta de usuario ha sido bloqueada/desactivada por el Administrador. Contacte a la gerencia de Corporación TCT.";
        session.terminatedAt = Date.now();
      }
    }

    res.json({ success: true, message: `Usuario ${userId} bloqueado y expulsado del sistema.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Unblock user
app.post("/api/sessions/unblock-user", (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId requerido" });
    }

    for (const session of activeLiveSessions.values()) {
      if (session.userId === userId) {
        session.isBlocked = false;
      }
    }

    res.json({ success: true, message: `Usuario ${userId} desbloqueado.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Clean logout from current device
app.post("/api/sessions/logout", (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      const session = activeLiveSessions.get(sessionId);
      if (session) {
        session.status = "terminated";
        session.terminationReason = "logout";
        session.terminationMessage = "Sesión cerrada correctamente.";
        session.terminatedAt = Date.now();
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8b. Terminate/Purge ALL active sessions immediately (Force global re-login)
app.post("/api/sessions/clear-all", (req, res) => {
  try {
    const now = Date.now();
    let count = 0;
    for (const session of activeLiveSessions.values()) {
      session.status = "terminated";
      session.terminationReason = "admin_forced";
      session.terminationMessage = "El sistema ha cerrado todas las sesiones activas. Por favor, inicie sesión nuevamente.";
      session.terminatedAt = now;
      count++;
    }
    activeLiveSessions.clear();
    console.log(`[TCT Security] Purged all ${count} active sessions.`);
    res.json({ success: true, count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Sync Projects & Data across multi-devices
app.get("/api/sync/projects", (req, res) => {
  res.json({ success: true, projects: serverProjects });
});

app.post("/api/sync/projects", (req, res) => {
  try {
    const { projects } = req.body;
    if (Array.isArray(projects)) {
      serverProjects = projects;
    }
    res.json({ success: true, count: serverProjects.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Sync Rules
app.get("/api/sync/rules", (req, res) => {
  res.json({ success: true, rules: serverRules });
});

app.post("/api/sync/rules", (req, res) => {
  try {
    const { rules } = req.body;
    if (rules) {
      serverRules = rules;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// VITE MIDDLEWARE SETUP & STATIC SERVING
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TCT Server] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
