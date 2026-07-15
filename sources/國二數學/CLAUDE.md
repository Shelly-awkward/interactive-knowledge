# 國二數學自學課程

依 108 課綱國中八年級數學章節架構，用 AI 原創編寫的線上自學課程（不複製任何出版社／平台的版權教材）。
參考章節清單來源：AmazingTalker 部落格的國二數學資源整理文（僅取章節架構，內容全部原創）。

## 檔案格式（每章兩份）

- `八上chN_章名.html`：互動網頁課程。單檔、無外部相依，直接用 Chrome 開啟即可。
  結構＝分頁籤（各小節＋章末總測驗）→ 學習目標 → 觀念卡（公式框/提示/常錯警告）→ 例題（`<details>` 展開詳解）→ 練習題（單題即時對答案）→ 章末 10 題交卷計分（8 題過關）。
- `八上chN_章名_講義.docx`：可列印講義。同內容的 Word 版，練習題答案與解析集中在最後。
  產生方式：docx（npm）腳本，參考 scratchpad 的 make_ch1_docx.js 模式。

## 全學年章節規劃（108 課綱）

八上：1 乘法公式與多項式 ✅ ／ 2 二次方根與畢氏定理 ／ 3 因式分解 ／ 4 一元二次方程式 ／ 5 統計資料處理
八下：6 數列與級數 ／ 7 線型函數 ／ 8 三角形基本性質 ／ 9 平行與四邊形

## 上架位置（GitHub Pages）

- Repo：`Shelly-awkward/interactive-knowledge`（互動知識庫，公開站）
- 網頁版教材上傳到 `lessons/國二數學/`，並在 `lessons/lessons.js` 陣列**最前面**插入一筆登錄（title/subject/tags 等欄位），目錄頁會自動渲染卡片。
- 上傳方式：GitHub Contents API（token 在 `keys/github_token.txt`），中文路徑要先 URL encode。
- 站台：https://shelly-awkward.github.io/interactive-knowledge/
- 講義 docx 留在本機，不上傳。

## 學習紀錄（家長追蹤）

- 每章網頁內建紀錄程式：開頁足跡（每 30 秒累計停留分鐘）、練習題對錯（`type:"practice"`）、測驗成績（`type:"quiz"`），全部寫入 localStorage key `study_log_v1`。
- `學習紀錄.html`：家長檢視頁，讀同一個 localStorage 彙整成每日足跡／測驗成績／常錯觀念。**必須與課程頁同源**（同放 GitHub Pages）才讀得到資料；紀錄只存在孩子用的那個瀏覽器。
- 新章節加紀錄時：複製 ch1 的 logEv／cloudSend 區塊（含 `CLOUD_URL`），改 `CH` 常數；學習紀錄頁的 `SEC` 對照表加上新章的小節名。
- **雲端紀錄（已接通 2026-07-14）**：頁面透過 `CLOUD_URL`（Google Apps Script 網頁應用程式，掛在媽媽的 Google 試算表上）上傳「念書時段摘要」與「章末測驗成績」。試算表 ID：`1ykzygLWPzvsZ_jZIHOmKnmhqKKeslv9hgXcV9Gq7DT4`，欄位＝時間/章節/類型/內容/得分。測試方式：POST UTF-8 JSON 到 CLOUD_URL，回 302 即成功（curl 中文要用 --data-binary @utf8檔案，不能直接 -d）。

## 注意

- 難度照課綱標準、口吻給一般國二生自學（親切、步驟拆細、標出常見錯誤）。
- 數學式用 Unicode（²、³、＋、−）與 `<sup>`，不用 MathJax/KaTeX，保持單檔離線可用。
- 每題答案都要先人工驗算過再寫進檔案。
