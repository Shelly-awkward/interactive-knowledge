// 把遊戲 HTML 的所有 <script> 依序放進 Node 的 vm 執行，回傳 window（含 GAME_DATA 與 CG）。
// 用法：import { load } from './load.mjs'; const w = load(pathToHtml);
import fs from 'node:fs';
import vm from 'node:vm';
export function load(file) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const listeners = {};
  const ctx = { console, Math, Date, JSON, Object, Array, Number, String, Set, Map, Infinity, setTimeout, clearTimeout };
  ctx.window = ctx;
  ctx.document = { addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); }, getElementById: () => null };
  vm.createContext(ctx);
  // 每段 script 共用同一個全域（跟瀏覽器一樣，頂層 const 在後面的 script 也看得到）
  vm.runInContext(scripts.join('\n;\n'), ctx, { filename: file });
  ctx.GAME_DATA = vm.runInContext('GAME_DATA', ctx);
  return ctx;
}
