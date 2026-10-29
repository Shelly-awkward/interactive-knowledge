// 把某個任務產出的區塊貼回正本。執行：node merge.mjs <正本> <任務產出> <區塊...>
import fs from 'node:fs';
import { splitRegions } from './regions.mjs';
const [main, src, ...names] = process.argv.slice(2);
let text = fs.readFileSync(main, 'utf8');
const S = splitRegions(fs.readFileSync(src, 'utf8'));
for (const n of names) {
  const cur = splitRegions(text).regions[n];
  if (!cur || !S.regions[n]) { console.error('找不到區塊 ' + n); process.exit(1); }
  text = text.replace(cur, () => S.regions[n]);
  console.log('已合併 ' + n);
}
fs.writeFileSync(main, text);
