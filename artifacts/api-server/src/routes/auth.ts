import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import cookieParser from "cookie-parser";

export const PANEL_PASSWORD = process.env.PANEL_PASSWORD || "bielbot2025";
const SECRET = process.env.SESSION_SECRET || "biel-secret-2025";
const COOKIE = "painel_token";
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function makeToken(pass: string): string {
  return crypto.createHmac("sha256", SECRET).update(pass).digest("hex");
}

export const VALID_TOKEN = makeToken(PANEL_PASSWORD);

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (token === VALID_TOKEN) return next();
  res.redirect("/api/login?next=" + encodeURIComponent(req.originalUrl));
}

const router = Router();

router.use(cookieParser());

router.get("/login", (req, res) => {
  const erro = req.query.erro;
  const next = req.query.next || "/api/painel";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Bot do Biel — Login</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0d0f14;--card:#161b22;--border:#30363d;--green:#2ea043;--red:#da3633;--text:#e6edf3;--muted:#8b949e;--accent:#58a6ff}
  body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
  .box{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:40px 36px;width:100%;max-width:380px}
  .logo{text-align:center;font-size:24px;font-weight:700;color:var(--accent);margin-bottom:6px}
  .logo span{color:var(--green)}
  .sub{text-align:center;font-size:13px;color:var(--muted);margin-bottom:28px}
  label{display:block;font-size:13px;color:var(--muted);margin-bottom:6px;font-weight:500}
  input{width:100%;background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:12px 14px;color:var(--text);font-size:15px;outline:none;transition:border-color .2s;margin-bottom:20px}
  input:focus{border-color:var(--accent)}
  button{width:100%;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s}
  button:hover{opacity:.85}
  .erro{background:#2d1b1b;border:1px solid var(--red);border-radius:8px;padding:10px 14px;color:#f85149;font-size:13px;margin-bottom:18px;text-align:center}
</style>
</head>
<body>
<div class="box">
  <div class="logo">🤖 Bot do <span>Biel</span></div>
  <div class="sub">Painel de Controle — Acesso Restrito</div>
  ${erro ? '<div class="erro">❌ Senha incorreta. Tente novamente.</div>' : ""}
  <form method="POST" action="/api/login">
    <input type="hidden" name="next" value="${next}"/>
    <label>Senha de acesso</label>
    <input type="password" name="password" placeholder="••••••••••" autofocus/>
    <button type="submit">🔓 Entrar</button>
  </form>
</div>
</body>
</html>`);
});

router.post("/login", (req, res) => {
  const { password, next } = req.body;
  const dest = (typeof next === "string" && next.startsWith("/")) ? next : "/api/painel";
  if (password === PANEL_PASSWORD) {
    res.cookie(COOKIE, VALID_TOKEN, { httpOnly: true, maxAge: MAX_AGE, sameSite: "lax" });
    return res.redirect(dest);
  }
  res.redirect("/api/login?erro=1&next=" + encodeURIComponent(dest));
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE);
  res.redirect("/api/login");
});

export default router;
