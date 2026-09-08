// 教材清單 — 新增教材時在陣列最前面 append 一筆即可（index.html 會自動渲染成卡片）
// 欄位說明：
//   file     教材檔案路徑（相對於 repo 根目錄，放在 lessons/ 底下；也可以是完整網址，連到外部網站）
//   title    標題
//   subtitle 副標／一句話介紹
//   subject  科目領域（目錄頁會自動彙整成篩選按鈕）
//   level    適用對象
//   added    加入日期 YYYY-MM-DD
//   tags     關鍵字（給搜尋用）
window.__LESSONS__ = [
  {
    file: "lessons/數學遊戲/因數方塊.html",
    title: "數學遊戲｜因數方塊",
    subtitle: "俄羅斯方塊版因數分解：數字掉下來，拆成幾×幾就變成那個形狀的長方形，質數拆不開。三個等級（2～30／50／100）",
    subject: "數學",
    level: "國小～國中",
    added: "2026-09-08",
    tags: ["遊戲", "因數", "質數", "合數", "平方數", "因數分解", "俄羅斯方塊", "九九乘法", "分級"]
  },
  {
    file: "lessons/數學遊戲/九九乘法衝刺.html",
    title: "數學遊戲｜九九乘法衝刺",
    subtitle: "60 秒速算：連對加成、答錯歸零，結算列出要多練的題目。初級 2～5、中級 2～9、高級反過來填缺數與除法",
    subject: "數學",
    level: "國小～國中",
    added: "2026-09-08",
    tags: ["遊戲", "九九乘法", "乘法", "除法", "速算", "計時", "分級"]
  },
  {
    file: "lessons/國二數學/八上3_因式分解.html",
    title: "國二數學｜因式分解",
    subtitle: "八上第 3 章：用「拼長方形」看懂因式分解。面積翻轉動畫、可拖曳的代數磚拼盤、十字交乘檢查器，含例題詳解與章末總測驗",
    subject: "數學",
    level: "國中",
    added: "2026-09-08",
    tags: ["因式分解", "提公因式", "平方差", "完全平方", "十字交乘", "面積模型", "代數磚", "108課綱", "國二", "八年級"]
  },
  {
    file: "lessons/國語文/成語練習_一字成語80題.html",
    title: "成語練習｜「一」字成語 80 題",
    subtitle: "第一～四回：看解釋寫成語 40 題＋讀例句填成語 40 題。可選選擇題或填空打字，附成語辭典與錯題本",
    subject: "國語文",
    level: "國小～國中",
    added: "2026-09-06",
    tags: ["成語", "一字成語", "看解釋寫成語", "讀例句填成語", "填空", "錯題本", "國語", "語文"]
  },
  {
    file: "lessons/國小四年級數學/四上2_角度.html",
    title: "小四數學｜角度",
    subtitle: "四上第 2 單元：角的意義與五種角、量角器的量法與畫法、角的加減與時鐘角度，含角度滑桿與量角器讀數練習",
    subject: "數學",
    level: "國小",
    added: "2026-09-04",
    tags: ["角度", "角", "銳角", "直角", "鈍角", "平角", "周角", "量角器", "度", "三角板", "時鐘角度", "108課綱", "小四", "四年級"]
  },
  {
    file: "lessons/國小四年級數學/四上1_一億以內的數.html",
    title: "小四數學｜一億以內的數",
    subtitle: "四上第 1 單元：十萬到一億的位值、讀寫換算、比大小與大數計算，含讀數小工具與單元測驗",
    subject: "數學",
    level: "國小",
    added: "2026-09-03",
    tags: ["一億以內的數", "位值", "數位", "萬", "十萬", "百萬", "千萬", "大數", "108課綱", "小四", "四年級"]
  },
  {
    file: "lessons/地球演化.html",
    title: "地球演化：板塊漂移與生物",
    subtitle: "會自轉的地球從冥古宙播到現在：陸塊聚合裂解、冰河期，配上各年代的代表生物",
    subject: "自然科學",
    level: "國中",
    added: "2026-08-25",
    tags: ["地球科學", "板塊構造", "盤古大陸", "地質年代", "演化", "冰河期", "台灣", "蓬萊造山運動"]
  },
  {
    file: "lessons/jlpt-verbs/index.html",
    title: "日本語動詞カード小冊子",
    subtitle: "15 個核心動詞 × 18 張情境圖，看圖記住動詞變化",
    subject: "日本語",
    level: "JLPT N5–N2",
    added: "2026-07-15",
    tags: ["動詞變化", "活用", "ない形", "て形", "圖像記憶"]
  },
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
  },
  {
    file: "https://shelly-awkward.github.io/jlpt-quiz/",
    title: "N2 考前猜題 500",
    subtitle: "互動測驗：文字語彙・文法，即時對答案",
    subject: "日本語",
    level: "JLPT N2",
    added: "2026-07-05",
    tags: ["JLPT", "N2", "考前猜題", "測驗"]
  },
  {
    file: "https://shelly-awkward.github.io/jlpt-quiz/n1.html",
    title: "N1 考前猜題 500",
    subtitle: "互動測驗：文字語彙・文法，即時對答案",
    subject: "日本語",
    level: "JLPT N1",
    added: "2026-07-05",
    tags: ["JLPT", "N1", "考前猜題", "測驗"]
  },
  {
    file: "https://shelly-awkward.github.io/jlpt-quiz/n1r.html",
    title: "N1 読解・聴解 500",
    subtitle: "互動測驗：讀解與聽解專項",
    subject: "日本語",
    level: "JLPT N1",
    added: "2026-07-05",
    tags: ["JLPT", "N1", "読解", "聴解", "測驗"]
  },
  {
    file: "https://shelly-awkward.github.io/jlpt-quiz/n3.html",
    title: "N3 考前猜題 500",
    subtitle: "互動測驗：文字語彙・文法，即時對答案",
    subject: "日本語",
    level: "JLPT N3",
    added: "2026-07-05",
    tags: ["JLPT", "N3", "考前猜題", "測驗"]
  }
];
