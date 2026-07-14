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
    file: "lessons/互動英語/夜市英語劇場_Ep1-2.html",
    title: "夜市英語劇場｜Ep.1–2 臭豆腐事件簿",
    subtitle: "連續劇式故事包：文法藏在劇情裡（Ep.1 連綴動詞、Ep.2 過去進行式），含互動練習與共用字彙池",
    subject: "英語",
    level: "國中",
    added: "2026-07-14",
    tags: ["連綴動詞", "過去進行式", "語感", "情境對話", "國二", "八年級", "字彙"]
  },
  {
    file: "lessons/國二數學/八上1_乘法公式與多項式.html",
    title: "國二數學｜乘法公式與多項式",
    subtitle: "八上第 1 章：三大乘法公式、多項式加減乘除，含例題詳解與章末總測驗",
    subject: "數學",
    level: "國中",
    added: "2026-07-14",
    tags: ["乘法公式", "多項式", "平方差", "長除法", "108課綱", "國二", "八年級"]
  },
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
