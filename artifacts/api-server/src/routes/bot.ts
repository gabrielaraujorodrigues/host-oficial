import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

const BOT_DIR = path.resolve("../../bot");
const SETTINGS_FILE = path.join(BOT_DIR, "settings", "settings.json");
const SESSION_DIR = path.join(BOT_DIR, "bot-do-biel-session");
const LOG_DIR = "/tmp/logs";

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
  res.json({
    status,
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

export default router;
