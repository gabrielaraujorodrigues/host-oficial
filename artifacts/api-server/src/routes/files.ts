import { Router } from "express";
import fs from "fs";
import path from "path";
import { requireAuth } from "./auth";

const router = Router();
const BOT_ROOT = path.resolve("../../bot");

function safePath(rel: string): string | null {
  const abs = path.resolve(BOT_ROOT, rel.replace(/^\/+/, ""));
  if (!abs.startsWith(BOT_ROOT)) return null;
  return abs;
}

function readDirTree(dir: string, depth = 0): object[] {
  if (depth > 4) return [];
  const SKIP = new Set(["node_modules", ".git", "bot-do-biel-session", "bot-do-biel-subbot"]);
  const items: object[] = [];
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  for (const e of entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  })) {
    if (SKIP.has(e.name) || e.name.startsWith(".")) continue;
    const abs = path.join(dir, e.name);
    const rel = path.relative(BOT_ROOT, abs);
    if (e.isDirectory()) {
      items.push({ name: e.name, type: "dir", path: rel, children: readDirTree(abs, depth + 1) });
    } else {
      const size = (() => { try { return fs.statSync(abs).size; } catch { return 0; } })();
      items.push({ name: e.name, type: "file", path: rel, size });
    }
  }
  return items;
}

router.use(requireAuth);

router.get("/tree", (_req, res) => {
  res.json({ tree: readDirTree(BOT_ROOT), root: "bot/" });
});

router.get("/read", (req, res) => {
  const rel = String(req.query.path || "");
  const abs = safePath(rel);
  if (!abs) return res.status(400).json({ error: "Caminho inválido" });
  try {
    const stat = fs.statSync(abs);
    if (stat.size > 500_000) return res.status(413).json({ error: "Arquivo muito grande (>500KB)" });
    const content = fs.readFileSync(abs, "utf8");
    res.json({ content, path: rel });
  } catch (e) {
    res.status(404).json({ error: "Não foi possível ler o arquivo: " + String(e) });
  }
});

router.put("/write", (req, res) => {
  const { path: rel, content } = req.body;
  const abs = safePath(String(rel || ""));
  if (!abs) return res.status(400).json({ error: "Caminho inválido" });
  try {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, String(content ?? ""), "utf8");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete("/delete", (req, res) => {
  const rel = String(req.query.path || "");
  const abs = safePath(rel);
  if (!abs) return res.status(400).json({ error: "Caminho inválido" });
  const PROTECT = new Set(["settings", "index.js", "package.json"]);
  if (PROTECT.has(path.basename(abs))) {
    return res.status(403).json({ error: "Este arquivo/pasta é protegido e não pode ser excluído." });
  }
  try {
    fs.rmSync(abs, { recursive: true, force: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/mkdir", (req, res) => {
  const { path: rel } = req.body;
  const abs = safePath(String(rel || ""));
  if (!abs) return res.status(400).json({ error: "Caminho inválido" });
  try {
    fs.mkdirSync(abs, { recursive: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
