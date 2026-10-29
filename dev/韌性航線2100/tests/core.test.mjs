// 規則核心（CORE 區塊）的數字與判定測試。執行：node core.test.mjs
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './load.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = process.argv[2] || path.join(here, '../../../lessons/會計準則/韌性航線2100_氣候情境分析策略遊戲.html');
const w = load(FILE);
const C = w.CG.core;
// vm 裡的陣列跟這裡不同 realm，先轉成一般 JSON 再比
const deq = (a, b, m) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b, m);
let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok  ' + name); };
const plain = 'r3c1', estuary = 'r2c0', city = 'r1c1', highland = 'r0c4';
const ev = (companyId, tileId, routeId, bought) => C.evaluate({ companyId, tileId, routeId, boughtByTurn: bought || [[], [], []] });
const fee = (r, i) => r.turns[i].events.find((e) => e.id === 'carbonFee');

t('地圖 36 格、地形 id 都存在', () => {
  assert.equal(C.tiles().length, 36);
  C.tiles().forEach((x) => assert.ok(w.GAME_DATA.terrains[x.terrain], x.id));
  assert.equal(C.terrainOf(estuary).id, 'estuary');
});

t('Y 碳費重現懶人包結論：NT$300 → 0.9 億（低於 2 億）；US$303 → 27.27 億（超過 25 億）', () => {
  const hi = ev('Y', plain, 'high'), nz = ev('Y', plain, 'netzero');
  assert.equal(fee(hi, 0).value, -0.9);
  assert.ok(-fee(hi, 0).value < 2);
  assert.equal(fee(nz, 0).value, -27.27);
  assert.ok(-fee(nz, 0).value > 25);
  assert.equal(fee(nz, 1).value, -58.59);
  assert.equal(fee(nz, 0).src, 'demo');
  assert.equal(fee(nz, 2).src, 'assumed');
});

t('減碳措施會照比例降低碳費', () => {
  const r = ev('Y', plain, 'netzero', [['renewable', 'efficiency', 'icp'], [], []]);
  const f = 0.7 * 0.75 * 0.85;
  assert.equal(fee(r, 0).value, C.round(-27.27 * f, 2));
});

t('攸關風險會跟著廠址變', () => {
  deq(C.relevantRisks('X', estuary), ['flood', 'rain', 'heat', 'sealevel']);
  deq(C.relevantRisks('Z', estuary), []);
  deq(C.relevantRisks('W', city), ['flood', 'heat', 'market']);
  deq(C.relevantRisks('Y', highland), ['rain', 'carbonfee', 'market']);
});

t('該下載的資料類別（依行業規則）', () => {
  deq(C.requiredFamilies('X', estuary), ['climate']);
  deq(C.requiredFamilies('Y', plain), ['climate', 'energy']);
  deq(C.requiredFamilies('Z', plain), ['none']);
  deq(C.requiredFamilies('W', city), ['climate', 'macro']);
  deq(C.requiredFamilies('V', plain), ['climate', 'landuse']);
});

t('比例原則的正解', () => {
  assert.equal(C.correctDepth('Y', 6), 'full');
  assert.equal(C.correctDepth('X', 4), 'full');
  assert.equal(C.correctDepth('X', 3), 'simplified');
  assert.equal(C.correctDepth('W', 3), 'simplified');
  assert.equal(C.correctDepth('V', 2), 'simplified');
  assert.equal(C.correctDepth('V', 4), 'full');
  assert.equal(C.correctDepth('Z', 2), 'qualitative');
  const c = C.check.step4('Z', 'simplified', 2);
  assert.equal(c.ok, false); assert.equal(c.diff, 1); assert.equal(c.overCost, 0.1);
  assert.equal(C.check.step4('V', 'simplified', 2).reasonKey, 'step4SimplifyFirst');
});

t('六個指定案例的韌性判定（T4 驗收也用這組）', () => {
  const cases = [
    ['Z 什麼都不做，高排放', ev('Z', plain, 'high'), 'resilient'],
    ['Y 平原，淨零路線，什麼都不做', ev('Y', plain, 'netzero'), 'partial'],
    ['Y 平原，淨零路線，第 1 回合買再生能源＋節能＋內部碳定價', ev('Y', plain, 'netzero', [['renewable', 'efficiency', 'icp'], [], []]), 'resilient'],
    ['X 河口低地，高排放，什麼都不做', ev('X', estuary, 'high'), 'weak'],
    ['X 河口低地，高排放，兩回合補齊措施', ev('X', estuary, 'high', [['floodgate', 'supplierBackup', 'heatShift'], ['elevate', 'bcp'], []]), 'resilient'],
    ['V 平原，高排放，什麼都不做', ev('V', plain, 'high'), 'weak']
  ];
  cases.forEach(([name, r, want]) => {
    console.log('    ' + name + '：產能 ' + r.turns.map((x) => x.capacity).join('/') + '，年現金流 ' + r.turns.map((x) => x.cf).join('/') + ' → ' + r.verdict);
    assert.equal(r.verdict, want, name);
  });
});

t('每個措施方案都在預算內買得起', () => {
  const plan = (cid, list) => list.reduce((s, id) => s + C.measureCost(id, cid), 0);
  assert.ok(plan('Y', ['renewable', 'efficiency', 'icp']) <= 20);
  assert.ok(plan('X', ['floodgate', 'supplierBackup', 'heatShift']) <= 6);
  assert.ok(plan('X', ['elevate', 'bcp']) <= 6 + 6 - plan('X', ['floodgate', 'supplierBackup', 'heatShift']));
});

t('全部公司 × 全部格子 × 兩條路線，數字都不是 NaN', () => {
  let n = 0;
  w.GAME_DATA.companies.forEach((co) => C.tiles().forEach((tl) => ['high', 'netzero'].forEach((rid) => {
    const all = C.measuresFor(co.id).map((m) => m.id);
    [[[], [], []], [all, [], []]].forEach((b) => {
      const r = ev(co.id, tl.id, rid, b);
      r.turns.forEach((x) => { assert.ok(Number.isFinite(x.capacity) && Number.isFinite(x.cf), co.id + tl.id + rid); });
      const st = Object.assign(C.newGame({ companyId: co.id, tileId: tl.id, routeId: rid }), {});
      const rows = C.summaryRows(st, r);
      assert.ok(rows.length > 0);
      rows.forEach((row) => ['risk', 'kind', 'data', 'impact', 'measures', 'conclusion'].forEach((k) => assert.ok(String(row[k]).length > 0, k)));
      n++;
    });
  })));
  console.log('    跑了 ' + n + ' 組');
});

t('Z 教育兩條路線都沒有事件', () => {
  ['high', 'netzero'].forEach((rid) => ev('Z', plain, rid).turns.forEach((x) => assert.equal(x.events.length, 0)));
});

t('第 6 步：負責單位＋相關監控指標才算納入風險管理', () => {
  assert.equal(C.check.step6('X', estuary, { owner: '總務部', kris: ['kriRain'] }).ok, true);
  assert.equal(C.check.step6('X', estuary, { owner: '總務部', kris: ['kriCarbon'] }).ok, false);
  assert.equal(C.check.step6('Z', plain, { owner: '永續辦公室', kris: ['kriReview'] }).ok, true);
  assert.equal(C.check.step6('X', estuary, { owner: null, kris: ['kriRain'] }).ok, false);
});

console.log('\n全部通過：' + pass + ' 項');
