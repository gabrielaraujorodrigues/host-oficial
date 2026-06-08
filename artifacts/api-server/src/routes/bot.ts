import { Router } from "express";
import fs from "fs";
import path from "path";
import { spawn, execSync, ChildProcess } from "child_process";

const router = Router();

const BOT_DIR = path.resolve("../../bot");
const SETTINGS_FILE = path.join(BOT_DIR, "settings", "settings.json");
const SESSION_DIR = path.join(BOT_DIR, "bot-do-biel-session");
const LOG_DIR = "/tmp/logs";

let botProcess: ChildProcess | null = null;

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
  } catch {
    return null;
  }
}

function getBotStatus() {
  try {
    const sessionExists = fs.existsSync(SESSION_DIR);
    const credsFile = path.join(SESSION_DIR, "creds.json");
    const connected = sessionExists && fs.existsSync(credsFile);
    return connected ? "conectado" : "desconectado";
  } catch {
    return "desconhecido";
  }
}

function isBotRunning(): boolean {
  if (botProcess && !botProcess.killed) {
    try {
      process.kill(botProcess.pid!, 0);
      return true;
    } catch {
      botProcess = null;
    }
  }
  try {
    const out = execSync("pgrep -f 'node index.js'", { encoding: "utf8" }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function startBot(): { ok: boolean; message: string } {
  if (isBotRunning()) {
    return { ok: false, message: "Bot já está em execução." };
  }
  try {
    const child = spawn("node", ["index.js"], {
      cwd: BOT_DIR,
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    botProcess = child;
    return { ok: true, message: "Bot iniciado com sucesso!" };
  } catch (e) {
    return { ok: false, message: "Erro ao iniciar bot: " + String(e) };
  }
}

function stopBot(): { ok: boolean; message: string } {
  try {
    execSync("pkill -f 'node index.js' || true");
    botProcess = null;
    return { ok: true, message: "Bot parado com sucesso!" };
  } catch (e) {
    return { ok: false, message: "Erro ao parar bot: " + String(e) };
  }
}

function getRecentLogs(lines = 80): string[] {
  try {
    if (!fs.existsSync(LOG_DIR)) return [];
    const files = fs
      .readdirSync(LOG_DIR)
      .filter((f) => f.startsWith("Bot_do_Biel"))
      .sort()
      .reverse();
    if (!files.length) return [];
    const content = fs.readFileSync(path.join(LOG_DIR, files[0]), "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .slice(-lines)
      .reverse();
  } catch {
    return [];
  }
}

router.get("/status", (_req, res) => {
  const settings = readSettings();
  const status = getBotStatus();
  const running = isBotRunning();
  res.json({
    status,
    running,
    botName: settings?.botName ?? "Bot do Biel",
    ownerNumber: settings?.ownerNumber ?? "",
    prefix: settings?.prefix ?? [],
    uptime: process.uptime(),
    ts: Date.now(),
  });
});

router.get("/logs", (_req, res) => {
  res.json({ logs: getRecentLogs(100) });
});

router.get("/settings", (_req, res) => {
  const s = readSettings();
  if (!s) return res.status(500).json({ error: "Não foi possível ler settings.json" });
  res.json(s);
});

router.put("/settings", (req, res) => {
  try {
    const current = readSettings();
    if (!current) return res.status(500).json({ error: "Não foi possível ler settings.json" });
    const updated = { ...current, ...req.body };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2));
    res.json({ ok: true, settings: updated });
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/start", (_req, res) => {
  const result = startBot();
  res.json(result);
});

router.post("/stop", (_req, res) => {
  const result = stopBot();
  res.json(result);
});

router.post("/restart", (_req, res) => {
  stopBot();
  setTimeout(() => {
    const result = startBot();
    res.json({ ok: result.ok, message: "Bot reiniciado! " + result.message });
  }, 1500);
});

export default router;
