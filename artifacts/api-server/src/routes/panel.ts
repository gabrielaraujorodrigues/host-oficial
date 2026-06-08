import { Router } from "express";
import { requireAuth } from "./auth";

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
  padding:14px 24px;display:flex;align-items:center;gap:14px;
}
header .logo{font-size:20px;font-weight:700;color:var(--accent)}
header .logo span{color:var(--green)}
header .badge{background:var(--green);color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:12px;letter-spacing:.5px;margin-left:auto}
header .badge.offline{background:var(--red)}
header .badge.loading{background:var(--yellow)}
.logout-btn{background:none;border:1px solid var(--border);color:var(--muted);border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;margin-left:10px;transition:all .2s}
.logout-btn:hover{color:var(--red);border-color:var(--red)}
nav{background:#0d1117;border-bottom:1px solid var(--border);padding:0 24px;display:flex;gap:0;overflow-x:auto}
.nav-tab{padding:12px 18px;font-size:13px;font-weight:500;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;transition:all .2s}
.nav-tab:hover{color:var(--text)}
.nav-tab.active{color:var(--accent);border-bottom-color:var(--accent)}
main{max-width:1200px;margin:0 auto;padding:20px}
.tab-content{display:none}.tab-content.active{display:block}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
@media(max-width:750px){.grid2{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:18px}
.card-header{padding:13px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;font-weight:600;font-size:14px}
.card-body{padding:18px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.stat{background:#0d1117;border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:4px}
.stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.7px}
.stat-value{font-size:20px;font-weight:700;color:var(--accent)}
.stat-value.green{color:var(--green)}.stat-value.red{color:var(--red)}.stat-value.yellow{color:var(--yellow)}
.log-box{background:#0d1117;border:1px solid var(--border);border-radius:8px;height:320px;overflow-y:auto;padding:12px;font-family:'Courier New',monospace;font-size:12px;line-height:1.6}
.log-line{padding:2px 0;border-bottom:1px solid #1c2128}.log-line:last-child{border-bottom:none}
.log-line.err{color:#f85149}.log-line.warn{color:var(--yellow)}.log-line.ok{color:var(--green)}
.form-group{margin-bottom:15px}
.form-group label{display:block;font-size:13px;color:var(--muted);margin-bottom:5px;font-weight:500}
.form-group input,.form-group select{width:100%;background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:9px 13px;color:var(--text);font-size:14px;outline:none;transition:border-color .2s}
.form-group input:focus,.form-group select:focus{border-color:var(--accent)}
.btn{display:inline-flex;align-items:center;gap:7px;background:var(--accent);color:#fff;border:none;border-radius:7px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .2s,transform .1s}
.btn:hover{opacity:.85}.btn:active{transform:scale(.97)}.btn:disabled{opacity:.4;cursor:not-allowed}
.btn.secondary{background:#21262d;border:1px solid var(--border);color:var(--text)}
.btn.danger{background:var(--red)}.btn.success{background:var(--green)}.btn.warning{background:var(--yellow);color:#0d1117}
.btn-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.refresh-btn{margin-left:auto;background:none;border:1px solid var(--border);color:var(--muted);border-radius:6px;padding:4px 12px;cursor:pointer;font-size:12px;transition:all .2s}
.refresh-btn:hover{color:var(--text);border-color:var(--accent)}
hr{border:none;border-top:1px solid var(--border);margin:14px 0}
.prefix-tag{background:#21262d;border:1px solid var(--border);border-radius:6px;padding:4px 12px;font-family:monospace;font-size:14px;font-weight:700;color:var(--accent);display:inline-block;margin:3px}
.process-dot{width:9px;height:9px;border-radius:50%;background:var(--red);display:inline-block;margin-right:5px}
.process-dot.on{background:var(--green);box-shadow:0 0 7px var(--green)}
.toast{position:fixed;bottom:22px;right:22px;background:var(--green);color:#fff;padding:11px 18px;border-radius:10px;font-weight:600;font-size:13px;opacity:0;transition:opacity .3s;z-index:999;max-width:340px}
.toast.show{opacity:1}.toast.error{background:var(--red)}.toast.warn{background:var(--yellow);color:#0d1117}

/* ── FILE MANAGER ── */
.fm-layout{display:grid;grid-template-columns:260px 1fr;gap:0;height:70vh;border:1px solid var(--border);border-radius:12px;overflow:hidden}
.fm-tree{background:#0d1117;overflow-y:auto;border-right:1px solid var(--border);padding:8px 0}
.fm-tree-loading{padding:16px;font-size:12px;color:var(--muted)}
.fm-node{cursor:pointer;padding:4px 10px 4px 0;font-size:12px;display:flex;align-items:center;gap:5px;border-radius:5px;margin:1px 4px;color:var(--text);user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fm-node:hover{background:#21262d}.fm-node.selected{background:#1c2d47;color:var(--accent)}
.fm-node .ic{flex-shrink:0;width:14px;text-align:center}
.fm-indent{display:inline-block}
.fm-editor{display:flex;flex-direction:column;overflow:hidden}
.fm-toolbar{padding:8px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;background:#161b22;flex-shrink:0;min-height:44px}
.fm-path{font-size:11px;color:var(--muted);font-family:monospace;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fm-textarea{flex:1;background:#0d1117;border:none;outline:none;color:var(--text);font-family:'Courier New',monospace;font-size:12.5px;padding:14px;resize:none;overflow-y:auto;line-height:1.6}
.fm-welcome{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--muted);gap:10px;font-size:13px}
.fm-btn{background:#21262d;border:1px solid var(--border);color:var(--text);border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:500;transition:all .2s;display:inline-flex;align-items:center;gap:5px}
.fm-btn:hover{border-color:var(--accent);color:var(--accent)}
.fm-btn.save{background:var(--green);border-color:var(--green);color:#fff}
.fm-btn.save:hover{opacity:.85}
.fm-btn.del{background:none;border-color:var(--red);color:var(--red)}
.fm-btn.del:hover{background:var(--red);color:#fff}
.fm-actions{padding:8px 14px;border-top:1px solid var(--border);background:#161b22;display:flex;gap:8px;align-items:center;flex-wrap:wrap;flex-shrink:0}
.fm-new{display:flex;gap:6px;align-items:center}
.fm-new input{background:#0d1117;border:1px solid var(--border);color:var(--text);border-radius:6px;padding:5px 10px;font-size:12px;outline:none;width:180px}
.fm-new input:focus{border-color:var(--accent)}
</style>
</head>
<body>
<header>
  <div class="logo">🤖 Bot do <span>Biel</span></div>
  <div class="badge loading" id="statusBadge">Carregando...</div>
  <form method="POST" action="/api/logout" style="margin-left:8px">
    <button class="logout-btn" type="submit">🚪 Sair</button>
  </form>
</header>

<nav>
  <div class="nav-tab active" onclick="switchTab('overview')">📊 Visão Geral</div>
  <div class="nav-tab" onclick="switchTab('control')">🎮 Controle</div>
  <div class="nav-tab" onclick="switchTab('logs')">📋 Logs</div>
  <div class="nav-tab" onclick="switchTab('settings')">⚙️ Configurações</div>
  <div class="nav-tab" onclick="switchTab('files')">📁 Arquivos</div>
</nav>

<main>
<!-- ===== VISÃO GERAL ===== -->
<div id="tab-overview" class="tab-content active">
  <div class="card">
    <div class="card-header">📊 Status do Bot</div>
    <div class="card-body">
      <div class="stat-grid">
        <div class="stat"><div class="stat-label">Conexão WhatsApp</div><div class="stat-value" id="statStatus">—</div></div>
        <div class="stat"><div class="stat-label">Processo do Bot</div><div class="stat-value" id="statProcess">—</div></div>
        <div class="stat"><div class="stat-label">Nome do Bot</div><div class="stat-value" style="font-size:15px" id="statName">—</div></div>
        <div class="stat"><div class="stat-label">Número do Dono</div><div class="stat-value" style="font-size:13px" id="statOwner">—</div></div>
        <div class="stat"><div class="stat-label">Prefixos</div><div class="stat-value" style="font-size:13px" id="statPrefix">—</div></div>
        <div class="stat"><div class="stat-label">Uptime Servidor</div><div class="stat-value green" style="font-size:13px" id="statUptime">—</div></div>
      </div>
    </div>
  </div>
</div>

<!-- ===== CONTROLE ===== -->
<div id="tab-control" class="tab-content">
  <div class="card">
    <div class="card-header">🎮 Controle do Bot</div>
    <div class="card-body">
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Gerencie o processo. Após iniciar, conecte o WhatsApp no console do workflow "Bot do Biel".</p>
      <div class="btn-row">
        <button class="btn success" id="btnStart" onclick="controlBot('start')">▶ Iniciar Bot</button>
        <button class="btn danger"  id="btnStop"    onclick="controlBot('stop')">⏹ Parar Bot</button>
        <button class="btn warning" id="btnRestart" onclick="controlBot('restart')">🔄 Reiniciar Bot</button>
        <span style="margin-left:auto;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)">
          <span class="process-dot" id="processDot"></span>
          <span id="processLabel">verificando...</span>
        </span>
      </div>
    </div>
  </div>
</div>

<!-- ===== LOGS ===== -->
<div id="tab-logs" class="tab-content">
  <div class="card">
    <div class="card-header">📋 Logs do Bot <button class="refresh-btn" onclick="loadLogs()">↻ Atualizar</button></div>
    <div class="card-body" style="padding-top:12px"><div class="log-box" id="logBox">Carregando...</div></div>
  </div>
</div>

<!-- ===== CONFIGURAÇÕES ===== -->
<div id="tab-settings" class="tab-content">
  <div class="grid2">
    <div class="card">
      <div class="card-header">⚙️ Configurações Gerais</div>
      <div class="card-body">
        <div class="form-group"><label>Nome do Bot</label><input id="cfgName" type="text" placeholder="Bot do Biel"/></div>
        <div class="form-group"><label>Número do Dono (com DDI, sem +)</label><input id="cfgOwner" type="text" placeholder="5586994029686"/></div>
        <div class="form-group">
          <label>Modo de Manutenção</label>
          <select id="cfgMaintenance">
            <option value="off">Desligado</option>
            <option value="soft">Suave (avisa)</option>
            <option value="hard">Estrito (bloqueia)</option>
          </select>
        </div>
        <div class="btn-row">
          <button class="btn success" onclick="saveSettings()">💾 Salvar</button>
          <button class="btn secondary" onclick="loadSettings()">↺ Restaurar</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">🔑 Prefixos Ativos</div>
      <div class="card-body">
        <div id="prefixTags" style="margin-bottom:12px">—</div>
        <hr/>
        <p style="font-size:12px;color:var(--muted)">Para alterar prefixos edite o arquivo <code style="background:#0d1117;padding:2px 6px;border-radius:4px;color:var(--accent)">settings/settings.json</code> na aba Arquivos e reinicie o bot.</p>
      </div>
    </div>
  </div>
</div>

<!-- ===== ARQUIVOS ===== -->
<div id="tab-files" class="tab-content">
  <div class="card" style="margin-bottom:0">
    <div class="card-header">📁 Gerenciador de Arquivos — <span style="color:var(--muted);font-size:12px;font-weight:400">bot/</span>
      <button class="fm-btn" style="margin-left:auto" onclick="loadTree()">↻ Recarregar</button>
    </div>
  </div>
  <div class="fm-layout">
    <div class="fm-tree" id="fmTree"><div class="fm-tree-loading">Carregando...</div></div>
    <div class="fm-editor" id="fmEditor">
      <div class="fm-welcome" id="fmWelcome">
        <div style="font-size:32px">📂</div>
        <div>Selecione um arquivo para editar</div>
        <div style="font-size:12px">Clique em qualquer arquivo na árvore à esquerda</div>
      </div>
      <div id="fmEditArea" style="display:none;flex-direction:column;height:100%">
        <div class="fm-toolbar">
          <span class="fm-path" id="fmPath">—</span>
          <button class="fm-btn" onclick="fmCopy()">📋 Copiar</button>
        </div>
        <textarea class="fm-textarea" id="fmTextarea" spellcheck="false"></textarea>
        <div class="fm-actions">
          <button class="fm-btn save" onclick="fmSave()">💾 Salvar</button>
          <button class="fm-btn del" onclick="fmDelete()">🗑 Excluir</button>
          <div class="fm-new">
            <input type="text" id="fmNewName" placeholder="novo-arquivo.js ou pasta/"/>
            <button class="fm-btn" onclick="fmCreate()">➕ Criar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</main>

<div class="toast" id="toast"></div>

<script>
const BASE = window.location.origin + '/api';
let controlling = false;
let currentFilePath = null;
let currentTab = 'overview';

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  event.currentTarget.classList.add('active');
  currentTab = tab;
  if (tab === 'files' && document.getElementById('fmTree').children.length === 1
      && document.getElementById('fmTree').firstElementChild.classList.contains('fm-tree-loading')) {
    loadTree();
  }
  if (tab === 'logs') loadLogs();
  if (tab === 'settings') loadSettings();
}

function showToast(msg, type='ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type==='error'?' error':type==='warn'?' warn':'');
  setTimeout(() => t.className='toast', 4000);
}

function fmtUptime(s) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  return h > 0 ? h+'h '+m+'m' : m+'m '+Math.floor(s%60)+'s';
}

async function loadStatus() {
  try {
    const d = await fetch(BASE+'/bot/status').then(r => r.json());
    const badge = document.getElementById('statusBadge');
    badge.textContent = d.status==='conectado' ? '● Conectado' : '● Desconectado';
    badge.className = 'badge ' + (d.status==='conectado' ? '' : 'offline');
    const set = (id, val, cls) => {
      const el = document.getElementById(id);
      el.textContent = val;
      if (cls) el.className = 'stat-value ' + cls;
    };
    set('statStatus', d.status, d.status==='conectado'?'green':'red');
    set('statProcess', d.running?'rodando':'parado', d.running?'green':'red');
    set('statName', d.botName, '');
    set('statOwner', d.ownerNumber||'—', '');
    set('statPrefix', (d.prefix||[]).join('  '), '');
    set('statUptime', fmtUptime(d.uptime||0), 'green');
    document.getElementById('processDot').className = 'process-dot' + (d.running?' on':'');
    document.getElementById('processLabel').textContent = d.running ? 'processo ativo' : 'processo parado';
  } catch { document.getElementById('statusBadge').className='badge offline'; }
}

async function loadLogs() {
  const box = document.getElementById('logBox');
  box.textContent = 'Carregando...';
  try {
    const d = await fetch(BASE+'/bot/logs').then(r => r.json());
    if (!d.logs?.length) { box.textContent='Nenhum log encontrado.'; return; }
    box.innerHTML = d.logs.map(l => {
      const cls = /error|err|ERRO/i.test(l)?'err':/warn|aviso/i.test(l)?'warn':/ok|sucesso|✓/i.test(l)?'ok':'';
      return '<div class="log-line '+cls+'">'+l.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
    }).join('');
  } catch(e) { box.textContent='Erro: '+e.message; }
}

async function loadSettings() {
  try {
    const d = await fetch(BASE+'/bot/settings').then(r => r.json());
    document.getElementById('cfgName').value = d.botName||'';
    document.getElementById('cfgOwner').value = (d.ownerNumber||'').replace(/^\\+/,'');
    document.getElementById('cfgMaintenance').value = d.system?.maintenanceMode||'off';
    document.getElementById('prefixTags').innerHTML = (d.prefix||[]).map(p=>'<span class="prefix-tag">'+p+'</span>').join('');
  } catch { showToast('Erro ao carregar config','error'); }
}

async function saveSettings() {
  const body = {
    botName: document.getElementById('cfgName').value.trim(),
    ownerNumber: document.getElementById('cfgOwner').value.trim(),
    system: { maintenanceMode: document.getElementById('cfgMaintenance').value }
  };
  try {
    const r = await fetch(BASE+'/bot/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    r.ok ? showToast('✅ Salvo! Reinicie o bot para aplicar.') : showToast('Erro ao salvar','error');
  } catch(e) { showToast('Erro: '+e.message,'error'); }
}

async function controlBot(action) {
  if (controlling) return;
  controlling = true;
  const labels = {start:'Iniciando...',stop:'Parando...',restart:'Reiniciando...'};
  const ids = {start:'btnStart',stop:'btnStop',restart:'btnRestart'};
  const btn = document.getElementById(ids[action]);
  const orig = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '⏳ '+labels[action];
  try {
    const d = await fetch(BASE+'/bot/'+action,{method:'POST'}).then(r=>r.json());
    d.ok ? showToast('✅ '+d.message) : showToast('⚠️ '+d.message,'warn');
    setTimeout(loadStatus, 2000);
  } catch(e) { showToast('Erro: '+e.message,'error'); }
  finally { btn.disabled=false; btn.innerHTML=orig; controlling=false; }
}

/* ── FILE MANAGER ── */
function buildTree(nodes, depth=0) {
  return nodes.map(n => {
    const indent = depth*14+'px';
    if (n.type === 'dir') {
      const childrenHtml = n.children?.length ? buildTree(n.children, depth+1) : '';
      return \`<div>
        <div class="fm-node" onclick="toggleDir(this)" data-path="\${n.path}">
          <span class="fm-indent" style="padding-left:\${indent}"></span>
          <span class="ic">📁</span><span>\${n.name}</span>
        </div>
        <div class="fm-children" style="display:none">\${childrenHtml}</div>
      </div>\`;
    } else {
      const ext = n.name.split('.').pop();
      const ic = {js:'📜',ts:'📘',json:'📋',md:'📝',txt:'📄',env:'🔒',sh:'⚙️'}[ext]||'📄';
      return \`<div class="fm-node" onclick="openFile('\${n.path}')" data-path="\${n.path}">
        <span class="fm-indent" style="padding-left:\${indent}"></span>
        <span class="ic">\${ic}</span><span>\${n.name}</span>
      </div>\`;
    }
  }).join('');
}

function toggleDir(el) {
  const children = el.nextElementSibling;
  if (!children) return;
  const ic = el.querySelector('.ic');
  if (children.style.display === 'none') {
    children.style.display = 'block';
    ic.textContent = '📂';
  } else {
    children.style.display = 'none';
    ic.textContent = '📁';
  }
}

async function loadTree() {
  const tree = document.getElementById('fmTree');
  tree.innerHTML = '<div class="fm-tree-loading">Carregando...</div>';
  try {
    const d = await fetch(BASE+'/files/tree').then(r=>r.json());
    tree.innerHTML = buildTree(d.tree||[]);
  } catch(e) { tree.innerHTML='<div class="fm-tree-loading" style="color:var(--red)">Erro: '+e.message+'</div>'; }
}

async function openFile(filePath) {
  document.querySelectorAll('.fm-node').forEach(n => n.classList.remove('selected'));
  document.querySelectorAll('[data-path="'+filePath+'"]').forEach(n => n.classList.add('selected'));
  currentFilePath = filePath;
  document.getElementById('fmWelcome').style.display = 'none';
  const area = document.getElementById('fmEditArea');
  area.style.display = 'flex';
  document.getElementById('fmPath').textContent = 'bot/' + filePath;
  document.getElementById('fmTextarea').value = 'Carregando...';
  try {
    const d = await fetch(BASE+'/files/read?path='+encodeURIComponent(filePath)).then(r=>r.json());
    document.getElementById('fmTextarea').value = d.content ?? d.error;
  } catch(e) { document.getElementById('fmTextarea').value = 'Erro: '+e.message; }
}

async function fmSave() {
  if (!currentFilePath) return;
  const content = document.getElementById('fmTextarea').value;
  try {
    const r = await fetch(BASE+'/files/write',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:currentFilePath,content})});
    const d = await r.json();
    d.ok ? showToast('💾 Arquivo salvo!') : showToast('Erro: '+d.error,'error');
  } catch(e) { showToast('Erro: '+e.message,'error'); }
}

async function fmDelete() {
  if (!currentFilePath) return;
  if (!confirm('Excluir "bot/'+currentFilePath+'"? Esta ação não pode ser desfeita.')) return;
  try {
    const r = await fetch(BASE+'/files/delete?path='+encodeURIComponent(currentFilePath),{method:'DELETE'});
    const d = await r.json();
    if (d.ok) {
      showToast('🗑 Excluído!');
      document.getElementById('fmWelcome').style.display='';
      document.getElementById('fmEditArea').style.display='none';
      currentFilePath = null;
      loadTree();
    } else {
      showToast('Erro: '+d.error,'error');
    }
  } catch(e) { showToast('Erro: '+e.message,'error'); }
}

function fmCopy() {
  navigator.clipboard?.writeText(document.getElementById('fmTextarea').value);
  showToast('📋 Copiado!');
}

async function fmCreate() {
  const name = document.getElementById('fmNewName').value.trim();
  if (!name) return showToast('Digite um nome de arquivo ou pasta/','warn');
  const isDir = name.endsWith('/');
  const fullPath = (currentFilePath ? currentFilePath.split('/').slice(0,-1).join('/') + '/' : '') + name;
  if (isDir) {
    const r = await fetch(BASE+'/files/mkdir',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:fullPath.replace(/\\/$/,'')})});
    const d = await r.json();
    d.ok ? (showToast('📁 Pasta criada!'), loadTree()) : showToast('Erro: '+d.error,'error');
  } else {
    const r = await fetch(BASE+'/files/write',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:fullPath,content:''})});
    const d = await r.json();
    if (d.ok) { showToast('📄 Arquivo criado!'); loadTree(); setTimeout(()=>openFile(fullPath),500); }
    else showToast('Erro: '+d.error,'error');
  }
  document.getElementById('fmNewName').value='';
}

// Init
loadStatus();
setInterval(loadStatus, 10000);
setInterval(() => { if (currentTab==='logs') loadLogs(); }, 30000);
</script>
</body>
</html>`;

router.get("/painel", requireAuth, (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(HTML);
});

export default router;
