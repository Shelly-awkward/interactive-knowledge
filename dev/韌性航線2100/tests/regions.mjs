// 檢查新檔只改了允許的區塊。執行：node regions.mjs <原檔> <新檔> <允許的區塊...>
// 例：node regions.mjs base.html t2.html MAP STYLE-MAP
import fs from 'node:fs';
export function splitRegions(text) {
  const re = /REGION:([A-Z-]+) ====[\s\S]*?END:\1 ====/g;
  const regions = {};
  let outside = '', last = 0, m;
  while ((m = re.exec(text))) { outside += text.slice(last, m.index) + '<<' + m[1] + '>>'; regions[m[1]] = m[0]; last = re.lastIndex; }
  outside += text.slice(last);
  return { regions, outside };
}
if (process.argv[1] && process.argv[1].endsWith('regions.mjs')) {
  const [a, b, ...allowed] = process.argv.slice(2);
  const A = splitRegions(fs.readFileSync(a, 'utf8')), B = splitRegions(fs.readFileSync(b, 'utf8'));
  const changed = Object.keys({ ...A.regions, ...B.regions }).filter((k) => A.regions[k] !== B.regions[k]);
  const bad = changed.filter((k) => !allowed.includes(k));
  const outsideChanged = A.outside !== B.outside;
  console.log('有改動的區塊：' + (changed.join('、') || '（無）'));
  if (outsideChanged) console.log('區塊以外的內容也被改了');
  if (bad.length || outsideChanged) { console.log('不合格：改到不屬於自己的地方 ' + bad.join('、')); process.exit(1); }
  console.log('合格：只改了允許的區塊');
}
