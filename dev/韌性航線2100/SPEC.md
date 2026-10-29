# 《韌性航線 2100》介面規格

給 Codex 任務（T1–T4）的共同規格。設計稿另見 claude.ai 上的「氣候情境策略遊戲 設計稿 v0.1」。

## 1. 檔案與分工

成品只有一個檔：`lessons/會計準則/韌性航線2100_氣候情境分析策略遊戲.html`。雙擊就能打開，不連網、不用外部套件。

檔案用註解切成區塊，格式是 `REGION:名稱` 到 `END:名稱`。每個任務**只能改自己的區塊**，其他區塊一個字都不能動。

| 區塊 | 擁有者 | 內容 |
| --- | --- | --- |
| `DATA` | 總指揮 | `GAME_DATA`：公司、地圖、事件、措施、台詞、數字 |
| `STYLE-CORE` | 總指揮 | 共用色票（CSS 變數）與重設 |
| `CORE` | 總指揮 | `CG.core`：規則與計算 |
| `STUBS` | 總指揮 | 陽春的預設畫面，讓各任務能單獨測試 |
| `STYLE-ENGINE`、`ENGINE` | T1 | 狀態機、回合流程、畫面切換、HUD、序章、六步驟畫面、`CG.app`、`CG.debug` |
| `STYLE-MAP`、`MAP` | T2 | 公司卡選擇、地圖、選廠址 |
| `STYLE-EVENTS`、`EVENTS` | T3 | 顧問台詞與回饋、資料庫卡、參數卡、預估顯示、事件卡 |
| `STYLE-ENDING`、`ENDING` | T4 | 結局評語、另一路線對照、整理表、學習紀錄、重玩 |
| `BOOT` | 總指揮 | `DOMContentLoaded` 時呼叫 `CG.app.start(#app)` |

各 `<script>` 區塊是分開的標籤，一個區塊壞掉不會拖垮別的。全域只用 `window.CG` 和 `GAME_DATA`。

## 2. 共同規則

1. 不載入任何外部資源：沒有 CDN、沒有網路字型、沒有圖片網址。圖形用 CSS 或內嵌 SVG。
2. 繁體中文、台灣用語。介面文字可以寫在程式裡；**遊戲內容（公司、事件、數字、台詞）一律從 `GAME_DATA` 讀**，不要自己寫死。
3. 只要畫面出現 `src:'demo'` 或 `src:'assumed'` 的數字，旁邊就要加 `CG.ui.srcTag(src)` 回傳的標籤（「示範數字，非現行最佳估計」或「遊戲假設」）。
4. 手機寬 375px 不能出現橫向捲動。可點的東西至少 44px 高（`var(--tap)`）。
5. 可點的東西用 `<button>`、`<input>`、`<select>`，鍵盤要能操作。焦點要看得到。
6. 顏色用 `STYLE-CORE` 的變數：實體風險 `--phys`、轉型風險 `--trans`、機會 `--opp`。
7. 所有插入 HTML 的文字都要經過 `CG.ui.esc()`。
8. 不要用 `localStorage`（不需要存檔）。不要用 emoji 當裝飾。
9. 不要出現任何動漫、遊戲的名稱或角色，不要出現真實公司名稱。

## 3. `CG.core`（總指揮已寫好，只能呼叫）

單位：金額「億元」；產能「%」；排放「萬噸／年」。

| 函式 | 回傳 |
| --- | --- |
| `company(id)` `measure(id)` `event(id)` `risk(id)` `family(id)` `scenario(id)` `route(id)` `tile(id)` | `GAME_DATA` 裡的那一筆 |
| `tiles()` | 36 格 `{id:'r2c0', row, col, terrain}` |
| `terrainOf(tileId)` | `{id, name, pros, cons, hazards:{flood,sealevel,heat,slope}, siteAdjFrac}` |
| `otherRoute(routeId)` | 另一條路線的 id |
| `relevantRisks(companyId, tileId)` | 第 1 步的正解（風險 id 陣列） |
| `requiredFamilies(companyId, tileId)` | 第 2 步的正解（資料類別 id 陣列；Z 是 `['none']`） |
| `apAvailable(game, turnIndex)` | 本回合可用分析點 |
| `correctDepth(companyId, ap)` | 第 4 步的正解：`qualitative`／`simplified`／`full` |
| `coverage(scenarioIds)` | `{high, netzero, reference}`：選到哪幾邊 |
| `measuresFor(companyId)` | 這家公司可買的措施 |
| `measureCost(measureId, companyId)` | 一次性成本（億元） |
| `measureOpex(measureId, companyId)` | 每年營運成本（億元） |
| `carbonPrice(routeId, turnIndex)` | `{twd, usd, src, note, fxSrc}` |
| `project({companyId, tileId, routeId, turnIndex, measureIds})` | 一個回合的結果 `{events, capacity, cf, parts}` |
| `evaluate({companyId, tileId, routeId, boughtByTurn})` | 三回合 `{routeId, turns[], q1, q2, verdict}` |
| `assess(game, routeId, turnIndex, extraIds)` | 第 5 步：照目前措施（加上 extra）、之後不再加碼，`{q1, q2, turns}` |
| `settleTurn(game)` | 本回合在實際路線的結果，存進 `turns[t].outcome` |
| `check.step1`～`check.step6` | 各步驟的對錯判定（見第 5 節） |
| `forecastLevel(turnRecord, riskId)` | `hidden`／`noData`／`qualitative`／`simplified`／`full` |
| `band(metric, value, companyId)` | 「輕微／中等／嚴重」 |
| `summaryRows(game, actual)` | 結局整理表的列 |
| `learningRecord(game)` | 六步驟各答對幾次 |
| `newGame({companyId, tileId, routeId?, rng?})` | 新的 `game`；沒給 `routeId` 就隨機暗抽 |
| `boughtByTurn(game)` | `[[...],[...],[...]]` |
| `fmtYi(n)` `fmtPct(n)` `round(n, d)` | 格式化 |

**事件結果** `EventResult`：

```
{ id, title, kind: 'physical'|'transition'|'opportunity', risk, metric: 'capacity'|'cf',
  raw,        // 調適前。capacity：產能損失百分點（正數）；cf：每年億元（負數＝損失）
  value,      // 調適後
  mitigatedBy: [measureId], missed: bool /* 機會沒把握到 */, src, text,
  extra: { price?, emissions?, emissionsAfter?, emissionsSrc?, requires?, longNote? } }
```

**判定**：`q1` ＝ 任一回合產能 < 80；`q2` ＝ 長期回合年現金流 < 0。`verdict`：兩個都 false → `resilient`；都 true → `weak`；其他 → `partial`。

## 4. `game` 狀態（`CG.core.newGame` 產生）

```
game = {
  version: 1, companyId, tileId, routeId /* 隱藏，結局才揭曉 */,
  turnIndex: 0..2, stepIndex: 0..5, budget /* 億元，可用 */, spent,
  turns: [ TurnRecord × 3 ]
}
TurnRecord = {
  risks: [], families: [], scenarios: [], depth: null,
  predictions: { high?: {q1, q2}, netzero?: {q1, q2} }, truths: { 同上 },
  bought: [measureId], erm: { owner, kris: [] },
  checks: { step1..step6 }, apPenalty: 0, overCost: 0, outcome: null /* settleTurn 的結果 */
}
```

## 5. 流程與動作（T1 實作 `CG.app`）

```
appState = {
  screen: 'title'|'prologue'|'company'|'site'|'turnIntro'|'step'|'settle'|'ending',
  prologue: { pick: null, situation: null, round2: null },
  draft: { companyId: null, tileId: null },
  game: null | game,
  feedback: []   // 最近一次動作的顧問回饋 [{text, src}]
}
```

`CG.app.reset()` 把 `appState` 回到初始（title 畫面）。`CG.app.getState()` 回傳深拷貝。`CG.app.act(type, payload)` 是唯一能改狀態的入口，回傳 `appState` 的深拷貝。動作不合法（畫面不對、資料不合規則）就 `throw new Error(說明)`，狀態不變。**`act` 不能依賴 DOM**：沒呼叫過 `CG.app.start` 時也要能跑（Node 測試會這樣用）；有 start 過才重畫畫面。

| 動作 | 允許的畫面 | 效果 |
| --- | --- | --- |
| `title/start` | title | → prologue |
| `prologue/pick` `{agentId, situationId?}` | prologue | 記下選擇；`situationId` 沒給就隨機抽 |
| `prologue/round2` `{option}` | prologue（已 pick） | 記下答案 |
| `prologue/done` | prologue（已答 round2） | → company |
| `prologue/skip` | title、prologue | → company |
| `company/pick` `{companyId}` | company | 記到 draft → site |
| `site/pick` `{tileId}` | site | 記到 draft |
| `site/back` | site | → company |
| `game/start` `{routeId?, rng?}` | site（已選格子） | `game = CG.core.newGame(...)` → turnIntro |
| `turn/begin` | turnIntro | → step，`stepIndex = 0` |
| `step1` `{risks}` | step 0 | `checks.step1 = core.check.step1(...)` → step 1。可含 `'none'`（「都不相關」），但 `'none'` 不能跟其他一起選 |
| `step2` `{families}` | step 1 | `checks.step2`；`apPenalty = checks.step2.apPenalty` → step 2 |
| `step3` `{scenarios}` | step 2 | 選 1–3 個；`step3` 判定 `notNeeded` 時可為空 → step 3 |
| `step4` `{depth}` | step 3 | 成本超過 `apAvailable` 就 throw；`checks.step4`；`budget -= overCost`（最低 0） → step 4 |
| `step5` `{predictions}` | step 4 | 要答的路線＝`coverage(scenarios)` 選到的那幾邊（`notNeeded` 時兩邊都答）。`truths[rid]` 用 `core.assess(game, rid, t, [])` 的 q1、q2。`checks.step5` → step 5 |
| `step6` `{bought, erm}` | step 5 | 措施要在 `measuresFor` 裡、之前沒買過、總價 ≤ `budget`，否則 throw；扣款；`checks.step6`；`outcome = core.settleTurn(game)` → settle |
| `turn/next` | settle | 不是最後一回合：`turnIndex++`、`budget += company.budget`、`stepIndex = 0` → turnIntro；最後一回合 → ending |
| `replay` `{mode}` | ending | `otherRoute`：同公司同格子、`routeId = otherRoute` 開新局 → turnIntro；`changeCompany` → company；`restart` → title |

每個 `stepN` 動作都把 `CG.ui.feedbackLines(N, check, game)` 的結果放進 `appState.feedback`。

**`CG.debug.autoplay(companyId, tileId, routeId, plan)`**：先 `CG.app.reset()`，再用 `act` 從 `title/start` 打到結局（序章用 `prologue/skip`），回傳 `{ app, actual: core.evaluate(實際路線), other: core.evaluate(另一路線) }`。`plan` 的每個欄位都可省略，省略就用正解：

```
plan = { risks?: [[...]×3], families?: [[...]×3], scenarios?: [[...]×3] /* 預設 ['SSP5-8.5','SSP1-1.9'] */,
         depth?: ['...'×3], bought?: [[...]×3] /* 預設全空 */, erm?: [{owner,kris}×3] /* 預設：第一個負責單位＋第一個相關指標 */ }
```

第 5 步一律答 `truths`（autoplay 可以先算 `core.assess` 再答）。

## 6. 畫面函式（T2–T4 實作；`STUBS` 有陽春版）

T1 只能透過下面這些函式畫 T2–T4 的內容。函式在被呼叫時才去讀 `CG.ui.xxx`，不要在載入時先存起來。

**T2 地圖**

- `CG.ui.renderCompanyPicker(el, {selectedId}, onPick(companyId))`
- `CG.ui.renderMap(el, {companyId, selectedTileId}, onPick(tileId))`

**T3 事件與顧問**

- `CG.ui.advisorTurnStart(game)` → `{text, src}`（把 `{site}` 換成廠址地形名稱）
- `CG.ui.feedbackLines(stepNo, check, game)` → `[{text, src?}]`，套 `GAME_DATA.advisor.feedback` 的句子
- `CG.ui.renderAdvisor(el, {text, src?})` → 在 `el` 後面加一個顧問對話框
- `CG.ui.renderDatabaseCards(el, {selected, onToggle(familyId)})` → 第 2 步的五張資料類別卡，可切換
- `CG.ui.renderParameterCards(el, {families, scenarios, turnIndex})` → 第 3 步的參數卡（只讀）
- `CG.ui.renderForecast(el, {game, turnIndex, routeIds, extraMeasureIds})` → 第 4–6 步的預估，精細度照 `forecastLevel`
- `CG.ui.renderEventCards(el, events, {companyId, turnIndex})` → 結算畫面的事件卡；空陣列時顯示 `GAME_DATA.noEventText`

**T4 結局**

- `CG.ui.renderEnding(el, ctx, {onReplay(mode)})`，`ctx = { game, actual, other, rows: core.summaryRows(game, actual), learning: core.learningRecord(game) }`

**測試用的標記（驗收腳本靠這些找元素，一定要有）**

- T2：地圖每一格是 `<button data-tile="r2c0">`。
- T3：每張事件卡的外層有 `data-kind="physical|transition|opportunity"`；資料庫卡是 `<button>`，有 `aria-pressed`。
- T4：評語區塊有 `data-verdict="resilient|partial|weak"`；整理表每一列有 `data-row`；三個重玩按鈕是 `<button data-replay="otherRoute|changeCompany|restart">`。

## 7. 驗收（每個任務都要過）

1. `file://` 直接打開，瀏覽器主控台 0 個錯誤。
2. 375px 寬沒有橫向捲動；按鈕至少 44px 高。
3. 檔案裡沒有任何 `http://`、`https://` 的資源（`src`、`href`、`url(` 都算）。
4. diff 只動到自己的區塊。

測試指令（在 repo 根目錄）：

```
node dev/韌性航線2100/tests/core.test.mjs
node dev/韌性航線2100/tests/flow.test.mjs        # T1 完成後
node dev/韌性航線2100/tests/accept.mjs           # 瀏覽器驗收
node dev/韌性航線2100/tests/regions.mjs <原檔> <新檔> <允許的區塊...>
```
