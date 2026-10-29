// 瀏覽器驗收（Playwright）。執行：node accept.mjs [遊戲檔] [--only=common,T1,T2,T3,T4] [--shots=輸出資料夾]
// 檢查：主控台 0 錯誤、375px 不橫向捲動、按鈕至少 44px、沒有外部網址；再依任務做專屬檢查。
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PLANS } from './plans.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const FILE = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(here, '../../../lessons/會計準則/韌性航線2100_氣候情境分析策略遊戲.html'));
const only = (args.find((a) => a.startsWith('--only=')) || '--only=common,T1,T2,T3,T4').slice(7).split(',');
const SHOTS = (args.find((a) => a.startsWith('--shots=')) || '').slice(8);
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const record = (group, name, ok, detail) => { results.push({ group, name, ok, detail: detail || '' }); console.log((ok ? 'ok  ' : 'FAIL') + ' [' + group + '] ' + name + (detail ? ' — ' + detail : '')); };

/* 1. 靜態檢查：外部網址 */
const html = fs.readFileSync(FILE, 'utf8');
if (only.includes('common')) {
  const ext = [...html.matchAll(/(?:src|href)\s*=\s*["']\s*(https?:)?\/\/|url\(\s*["']?\s*(https?:)?\/\//gi)].map((m) => m[0]);
  record('common', '沒有外部資源網址', ext.length === 0, ext.slice(0, 3).join(' | '));
}

const browser = await chromium.launch();
async function openPage(width) {
  const page = await browser.newPage({ viewport: { width, height: 760 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.setDefaultTimeout(3000);
  await page.goto(pathToFileURL(FILE).href);
  await page.waitForLoadState('load');
  return { page, errors };
}
/* 版面檢查：不橫向捲動、可見按鈕至少 44px 高 */
async function layoutCheck(page, group, label) {
  const r = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth - window.innerWidth;
    const small = [...document.querySelectorAll('button, [role=button], input[type=checkbox], input[type=radio], select')]
      .filter((b) => { const s = getComputedStyle(b); const rc = b.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && rc.width > 0 && rc.height > 0; })
      .map((b) => { const lab = b.closest('label'); const rc = (b.matches('input') && lab ? lab : b).getBoundingClientRect(); return { h: rc.height, t: (b.textContent || b.getAttribute('aria-label') || b.name || b.tagName).trim().slice(0, 20) }; })
      .filter((x) => x.h < 43.5);
    return { over, small };
  });
  record(group, label + '：不橫向捲動', r.over <= 1, r.over > 1 ? '多出 ' + r.over + 'px' : '');
  record(group, label + '：可點元件至少 44px 高', r.small.length === 0, r.small.slice(0, 4).map((x) => x.t + ' ' + Math.round(x.h) + 'px').join('、'));
}
/* 元素不存在時不要卡住整支腳本 */
async function safeClick(loc) { if (await loc.count()) { await loc.first().click(); return true; } return false; }
async function shot(page, name) { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true }); }

/* 2. 共同：兩種寬度打開，0 錯誤 */
if (only.includes('common')) {
  for (const width of [375, 1280]) {
    const { page, errors } = await openPage(width);
    await page.waitForTimeout(300);
    record('common', width + 'px 打開後主控台 0 錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
    await layoutCheck(page, 'common', width + 'px 首頁');
    await shot(page, 'title-' + width);
    await page.close();
  }
}

/* 3. T1：用 act 把整局走一遍，每個畫面檢查版面並截圖；再點一次真的按鈕 */
if (only.includes('T1')) {
  const { page, errors } = await openPage(375);
  const ready = await page.evaluate(() => !!(window.CG.debug && window.CG.debug.autoplay));
  if (!ready) record('T1', 'CG.debug.autoplay 存在', false, 'T1 尚未完成');
  else {
    const steps = await page.evaluate((P) => {
      const C = CG.core, A = CG.app, out = [];
      const snap = (label) => out.push(label);
      A.reset(); snap('title');
      A.act('title/start'); snap('prologue');
      A.act('prologue/pick', { agentId: 'scenario', situationId: 'typhoon' }); snap('prologue-reveal');
      A.act('prologue/round2', { option: 1 }); snap('prologue-round2');
      A.act('prologue/done'); snap('company');
      A.act('company/pick', { companyId: 'X' }); snap('site');
      A.act('site/pick', { tileId: P.X.tileId }); snap('site-picked');
      A.act('game/start', { routeId: 'high' });
      return out;
    }, PLANS);
    // 逐畫面重播，邊走邊檢查
    const script = [
      ['title', `A.reset()`],
      ['prologue', `A.act('title/start')`],
      ['prologue-reveal', `A.act('prologue/pick', {agentId:'scenario', situationId:'typhoon'})`],
      ['prologue-round2', `A.act('prologue/round2', {option:1})`],
      ['company', `A.act('prologue/done')`],
      ['site', `A.act('company/pick', {companyId:'X'})`],
      ['site-picked', `A.act('site/pick', {tileId:'${PLANS.X.tileId}'})`],
      ['turnIntro-1', `A.act('game/start', {routeId:'high'})`]
    ];
    for (let turn = 0; turn < 3; turn++) {
      const tid = PLANS.X.tileId, b = JSON.stringify(PLANS.X.bought[turn]);
      if (turn > 0) script.push(['turnIntro-' + (turn + 1), `A.act('turn/next')`]);
      script.push(['step1-' + (turn + 1), `A.act('turn/begin')`]);
      script.push(['step2-' + (turn + 1), `A.act('step1', {risks: C.relevantRisks('X','${tid}')})`]);
      script.push(['step3-' + (turn + 1), `A.act('step2', {families: C.requiredFamilies('X','${tid}')})`]);
      script.push(['step4-' + (turn + 1), `A.act('step3', {scenarios:['SSP5-8.5','SSP1-1.9']})`]);
      script.push(['step5-' + (turn + 1), `A.act('step4', {depth: C.correctDepth('X', C.apAvailable(A.getState().game, ${turn}))})`]);
      script.push(['step6-' + (turn + 1), `(function(){ const g=A.getState().game; const tr={}; ['high','netzero'].forEach(r=>{const a=C.assess(g,r,${turn},[]); tr[r]={q1:a.q1,q2:a.q2};}); A.act('step5',{predictions:tr}); })()`]);
      script.push(['settle-' + (turn + 1), `A.act('step6', {bought:${b}, erm:{owner:'總務部', kris:['kriRain']}})`]);
    }
    script.push(['ending', `A.act('turn/next')`]);
    let okAll = true;
    for (const [label, code] of script) {
      try { await page.evaluate('(function(){const C=CG.core,A=CG.app;' + code + ';})()'); }
      catch (e) { okAll = false; record('T1', '動作「' + label + '」', false, String(e).slice(0, 160)); break; }
      await page.waitForTimeout(60);
      await layoutCheck(page, 'T1', label);
      await shot(page, 'T1-' + label);
    }
    record('T1', '用 act 從頭走到結局', okAll && steps.length === 7);
    // 真的點按鈕：重來，在首頁點第一個按鈕，畫面要換
    await page.evaluate(() => CG.app.reset());
    await page.waitForTimeout(60);
    const before = await page.evaluate(() => CG.app.getState().screen);
    const btn = page.locator('#app button:visible').first();
    if (await btn.count()) { await btn.click(); await page.waitForTimeout(60); }
    const after = await page.evaluate(() => CG.app.getState().screen);
    record('T1', '首頁第一個按鈕點了會換畫面', before === 'title' && after !== 'title', before + ' → ' + after);
    record('T1', '整局主控台 0 錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  }
  await page.close();
}

/* 把某個畫面函式畫進一個獨立容器 */
async function renderInto(page, code) {
  return page.evaluate('(function(){ const el=document.createElement("div"); el.id="probe"; document.getElementById("app").innerHTML=""; document.getElementById("app").appendChild(el); window.__picked=null; window.__replay=null; const C=CG.core;' + code + '; return el.innerText; })()');
}

/* 4. T2：公司卡與地圖 */
if (only.includes('T2')) {
  const { page, errors } = await openPage(375);
  const txt = await renderInto(page, `CG.ui.renderCompanyPicker(el, {selectedId:null}, id => window.__picked = id)`);
  record('T2', '公司卡：5 家公司都在', ['X 工程', 'Y 半導體', 'Z 教育', 'W 民生零售', 'V 農產加工'].every((n) => txt.includes(n)));
  record('T2', '公司卡：有 SASB 標示說明', txt.includes('SASB'));
  record('T2', '公司卡：示範數字有標註', txt.includes('示範數字'));
  await layoutCheck(page, 'T2', '公司卡 375px');
  await shot(page, 'T2-company');
  await safeClick(page.locator('#probe button'));
  record('T2', '公司卡：點了會回傳公司 id', !!(await page.evaluate(() => window.__picked)));
  await renderInto(page, `CG.ui.renderMap(el, {companyId:'X', selectedTileId:null}, id => window.__picked = id)`);
  const tiles = await page.evaluate(() => [...document.querySelectorAll('#probe button[data-tile]')].map((b) => { const r = b.getBoundingClientRect(); return { id: b.dataset.tile, w: r.width, h: r.height, right: r.right }; }));
  record('T2', '地圖：36 個格子按鈕（data-tile）', tiles.length === 36, '找到 ' + tiles.length);
  record('T2', '地圖：每格至少 44×44', tiles.length > 0 && tiles.every((x) => x.w >= 43.5 && x.h >= 43.5));
  record('T2', '地圖：375px 一屏寬度內', tiles.length > 0 && tiles.every((x) => x.right <= 375));
  await layoutCheck(page, 'T2', '地圖 375px');
  await shot(page, 'T2-map');
  if (tiles.length) {
    await safeClick(page.locator('#probe button[data-tile="r2c0"]'));
    record('T2', '地圖：點格子回傳 tile id', (await page.evaluate(() => window.__picked)) === 'r2c0');
    await page.evaluate(() => { window.__picked = null; });
    await page.locator('#probe button[data-tile="r3c1"]').focus();
    await page.keyboard.press('Enter');
    record('T2', '地圖：鍵盤 Enter 可以選', (await page.evaluate(() => window.__picked)) === 'r3c1');
    const info = await renderInto(page, `CG.ui.renderMap(el, {companyId:'X', selectedTileId:'r2c0'}, id => window.__picked = id)`);
    record('T2', '地圖：選定格子顯示地形與優缺點', info.includes('河口低地') && info.includes('地租便宜') && info.includes('淹水潛勢高'));
  }
  record('T2', '主控台 0 錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

/* 5. T3：顧問、資料庫卡、參數卡、預估、事件卡 */
if (only.includes('T3')) {
  const { page, errors } = await openPage(375);
  const db = await renderInto(page, `CG.ui.renderDatabaseCards(el, {selected:['climate'], onToggle: id => window.__picked = id})`);
  record('T3', '資料庫卡：NCDR 40 公尺網格限制', db.includes('40 公尺') && db.includes('政府機關'));
  record('T3', '資料庫卡：TCCIP 個人金鑰', db.includes('TCCIP') && db.includes('金鑰'));
  record('T3', '資料庫卡：網站可能改版', db.includes('改版'));
  record('T3', '資料庫卡：五類都在', ['氣候系統參數', '能源系統參數', '總體經濟參數', '土地利用參數', '查無相關主題'].every((n) => db.includes(n)));
  await safeClick(page.locator('#probe button'));
  record('T3', '資料庫卡：點了會回傳類別 id', !!(await page.evaluate(() => window.__picked)));
  await layoutCheck(page, 'T3', '資料庫卡');
  await shot(page, 'T3-db');
  const par = await renderInto(page, `CG.ui.renderParameterCards(el, {families:['climate','energy'], scenarios:['SSP5-8.5','SSP1-1.9'], turnIndex:2})`);
  record('T3', '參數卡：長期 SSP5-8.5 顯示約 219 毫米與示範標記', par.includes('219') && par.includes('示範數字'));
  record('T3', '參數卡：遊戲假設標記', par.includes('遊戲假設'));
  await shot(page, 'T3-params');
  const yCards = await renderInto(page, `CG.ui.renderEventCards(el, C.project({companyId:'Y', tileId:'r3c1', routeId:'netzero', turnIndex:0, measureIds:[]}).events, {companyId:'Y', turnIndex:0})`);
  record('T3', '事件卡：Y 淨零短期碳費 27.27 億，有示範標記', yCards.includes('27.27') && yCards.includes('示範數字'));
  const xCards = await renderInto(page, `CG.ui.renderEventCards(el, C.project({companyId:'X', tileId:'r2c0', routeId:'high', turnIndex:2, measureIds:['floodgate','bcp']}).events, {companyId:'X', turnIndex:2})`);
  record('T3', '事件卡：X 高排放長期顯示調適前後與措施名稱', xCards.includes('防水閘門') && xCards.includes('219'));
  const kinds = await page.evaluate(() => ['physical', 'transition', 'opportunity'].map((k) => document.querySelectorAll('#probe [data-kind="' + k + '"]').length));
  record('T3', '事件卡：用 data-kind 標出實體／轉型／機會', kinds[0] > 0 && kinds[2] > 0, kinds.join('/'));
  await layoutCheck(page, 'T3', '事件卡');
  await shot(page, 'T3-events');
  const zCards = await renderInto(page, `CG.ui.renderEventCards(el, [], {companyId:'Z', turnIndex:0})`);
  const noEv = await page.evaluate(() => GAME_DATA.noEventText);
  record('T3', '事件卡：沒事件時顯示 noEventText', zCards.includes(noEv));
  const fc = await renderInto(page, `const g=C.newGame({companyId:'Y', tileId:'r3c1', routeId:'high'}); g.turns[0].risks=['carbonfee','flood']; g.turns[0].families=['energy']; g.turns[0].depth='full'; CG.ui.renderForecast(el, {game:g, turnIndex:0, routeIds:['high','netzero'], extraMeasureIds:[]})`);
  record('T3', '預估：沒下載資料的風險顯示估不出來', fc.includes('估不出來') || fc.includes('缺資料'));
  record('T3', '預估：完整量化時顯示億元數字', fc.includes('億元'));
  await shot(page, 'T3-forecast');
  const lines = await page.evaluate(() => {
    const C = CG.core, g = C.newGame({ companyId: 'X', tileId: 'r2c0', routeId: 'high' });
    const L = (n, c) => CG.ui.feedbackLines(n, c, g);
    return [
      L(1, C.check.step1('X', 'r2c0', ['flood'])), L(2, C.check.step2('X', 'r2c0', ['climate', 'energy'])),
      L(3, C.check.step3(['SSP5-8.5'], ['climate'])), L(4, C.check.step4('X', 'qualitative', 4)),
      L(5, C.check.step5({ high: { q1: true, q2: true } }, { high: { q1: true, q2: false } })), L(6, C.check.step6('X', 'r2c0', { owner: null, kris: [] }))
    ].map((arr) => (arr || []).map((x) => x.text).join(' '));
  });
  record('T3', '回饋：六步都有句子', lines.every((s) => s.length > 0), lines.map((s) => s.slice(0, 14)).join(' / '));
  record('T3', '回饋：第 1 步列出漏掉的風險名稱', lines[0].includes('強降雨'));
  record('T3', '回饋：選了氣候資料就提醒資料庫限制', lines[1].includes('40 公尺'));
  const adv = await page.evaluate(() => CG.ui.advisorTurnStart(CG.core.newGame({ companyId: 'W', tileId: 'r1c1', routeId: 'high' })).text);
  record('T3', '開場台詞把 {site} 換成地形名', adv.includes('都會') && !adv.includes('{site}'));
  record('T3', '主控台 0 錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

/* 6. T4：結局 */
if (only.includes('T4')) {
  const { page, errors } = await openPage(375);
  const cases = [
    ['Z', 'r3c1', 'high', [[], [], []], '具韌性'],
    ['Y', 'r3c1', 'netzero', [[], [], []], '需補強'],
    ['Y', 'r3c1', 'netzero', [['renewable', 'efficiency', 'icp'], [], []], '具韌性'],
    ['X', 'r2c0', 'high', [[], [], []], '韌性不足'],
    ['X', 'r2c0', 'high', [['floodgate', 'supplierBackup', 'heatShift'], ['elevate', 'bcp'], []], '具韌性'],
    ['V', 'r3c1', 'high', [[], [], []], '韌性不足']
  ];
  for (const [cid, tid, rid, bought, want] of cases) {
    const res = await page.evaluate(([cid, tid, rid, bought]) => {
      const C = CG.core;
      const g = C.newGame({ companyId: cid, tileId: tid, routeId: rid });
      g.turns.forEach((t, i) => { t.bought = bought[i]; t.risks = C.relevantRisks(cid, tid); t.families = C.requiredFamilies(cid, tid); t.scenarios = ['SSP5-8.5', 'SSP1-1.9']; t.depth = 'full'; });
      const actual = C.evaluate({ companyId: cid, tileId: tid, routeId: rid, boughtByTurn: bought });
      const other = C.evaluate({ companyId: cid, tileId: tid, routeId: C.otherRoute(rid), boughtByTurn: bought });
      const rows = C.summaryRows(g, actual);
      const el = document.getElementById('app'); el.innerHTML = '';
      window.__replay = null;
      CG.ui.renderEnding(el, { game: g, actual, other, rows, learning: C.learningRecord(g) }, { onReplay: (m) => { window.__replay = m; } });
      const head = el.querySelector('[data-verdict]');
      return { text: el.innerText, verdictAttr: head ? head.getAttribute('data-verdict') : null, verdict: actual.verdict, rows: rows.length,
        rowEls: el.querySelectorAll('[data-row]').length, buttons: [...el.querySelectorAll('button[data-replay]')].map((b) => b.dataset.replay) };
    }, [cid, tid, rid, bought]);
    const label = cid + ' ' + rid + (bought.flat().length ? ' 有措施' : ' 不做');
    record('T4', label + '：評語是「' + want + '」', res.text.includes(want) && res.verdictAttr === res.verdict, 'data-verdict=' + res.verdictAttr);
    record('T4', label + '：整理表列數＝rows', res.rowEls === res.rows, res.rowEls + '/' + res.rows);
    record('T4', label + '：三個重玩按鈕', ['otherRoute', 'changeCompany', 'restart'].every((m) => res.buttons.includes(m)));
    record('T4', label + '：免責文字與最後一問', res.text.includes('不能當作實際風險評估或 IFRS S2 揭露數字') && res.text.includes('會把錢交給這家公司嗎'));
    await layoutCheck(page, 'T4', label);
    await shot(page, 'T4-' + cid + '-' + rid + (bought.flat().length ? '-m' : ''));
  }
  await safeClick(page.locator('button[data-replay="otherRoute"]'));
  record('T4', '重玩按鈕會呼叫 onReplay', (await page.evaluate(() => window.__replay)) === 'otherRoute');
  record('T4', '主控台 0 錯誤', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

await browser.close();
const fails = results.filter((r) => !r.ok);
console.log('\n' + (results.length - fails.length) + '／' + results.length + ' 項通過');
if (SHOTS) fs.writeFileSync(path.join(SHOTS, 'accept-result.json'), JSON.stringify(results, null, 1));
process.exit(fails.length ? 1 : 0);
