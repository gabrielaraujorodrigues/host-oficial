// Bot do Biel — Simulador Interativo
// Usa apenas módulos nativos do Node.js (sem dependências externas)

import readline from "readline";

const rl = readline.createInterface({ input: process.stdin, terminal: false });

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function log(msg) {
  process.stdout.write(msg + "\n");
}

// ── Menu principal ──────────────────────────────────────────────────────────
function showMenu() {
  log("");
  log("╔══════════════════════════════════════════╗");
  log("║         🤖  BOT DO BIEL  v3.5.1          ║");
  log("╠══════════════════════════════════════════╣");
  log("║  Como você quer conectar o bot?          ║");
  log("║                                          ║");
  log("║  [1] Escanear QR Code (WhatsApp)         ║");
  log("║  [2] Código de Pareamento (8 dígitos)    ║");
  log("║  [3] Reconectar sessão salva             ║");
  log("║  [4] Status da conexão                   ║");
  log("║  [5] Encerrar bot                        ║");
  log("╚══════════════════════════════════════════╝");
  log("Digite o número da opção e pressione Enter:");
}

// Gera string de QR no formato Baileys (detectado automaticamente pelo painel)
function generateFakeQr() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=,";
  let qr = "";
  for (let i = 0; i < 200; i++) qr += chars[Math.floor(Math.random() * chars.length)];
  return "2@" + qr;
}

// ── Estado global ─────────────────────────────────────────────────────────────
let connected = false;
let activityTimer = null;
const lineHandlers = [];

rl.on("line", (line) => {
  if (lineHandlers.length > 0) {
    const handler = lineHandlers.shift();
    handler(line);
  } else if (connected) {
    log("[STDIN] >> " + line.trim());
    if (line.trim()) log("[BOT]   Processando: \"" + line.trim() + "\"...");
  }
});

function waitLine() {
  return new Promise((resolve) => lineHandlers.push(resolve));
}

// ── Fluxo QR Code ─────────────────────────────────────────────────────────────
async function flowQr() {
  log("");
  log("📡 Conectando ao servidor WhatsApp...");
  await delay(1200);
  log("🔑 Gerando chaves de criptografia...");
  await delay(800);
  log("📷 QR Code gerado! Escaneie com seu WhatsApp:");
  log("   (WhatsApp > Menu > Dispositivos Vinculados > Vincular Dispositivo)");
  log("");
  log(generateFakeQr());
  log("");
  log("⏳ Aguardando escaneamento... (pressione Enter após escanear)");

  await waitLine();

  log("✅ QR Code escaneado!");
  await simulateConnect();
}

// ── Fluxo Código de Pareamento ────────────────────────────────────────────────
async function flowPairing() {
  log("");
  log("📱 Informe o número de telefone (ex: 5511999999999):");

  const num = (await waitLine()).trim().replace(/\D/g, "");
  if (!num || num.length < 10) {
    log("❌ Número inválido. Voltando ao menu...");
    await delay(800);
    return mainLoop();
  }

  log("📡 Solicitando código de pareamento para +" + num + "...");
  await delay(1500);

  const code =
    Math.random().toString(36).slice(2, 6).toUpperCase() +
    "-" +
    Math.random().toString(36).slice(2, 6).toUpperCase();

  log("✅ Código de pareamento: " + code);
  log("   WhatsApp > Menu > Dispositivos Vinculados > Vincular com número de telefone");
  log("   Digite o código acima quando solicitado.");
  log("");
  log("⏳ Aguardando confirmação... (pressione Enter após parear)");

  await waitLine();
  await simulateConnect();
}

// ── Conexão simulada ──────────────────────────────────────────────────────────
async function simulateConnect() {
  log("");
  log("🔗 Autenticando...");
  await delay(900);
  log("📥 Baixando metadados de grupos...");
  await delay(700);
  log("📚 Carregando 120 comandos...");
  await delay(500);
  log("⚙️  Aplicando configurações...");
  await delay(400);
  log("");
  log("╔══════════════════════════════════════════╗");
  log("║  ✅ BOT CONECTADO COM SUCESSO!           ║");
  log("╠══════════════════════════════════════════╣");
  log("║  Nome  : Bot do Biel                     ║");
  log("║  Status: ONLINE ● Connected              ║");
  log("║  Cmds  : 120 comandos carregados         ║");
  log("╚══════════════════════════════════════════╝");
  log("");
  log("📨 Aguardando mensagens do WhatsApp...");
  log("   (Digite qualquer coisa no terminal para simular atividade)");

  connected = true;

  const activities = [
    "📩 Nova mensagem: 5511@s.whatsapp.net",
    "⚡ Comando !menu executado",
    "🎵 Download de áudio solicitado",
    "📊 Consulta de saldo realizada",
    "🤖 IA respondendo pergunta...",
    "👥 Novo membro entrou no grupo",
    "🔄 Heartbeat OK — conexão estável",
    "📸 Imagem recebida, processando...",
    "🔊 Áudio convertido para texto",
  ];

  activityTimer = setInterval(() => {
    const msg = activities[Math.floor(Math.random() * activities.length)];
    log("[" + new Date().toLocaleTimeString("pt-BR") + "] " + msg);
  }, 9000);
}

// ── Loop principal ─────────────────────────────────────────────────────────────
async function mainLoop() {
  showMenu();
  const opt = (await waitLine()).trim();

  switch (opt) {
    case "1":
      await flowQr();
      break;
    case "2":
      await flowPairing();
      break;
    case "3":
      log("");
      log("🔍 Procurando sessão salva...");
      await delay(1000);
      log("❌ Nenhuma sessão encontrada. Use QR Code ou Pareamento.");
      await delay(800);
      mainLoop();
      break;
    case "4":
      log("");
      log("📊 Status atual: " + (connected ? "ONLINE ● Conectado" : "OFFLINE ○ Desconectado"));
      await delay(800);
      mainLoop();
      break;
    case "5":
      log("");
      log("👋 Encerrando bot...");
      await delay(400);
      process.exit(0);
      break;
    default:
      log("⚠️  Opção \"" + opt + "\" inválida. Tente novamente.");
      await delay(500);
      mainLoop();
  }
}

// ── Encerramento limpo ────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  if (activityTimer) clearInterval(activityTimer);
  log("[SISTEMA] Encerrando bot por SIGTERM...");
  process.exit(0);
});

process.on("SIGINT", () => {
  if (activityTimer) clearInterval(activityTimer);
  log("[SISTEMA] Encerrando bot (Ctrl+C)...");
  process.exit(0);
});

// ── Inicialização ──────────────────────────────────────────────────────────────
log("");
log("🤖 Bot do Biel iniciando...");
await delay(400);
log("📦 Carregando módulos...");
await delay(350);
log("📋 Lendo configurações...");
await delay(300);
log("✅ Tudo pronto!");

mainLoop();
