// 真的用滑鼠點完整局（375px）：檢查每個表單都接好了。執行：node click.mjs [遊戲檔] [--shots=資料夾]
// 每家公司各玩一局，答案取自 CG.core 的正解；最後確認到了結局、主控台 0 錯誤。
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
const SHOTS = (args.find((a) => a.startsWith('--shots=')) || '').slice(8);
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
let failed = 0;
for (const [cid, plan] of Object.entries(PLANS)) {
  const page = await browser.newPage({ viewport: { width: 375, height: 760 } });
  page.setDefaultTimeout(4000);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(pathToFileURL(FILE).href);
  const screen = () => page.evaluate(() => CG.app.getState().screen);
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(30); };
  const clickText = async (text) => { await page.locator('#app button', { hasText: text }).first().click(); await page.waitForTimeout(30); };
  try {
    // 序章
    await clickText('開始（從序章）');
    await click('#app button[data-id="scenario"]');
    await click('#app button[data-id="r2-1"]');
    await clickText('下一步：選公司');
    // 公司與據點
    await click('#app button.mp-co[data-id="' + cid + '"]');
    await click('#app button[data-tile="' + plan.tileId + '"]');
    await clickText('就選這裡，開始');
    for (let t = 0; t < 3; t++) {
      await clickText('開始分析');
      const ans = await page.evaluate(([cid, tid]) => {
        const C = CG.core, g = CG.app.getState().game;
        return { risks: C.relevantRisks(cid, tid), fams: C.requiredFamilies(cid, tid) };
      }, [cid, plan.tileId]);
      // 第 1 步
      for (const r of (ans.risks.length ? ans.risks : ['none'])) await click('#app input[name="risk"][value="' + r + '"]');
      await clickText('送出這一步');
      // 第 2 步
      for (const f of ans.fams) await click('#app button[data-family="' + f + '"]');
      await clickText('送出這一步');
      // 第 3 步
      if (ans.fams.includes('none')) await clickText('下一步');
      else { await click('#app button[data-scen="SSP5-8.5"]'); await click('#app button[data-scen="SSP1-1.9"]'); await clickText('送出這一步'); }
      // 第 4 步
      const depth = await page.evaluate((cid) => { const g = CG.app.getState().game; return CG.core.correctDepth(cid, CG.core.apAvailable(g, g.turnIndex)); }, cid);
      await click('#app input[name="depth"][value="' + depth + '"]');
      await clickText('送出這一步');
      // 第 5 步：照完整試算回答
      const truths = await page.evaluate(() => { const g = CG.app.getState().game, out = {}; ['high', 'netzero'].forEach((r) => { const a = CG.core.assess(g, r, g.turnIndex, []); out[r] = a; }); return out; });
      for (const r of ['high', 'netzero']) for (const q of ['q1', 'q2']) {
        const b = page.locator('#app button[data-key="' + r + q + (truths[r][q] ? '會' : '不會') + '"]');
        if (await b.count()) { await b.first().click(); await page.waitForTimeout(20); }
      }
      await clickText('送出這一步');
      // 第 6 步
      for (const m of plan.bought[t]) await click('#app input[name="measure"][value="' + m + '"]');
      await page.locator('#app select[name="owner"]').selectOption({ index: 1 });
      const kri = await page.evaluate(([cid, tid]) => { const rel = CG.core.relevantRisks(cid, tid); const k = rel.length ? GAME_DATA.erm.kris.find((k) => k.risks.some((r) => rel.includes(r))) : GAME_DATA.erm.kris.find((k) => k.id === 'kriReview'); return k.id; }, [cid, plan.tileId]);
      await click('#app input[name="kri"][value="' + kri + '"]');
      if (SHOTS && t === 0) await page.screenshot({ path: path.join(SHOTS, 'click-' + cid + '-step6.png'), fullPage: true });
      await clickText('決定，快轉二十年');
      if ((await screen()) !== 'settle') throw new Error('第 ' + (t + 1) + ' 回合沒有進到結算：' + (await page.locator('.cg-error').textContent()));
      if (SHOTS && t === 2) await page.screenshot({ path: path.join(SHOTS, 'click-' + cid + '-settle3.png'), fullPage: true });
      await clickText(t < 2 ? '下一回合' : '看結局');
    }
    const st = await page.evaluate(() => CG.app.getState());
    const checks = st.game.turns.flatMap((tr) => Object.entries(tr.checks).filter(([, c]) => !c.ok).map(([k]) => k));
    const verdict = await page.locator('[data-verdict]').getAttribute('data-verdict');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'click-' + cid + '-ending.png'), fullPage: true });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const ok = st.screen === 'ending' && checks.length === 0 && verdict === 'resilient' && errors.length === 0 && over <= 1;
    if (!ok) failed++;
    console.log((ok ? 'ok  ' : 'FAIL') + ' ' + cid + '：點完整局 → ' + st.screen + '，路線 ' + st.game.routeId + '，評語 ' + verdict +
      (checks.length ? '，答錯 ' + checks.join('、') : '') + (errors.length ? '，主控台錯誤 ' + errors.slice(0, 2).join(' | ') : '') + (over > 1 ? '，橫向多出 ' + over + 'px' : ''));
  } catch (e) {
    failed++;
    console.log('FAIL ' + cid + '：' + String(e).split('\n')[0]);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'click-' + cid + '-error.png'), fullPage: true });
  }
  await page.close();
}
await browser.close();
console.log(failed ? '\n有 ' + failed + ' 局沒過' : '\n5 局都點完了');
process.exit(failed ? 1 : 0);
