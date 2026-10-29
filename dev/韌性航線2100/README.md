# 《韌性航線 2100》開發資料夾

成品：`lessons/會計準則/韌性航線2100_氣候情境分析策略遊戲.html`（單一檔，雙擊就能玩）。這個資料夾只放開發用的規格、派工單和測試，不會出現在目錄頁。

| 檔案 | 用途 |
| --- | --- |
| `SPEC.md` | 介面規格：區塊分工、`CG.core` 函式、狀態、動作、畫面函式 |
| `tasks/T1.md`～`T4.md`、`tasks/_common.md` | 給 Codex 的四張派工單（目標、輸入、輸出、驗收） |
| `dispatch.sh` | 把任務派給 Codex，各自在獨立 worktree 裡做 |
| `verify.sh` | 驗收一個任務：只改自己的區塊、測試全過 |
| `tests/core.test.mjs` | 規則核心的數字與判定（Node） |
| `tests/flow.test.mjs` | 回合流程（Node，T1 完成後） |
| `tests/accept.mjs` | 瀏覽器驗收：主控台錯誤、375px 版面、各任務專屬檢查（Playwright） |
| `tests/regions.mjs`、`tests/merge.mjs` | 檢查改動範圍、把任務的區塊合回正本 |

要改遊戲內容（公司、事件、數字、台詞），只改成品檔開頭的 `GAME_DATA`，再跑 `node dev/韌性航線2100/tests/core.test.mjs` 確認判定沒壞。
