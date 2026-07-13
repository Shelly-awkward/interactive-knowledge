// 教材清單 — 新增教材時在陣列最前面 append 一筆即可（index.html 會自動渲染成卡片）
// 欄位說明：
//   file     教材檔案路徑（相對於 repo 根目錄，放在 lessons/ 底下）
//   title    標題
//   subtitle 副標／一句話介紹
//   subject  科目領域（目錄頁會自動彙整成篩選按鈕）
//   level    適用對象
//   added    加入日期 YYYY-MM-DD
//   tags     關鍵字（給搜尋用）
window.__LESSONS__ = [
  {
    file: "lessons/夜市經濟學.html",
    title: "夜市經濟學",
    subtitle: "看懂世界怎麼運轉的 8 堂互動課",
    subject: "社會．經濟",
    level: "國中",
    added: "2026-07-13",
    tags: ["供給與需求", "價格", "機會成本", "經濟學入門"]
  }
];
