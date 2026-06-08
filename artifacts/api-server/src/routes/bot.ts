import { Router, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { spawn, execSync, ChildProcess } from "child_process";

const router = Router();

const BOT_DIR = path.resolve("../../bot");
const SETTINGS_FILE = path.join(BOT_DIR, "settings", "settings.json");
const SESSION_DIR = path.join(BOT_DIR, "bot-do-biel-session");

let botProcess: ChildProcess | null = null;

// Ring buffer para guardar as últimas 500 linhas do terminal
const MAX_LINES = 500;
const terminalLines: string[] = [];
// SSE clients ativos
const sseClients: Set<Response> = new Set();

function pushLine(line: string) {
  terminalLines.push(line);
  if (terminalLines.length > MAX_LINES) terminalLines.shift();
  const data = JSON.stringify({ line });
  for (const res of sseClients) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(res);
    }
  }
}

function attachProcessIO(child: ChildProcess) {
  child.stdout?.setEncoding("utf8");
  child.stderr?.setEncoding("utf8");

  const splitLines = (chunk: string) =>
    chunk.split(/\r?\n/).filter((l) => l.length > 0);

  child.stdout?.on("data", (chunk: string) => {
    splitLines(chunk).forEach(pushLine);
  });
  child.stderr?.on("data", (chunk: string) => {
    splitLines(chunk).forEach((l) => pushLine("[STDERR] " + l));
  });
  child.on("close", (code) => {
    pushLine(`[SISTEMA] Processo encerrado (código ${code ?? "?"}).`);
    botProcess = null;
  });
  child.on("error", (err) => {
    pushLine(`[SISTEMA] Erro no processo: ${err.message}`);
  });
}

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
    pushLine("[SISTEMA] Iniciando bot...");
    const child = spawn("node", ["index.js"], {
      cwd: BOT_DIR,
      stdio: ["pipe", "pipe", "pipe"],
    });
    botProcess = child;
    attachProcessIO(child);
    return { ok: true, message: "Bot iniciado com sucesso!" };
  } catch (e) {
    return { ok: false, message: "Erro ao iniciar bot: " + String(e) };
  }
}

function stopBot(): { ok: boolean; message: string } {
  try {
    if (botProcess) {
      botProcess.kill("SIGTERM");
      botProcess = null;
    }
    execSync("pkill -f 'node index.js' || true");
    pushLine("[SISTEMA] Bot parado.");
    return { ok: true, message: "Bot parado com sucesso!" };
  } catch (e) {
    return { ok: false, message: "Erro ao parar bot: " + String(e) };
  }
}

// ── Rotas ──

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

// SSE: stream de logs em tempo real
router.get("/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Envia histórico atual
  const history = [...terminalLines];
  for (const line of history) {
    res.write(`data: ${JSON.stringify({ line })}\n\n`);
  }

  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

// POST: envia texto para o stdin do bot (para digitar opções no terminal)
router.post("/input", (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };
  if (!botProcess || botProcess.killed || !botProcess.stdin) {
    return res.status(400).json({ ok: false, message: "Bot não está em execução ou stdin indisponível." });
  }
  if (typeof text !== "string") {
    return res.status(400).json({ ok: false, message: "Campo 'text' obrigatório." });
  }
  try {
    botProcess.stdin.write(text + "\n");
    pushLine(`[VOCÊ] ${text}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e) });
  }
});

// Histórico de logs (compatibilidade com código anterior)
router.get("/logs", (_req, res) => {
  res.json({ logs: [...terminalLines].reverse() });
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
