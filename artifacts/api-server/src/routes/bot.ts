import { Router, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { spawn, ChildProcess } from "child_process";

const router = Router();

const BOT_DIR = path.resolve("../../bot");
const SETTINGS_FILE = path.join(BOT_DIR, "settings", "settings.json");
const SESSION_DIR = path.join(BOT_DIR, "bot-do-biel-session");

let botProcess: ChildProcess | null = null;
let botPid: number | null = null;

// Ring buffer das últimas 500 linhas do terminal
const MAX_LINES = 500;
const terminalLines: string[] = [];

// SSE clients ativos
const sseClients: Set<Response> = new Set();

// QR code mais recente detectado no stdout do bot
let latestQr: string | null = null;
let latestQrAt = 0;

// Regex para detectar string de QR do Baileys: "N@base64data,..."
const QR_REGEX = /^\d+@[A-Za-z0-9+/=,]{30,}$/;

// Remove códigos ANSI de cor do terminal
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, "").replace(/\x1B\][^\x07]*\x07/g, "");
}

function pushLine(rawLine: string) {
  const line = stripAnsi(rawLine).replace(/\r/g, "");
  if (!line) return;
  // Detecta QR code bruto do Baileys
  if (QR_REGEX.test(line.trim())) {
    latestQr = line.trim();
    latestQrAt = Date.now();
  }
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

  // Buffer parcial para montar linhas completas
  let stdoutBuf = "";
  let stderrBuf = "";

  child.stdout?.on("data", (chunk: string) => {
    stdoutBuf += chunk;
    const parts = stdoutBuf.split(/\n/);
    stdoutBuf = parts.pop() ?? "";
    parts.forEach((l) => { if (l !== "") pushLine(l); });
  });

  child.stdout?.on("end", () => {
    if (stdoutBuf) { pushLine(stdoutBuf); stdoutBuf = ""; }
  });

  child.stderr?.on("data", (chunk: string) => {
    stderrBuf += chunk;
    const parts = stderrBuf.split(/\n/);
    stderrBuf = parts.pop() ?? "";
    parts.forEach((l) => { if (l !== "") pushLine("[STDERR] " + l); });
  });

  child.stderr?.on("end", () => {
    if (stderrBuf) { pushLine("[STDERR] " + stderrBuf); stderrBuf = ""; }
  });

  child.on("close", (code, signal) => {
    pushLine(`[SISTEMA] Processo encerrado (código ${code ?? "?"}, sinal ${signal ?? "?"}).`);
    botProcess = null;
    botPid = null;
    latestQr = null;
  });

  child.on("error", (err) => {
    pushLine(`[SISTEMA] Erro no processo: ${err.message}`);
    botProcess = null;
    botPid = null;
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

// Usa APENAS rastreamento por PID — sem pgrep que encontra processos errados
function isBotRunning(): boolean {
  if (!botProcess || !botPid) return false;
  if (botProcess.killed) {
    botProcess = null;
    botPid = null;
    return false;
  }
  try {
    process.kill(botPid, 0); // sinal 0 = verifica existência sem matar
    return true;
  } catch {
    botProcess = null;
    botPid = null;
    return false;
  }
}

function startBot(): { ok: boolean; message: string } {
  if (isBotRunning()) {
    return { ok: false, message: "Bot já está em execução." };
  }

  const indexJs = path.join(BOT_DIR, "index.js");
  if (!fs.existsSync(indexJs)) {
    return { ok: false, message: `Arquivo não encontrado: ${indexJs}` };
  }

  try {
    pushLine("[SISTEMA] Iniciando bot...");
    pushLine(`[SISTEMA] Diretório: ${BOT_DIR}`);
    latestQr = null;

    const child = spawn("node", ["index.js"], {
      cwd: BOT_DIR,
      stdio: ["pipe", "pipe", "pipe"],
      detached: false,
    });

    if (!child.pid) {
      pushLine("[SISTEMA] Falha ao obter PID do processo.");
      return { ok: false, message: "Falha ao iniciar: PID não disponível." };
    }

    botProcess = child;
    botPid = child.pid;
    pushLine(`[SISTEMA] Bot iniciado com PID ${botPid}`);
    attachProcessIO(child);
    return { ok: true, message: `Bot iniciado! (PID ${botPid})` };
  } catch (e) {
    const msg = String(e);
    pushLine("[SISTEMA] ERRO ao iniciar: " + msg);
    return { ok: false, message: "Erro ao iniciar bot: " + msg };
  }
}

function stopBot(): { ok: boolean; message: string } {
  const wasRunning = isBotRunning();

  if (botProcess && botPid) {
    try {
      // Tenta SIGTERM primeiro
      process.kill(botPid, "SIGTERM");
      pushLine(`[SISTEMA] SIGTERM enviado ao PID ${botPid}`);
    } catch {
      // processo já morreu
    }

    // Aguarda um tick e força SIGKILL se ainda vivo
    const pid = botPid;
    setTimeout(() => {
      try {
        process.kill(pid, 0); // ainda está vivo?
        process.kill(pid, "SIGKILL");
        pushLine(`[SISTEMA] SIGKILL enviado ao PID ${pid}`);
      } catch {
        // já morreu, tudo bem
      }
    }, 1500);

    botProcess = null;
    botPid = null;
    latestQr = null;
  }

  if (!wasRunning) {
    pushLine("[SISTEMA] Nenhum processo ativo para parar.");
    return { ok: true, message: "Bot não estava em execução." };
  }

  pushLine("[SISTEMA] Bot parado com sucesso.");
  return { ok: true, message: "Bot parado com sucesso!" };
}

// ── Rotas ──

router.get("/status", (_req, res) => {
  const settings = readSettings();
  const status = getBotStatus();
  const running = isBotRunning();
  res.json({
    status,
    running,
    pid: botPid,
    botName: settings?.botName ?? "Bot do Biel",
    ownerNumber: settings?.ownerNumber ?? "",
    prefix: settings?.prefix ?? [],
    uptime: process.uptime(),
    hasQr: !!latestQr && (Date.now() - latestQrAt) < 60_000,
    ts: Date.now(),
  });
});

// GET: retorna o QR code bruto mais recente (expira em 60s)
router.get("/qr", (_req, res) => {
  const valid = latestQr && (Date.now() - latestQrAt) < 60_000;
  if (!valid) return res.status(204).end();
  res.json({ qr: latestQr, at: latestQrAt });
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

  // Heartbeat a cada 15s para manter conexão viva
  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
  }, 15_000);

  sseClients.add(res);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// POST: envia texto para o stdin do bot
router.post("/input", (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };

  if (!isBotRunning()) {
    return res.status(400).json({ ok: false, message: "Bot não está em execução." });
  }
  if (!botProcess?.stdin) {
    return res.status(400).json({ ok: false, message: "stdin do bot não disponível." });
  }
  if (typeof text !== "string" || text === "") {
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

// Histórico de logs
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
  }, 2000);
});

export default router;
