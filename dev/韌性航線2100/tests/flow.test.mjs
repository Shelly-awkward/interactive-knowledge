// T1 驗收：用 CG.app.act / CG.debug.autoplay 在 Node 裡把流程跑完。執行：node flow.test.mjs [遊戲檔]
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './load.mjs';
import { PLANS } from './plans.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = process.argv[2] || path.join(here, '../../../lessons/會計準則/韌性航線2100_氣候情境分析策略遊戲.html');
const w = load(FILE);
const C = w.CG.core, A = w.CG.app;
const J = (x) => JSON.parse(JSON.stringify(x));
if (!w.CG.debug || typeof w.CG.debug.autoplay !== 'function') { console.log('T1 尚未完成：沒有 CG.debug.autoplay'); process.exit(2); }

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok  ' + name); };
const throws = (fn, name) => assert.throws(fn, undefined, name);

t('5 家公司 × 2 條路線，autoplay 都打到結局，判定跟 CORE 一致', () => {
  for (const [cid, p] of Object.entries(PLANS)) for (const rid of ['high', 'netzero']) {
    const res = J(w.CG.debug.autoplay(cid, p.tileId, rid, { bought: p.bought }));
    assert.equal(res.app.screen, 'ending', cid + rid);
    const g = res.app.game;
    assert.equal(g.routeId, rid);
    const want = J(C.evaluate({ companyId: cid, tileId: p.tileId, routeId: rid, boughtByTurn: p.bought }));
    assert.equal(res.actual.verdict, want.verdict, cid + rid);
    assert.equal(res.other.routeId, rid === 'high' ? 'netzero' : 'high');
    g.turns.forEach((tr, i) => {
      ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'].forEach((k) => assert.ok(tr.checks[k] && tr.checks[k].ok, cid + rid + ' 回合' + (i + 1) + ' ' + k));
      assert.ok(tr.outcome && Number.isFinite(tr.outcome.capacity) && Number.isFinite(tr.outcome.cf));
    });
    assert.ok(g.budget >= 0);
  }
});

t('動作不合法要 throw，而且狀態不變', () => {
  A.reset();
  const before = J(A.getState());
  throws(() => A.act('step1', { risks: [] }), '在 title 畫面不能做第 1 步');
  assert.deepEqual(J(A.getState()), before);
  A.act('title/start');
  A.act('prologue/skip');
  throws(() => A.act('company/pick', { companyId: 'NOPE' }), '不存在的公司');
  A.act('company/pick', { companyId: 'X' });
  throws(() => A.act('game/start', {}), '還沒選格子');
});

t('序章：選代購 → 揭曉 → 第二輪 → 進公司選擇', () => {
  A.reset();
  A.act('title/start');
  A.act('prologue/pick', { agentId: 'scenario', situationId: 'typhoon' });
  A.act('prologue/round2', { option: 1 });
  const s = J(A.act('prologue/done'));
  assert.equal(s.screen, 'company');
  assert.equal(s.prologue.pick, 'scenario');
  assert.equal(s.prologue.situation, 'typhoon');
});

t('第 6 步做到納入風險管理，下回合分析點 +1；V 到第 3 回合可以做完整量化', () => {
  const res = J(w.CG.debug.autoplay('V', PLANS.V.tileId, 'high', { bought: PLANS.V.bought }));
  const g = res.app.game;
  assert.equal(C.apAvailable(g, 2), 4);
  assert.equal(g.turns[0].depth, 'simplified');
  assert.equal(g.turns[2].depth, 'full');
});

t('過度分析會扣預算（Z 選簡化量化，每回合多花 0.1 億）', () => {
  const res = J(w.CG.debug.autoplay('Z', 'r3c1', 'high', { depth: ['simplified', 'simplified', 'simplified'] }));
  const g = res.app.game;
  g.turns.forEach((tr) => { assert.equal(tr.checks.step4.ok, false); assert.equal(tr.overCost, 0.1); });
  assert.equal(C.round(g.budget, 2), C.round(3 - 0.3, 2));
});

t('超出預算的採購要 throw', () => {
  A.reset();
  A.act('title/start'); A.act('prologue/skip'); A.act('company/pick', { companyId: 'V' }); A.act('site/pick', { tileId: 'r3c1' });
  A.act('game/start', { routeId: 'high' }); A.act('turn/begin');
  A.act('step1', { risks: C.relevantRisks('V', 'r3c1') });
  A.act('step2', { families: C.requiredFamilies('V', 'r3c1') });
  A.act('step3', { scenarios: ['SSP5-8.5', 'SSP1-1.9'] });
  A.act('step4', { depth: 'simplified' });
  const g = J(A.getState()).game;
  const truths = {}; ['high', 'netzero'].forEach((rid) => { const a = C.assess(g, rid, 0, []); truths[rid] = { q1: a.q1, q2: a.q2 }; });
  A.act('step5', { predictions: truths });
  throws(() => A.act('step6', { bought: ['elevate', 'sourcingDiversify'], erm: { owner: '總務部', kris: ['kriRain'] } }), '1.95 億 > 1.5 億');
});

t('重玩：同公司換另一條路線', () => {
  w.CG.debug.autoplay('X', PLANS.X.tileId, 'high', {});
  const s = J(A.act('replay', { mode: 'otherRoute' }));
  assert.equal(s.screen, 'turnIntro');
  assert.equal(s.game.companyId, 'X');
  assert.equal(s.game.tileId, PLANS.X.tileId);
  assert.equal(s.game.routeId, 'netzero');
  assert.equal(s.game.turnIndex, 0);
});

console.log('\n全部通過：' + pass + ' 項');
