import { Router } from "express";

const router = Router();

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Bot do Biel — Painel</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{
    --bg:#0d0f14;--card:#161b22;--border:#30363d;
    --green:#2ea043;--red:#da3633;--yellow:#d29922;
    --text:#e6edf3;--muted:#8b949e;--accent:#58a6ff;
    --font:'Segoe UI',system-ui,sans-serif;
  }
  body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100vh}
  header{
    background:linear-gradient(135deg,#0d1117 0%,#161b22 100%);
    border-bottom:1px solid var(--border);
    padding:16px 24px;display:flex;align-items:center;gap:14px;
  }
  header .logo{font-size:22px;font-weight:700;color:var(--accent)}
  header .logo span{color:var(--green)}
  header .badge{
    background:var(--green);color:#fff;font-size:11px;font-weight:600;
    padding:3px 10px;border-radius:12px;letter-spacing:.5px;margin-left:auto;
  }
  header .badge.offline{background:var(--red)}
  header .badge.loading{background:var(--yellow)}
  main{max-width:1100px;margin:0 auto;padding:24px 20px;display:grid;gap:20px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  @media(max-width:700px){.grid2{grid-template-columns:1fr}}
  .card{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden}
  .card-header{
    padding:14px 20px;border-bottom:1px solid var(--border);
    display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px;
  }
  .card-header .icon{font-size:18px}
  .card-body{padding:20px}
  .stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
  .stat{
    background:#0d1117;border:1px solid var(--border);border-radius:10px;
    padding:16px;display:flex;flex-direction:column;gap:4px;
  }
  .stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px}
  .stat-value{font-size:22px;font-weight:700;color:var(--accent)}
  .stat-value.green{color:var(--green)}
  .stat-value.red{color:var(--red)}
  .stat-value.yellow{color:var(--yellow)}
  .log-box{
    background:#0d1117;border:1px solid var(--border);border-radius:8px;
    height:300px;overflow-y:auto;padding:12px;font-family:'Courier New',monospace;
    font-size:12px;line-height:1.6;
  }
  .log-line{padding:2px 0;border-bottom:1px solid #1c2128}
  .log-line:last-child{border-bottom:none}
  .log-line.err{color:#f85149}
  .log-line.warn{color:var(--yellow)}
  .log-line.ok{color:var(--green)}
  .form-group{margin-bottom:16px}
  .form-group label{display:block;font-size:13px;color:var(--muted);margin-bottom:6px;font-weight:500}
  .form-group input,.form-group select{
    width:100%;background:#0d1117;border:1px solid var(--border);border-radius:8px;
    padding:10px 14px;color:var(--text);font-size:14px;outline:none;
    transition:border-color .2s;
  }
  .form-group input:focus,.form-group select:focus{border-color:var(--accent)}
  .btn{
    display:inline-flex;align-items:center;gap:8px;
    background:var(--accent);color:#fff;border:none;border-radius:8px;
    padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;
    transition:opacity .2s,transform .1s;
  }
  .btn:hover{opacity:.85}
  .btn:active{transform:scale(.97)}
  .btn:disabled{opacity:.4;cursor:not-allowed}
  .btn.secondary{background:#21262d;border:1px solid var(--border);color:var(--text)}
  .btn.danger{background:var(--red)}
  .btn.success{background:var(--green)}
  .btn.warning{background:var(--yellow);color:#0d1117}
  .toast{
    position:fixed;bottom:24px;right:24px;
    background:var(--green);color:#fff;padding:12px 20px;border-radius:10px;
    font-weight:600;font-size:14px;opacity:0;transition:opacity .3s;z-index:999;
    max-width:340px;
  }
  .toast.show{opacity:1}
  .toast.error{background:var(--red)}
  .toast.warn{background:var(--yellow);color:#0d1117}
  .prefix-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
  .prefix-tag{
    background:#21262d;border:1px solid var(--border);border-radius:6px;
    padding:4px 12px;font-family:monospace;font-size:15px;font-weight:700;color:var(--accent);
  }
  .refresh-btn{
    margin-left:auto;background:none;border:1px solid var(--border);
    color:var(--muted);border-radius:6px;padding:4px 12px;cursor:pointer;
    font-size:12px;transition:all .2s;
  }
  .refresh-btn:hover{color:var(--text);border-color:var(--accent)}
  hr{border:none;border-top:1px solid var(--border);margin:16px 0}
  .ctrl-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
  .process-dot{
    width:10px;height:10px;border-radius:50%;background:var(--red);
    display:inline-block;margin-right:6px;
  }
  .process-dot.on{background:var(--green);box-shadow:0 0 8px var(--green)}
  .process-label{font-size:13px;color:var(--muted)}
</style>
</head>
<body>
<header>
  <div class="logo">🤖 Bot do <span>Biel</span></div>
  <div class="badge loading" id="statusBadge">Carregando...</div>
</header>
<main>
  <!-- Stats -->
  <div class="card">
    <div class="card-header"><span class="icon">📊</span> Visão Geral</div>
    <div class="card-body">
      <div class="stat-grid">
        <div class="stat">
          <div class="stat-label">Conexão WhatsApp</div>
          <div class="stat-value" id="statStatus">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Processo do Bot</div>
          <div class="stat-value" id="statProcess">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Nome do Bot</div>
          <div class="stat-value" style="font-size:16px" id="statName">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Número do Dono</div>
          <div class="stat-value" style="font-size:14px" id="statOwner">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Prefixos</div>
          <div class="stat-value" style="font-size:14px" id="statPrefix">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Uptime do Servidor</div>
          <div class="stat-value green" style="font-size:14px" id="statUptime">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Última Atualização</div>
          <div class="stat-value" style="font-size:13px" id="statTs">—</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Controle do Bot -->
  <div class="card">
    <div class="card-header"><span class="icon">🎮</span> Controle do Bot</div>
    <div class="card-body">
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">
        Gerencie o processo do bot. Após iniciar, aguarde alguns segundos e conecte o WhatsApp pelo console.
      </p>
      <div class="ctrl-row">
        <button class="btn success" id="btnStart" onclick="controlBot('start')">
          ▶ Iniciar Bot
        </button>
        <button class="btn danger" id="btnStop" onclick="controlBot('stop')">
          ⏹ Parar Bot
        </button>
        <button class="btn warning" id="btnRestart" onclick="controlBot('restart')">
          🔄 Reiniciar Bot
        </button>
        <span style="margin-left:auto;display:flex;align-items:center;gap:6px">
          <span class="process-dot" id="processDot"></span>
          <span class="process-label" id="processLabel">verificando...</span>
        </span>
      </div>
    </div>
  </div>

  <div class="grid2">
    <!-- Logs -->
    <div class="card">
      <div class="card-header">
        <span class="icon">📋</span> Logs do Bot
        <button class="refresh-btn" onclick="loadLogs()">↻ Atualizar</button>
      </div>
      <div class="card-body" style="padding-top:12px">
        <div class="log-box" id="logBox">Carregando logs...</div>
      </div>
    </div>

    <!-- Settings -->
    <div class="card">
      <div class="card-header"><span class="icon">⚙️</span> Configurações</div>
      <div class="card-body">
        <div class="form-group">
          <label>Nome do Bot</label>
          <input id="cfgName" type="text" placeholder="Bot do Biel"/>
        </div>
        <div class="form-group">
          <label>Número do Dono (com +)</label>
          <input id="cfgOwner" type="text" placeholder="+5511912345678"/>
        </div>
        <div class="form-group">
          <label>Modo de Manutenção</label>
          <select id="cfgMaintenance">
            <option value="off">Desligado</option>
            <option value="soft">Suave (avisa)</option>
            <option value="hard">Estrito (bloqueia)</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn success" onclick="saveSettings()">💾 Salvar</button>
          <button class="btn secondary" onclick="loadSettings()">↺ Restaurar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Prefixos -->
  <div class="card">
    <div class="card-header"><span class="icon">🔑</span> Prefixos e Acesso</div>
    <div class="card-body">
      <div class="form-group">
        <label>Prefixos ativos</label>
        <div class="prefix-tags" id="prefixTags">—</div>
      </div>
      <hr/>
      <p style="font-size:13px;color:var(--muted)">
        Para alterar prefixos ou números autorizados edite
        <code style="background:#0d1117;padding:2px 6px;border-radius:4px;color:var(--accent)">bot/settings/settings.json</code>
        e reinicie o bot.
      </p>
    </div>
  </div>
</main>

<div class="toast" id="toast"></div>

<script>
const BASE = window.location.origin + '/api';
let controlling = false;

function showToast(msg, type='ok'){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type==='error'?' error':type==='warn'?' warn':'');
  setTimeout(()=>t.className='toast',4000);
}

function fmtUptime(s){
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60);
  return h>0 ? h+'h '+m+'m' : m+'m '+Math.floor(s%60)+'s';
}

function setProcessIndicator(running){
  const dot = document.getElementById('processDot');
  const lbl = document.getElementById('processLabel');
  if(running){
    dot.className='process-dot on';
    lbl.textContent='processo ativo';
  } else {
    dot.className='process-dot';
    lbl.textContent='processo parado';
  }
}

async function loadStatus(){
  try{
    const r = await fetch(BASE+'/bot/status');
    const d = await r.json();
    const badge = document.getElementById('statusBadge');
    const running = d.running;

    badge.textContent = d.status==='conectado' ? '● Conectado' : '● Desconectado';
    badge.className = 'badge ' + (d.status==='conectado'?'':'offline');

    document.getElementById('statStatus').textContent = d.status;
    document.getElementById('statStatus').className = 'stat-value ' + (d.status==='conectado'?'green':'red');

    document.getElementById('statProcess').textContent = running ? 'rodando' : 'parado';
    document.getElementById('statProcess').className = 'stat-value ' + (running?'green':'red');

    setProcessIndicator(running);

    document.getElementById('statName').textContent = d.botName;
    document.getElementById('statOwner').textContent = d.ownerNumber || '—';
    document.getElementById('statPrefix').textContent = (d.prefix||[]).join('  ');
    document.getElementById('statUptime').textContent = fmtUptime(d.uptime||0);
    document.getElementById('statTs').textContent = new Date(d.ts).toLocaleTimeString('pt-BR');
  }catch(e){
    document.getElementById('statusBadge').textContent='Erro';
    document.getElementById('statusBadge').className='badge offline';
  }
}

async function loadLogs(){
  const box = document.getElementById('logBox');
  box.textContent='Carregando...';
  try{
    const r = await fetch(BASE+'/bot/logs');
    const d = await r.json();
    if(!d.logs||!d.logs.length){box.textContent='Nenhum log encontrado.';return;}
    box.innerHTML = d.logs.map(l=>{
      const cls = /error|err|ERRO/i.test(l)?'err':/warn|aviso/i.test(l)?'warn':/ok|sucesso|✓/i.test(l)?'ok':'';
      return '<div class="log-line '+cls+'">'+l.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
    }).join('');
  }catch(e){box.textContent='Erro ao carregar logs: '+e.message;}
}

async function loadSettings(){
  try{
    const r = await fetch(BASE+'/bot/settings');
    const d = await r.json();
    document.getElementById('cfgName').value = d.botName||'';
    document.getElementById('cfgOwner').value = d.ownerNumber||'';
    document.getElementById('cfgMaintenance').value = d.system?.maintenanceMode||'off';
    const tags = document.getElementById('prefixTags');
    tags.innerHTML = (d.prefix||[]).map(p=>'<span class="prefix-tag">'+p+'</span>').join('');
  }catch(e){showToast('Erro ao carregar config','error');}
}

async function saveSettings(){
  const body = {
    botName: document.getElementById('cfgName').value.trim(),
    ownerNumber: document.getElementById('cfgOwner').value.trim(),
    system: { maintenanceMode: document.getElementById('cfgMaintenance').value }
  };
  try{
    const r = await fetch(BASE+'/bot/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(r.ok){ showToast('✅ Configurações salvas! Reinicie o bot para aplicar.'); }
    else { showToast('Erro ao salvar','error'); }
  }catch(e){showToast('Erro: '+e.message,'error');}
}

async function controlBot(action){
  if(controlling) return;
  controlling = true;
  const labels = { start:'Iniciando...', stop:'Parando...', restart:'Reiniciando...' };
  const ids = { start:'btnStart', stop:'btnStop', restart:'btnRestart' };
  const btn = document.getElementById(ids[action]);
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ ' + labels[action];

  try{
    const r = await fetch(BASE+'/bot/'+action, {method:'POST'});
    const d = await r.json();
    if(d.ok){
      showToast('✅ ' + d.message);
    } else {
      showToast('⚠️ ' + d.message, 'warn');
    }
    setTimeout(loadStatus, 2000);
  }catch(e){
    showToast('Erro: '+e.message,'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
    controlling = false;
  }
}

// Inicializar
loadStatus();
loadLogs();
loadSettings();
setInterval(loadStatus, 10000);
setInterval(loadLogs, 30000);
</script>
</body>
</html>`;

router.get("/painel", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(HTML);
});

export default router;
