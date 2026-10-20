#!/usr/bin/env python
"""英語聽讀／跟讀系列：產生 audio/ 裡的預錄語音（edge-tts）

教材網頁的 say(text) 會把句子算 FNV-1a 32 位元雜湊，去 audio/<hash>.mp3 找錄音；
找不到就退回裝置內建語音。這支腳本直接從四個教材 HTML 的 `const DATA = {...};`
抽出所有會被唸的字串，算同一種雜湊，缺哪個檔就補哪個。

會唸的字串（與網頁 say() 的呼叫點一致）：
  - 故事句       DATA.episodes[].paras[][][0]
  - 單字         DATA.vocab[].w
  - 單字例句     DATA.vocab[].ex
  - 句型例句     DATA.patterns[].ex[].en   （只有跟讀篇有）

用法（在 lessons/英語聽讀/ 下）：
  python gen_audio.py              # 只補缺的檔
  python gen_audio.py --dry-run    # 只列出缺哪些，不合成
  python gen_audio.py --force      # 全部重新合成
  python gen_audio.py --prune      # 刪掉 audio/ 裡沒有任何句子對應的孤兒檔

語音參數要和既有錄音一致：en-US-AvaNeural、語速 -10%。
"""
import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = Path(__file__).resolve().parent
AUDIO_DIR = HERE / "audio"
VOICE = "en-US-AvaNeural"
RATE = "-10%"
CONCURRENCY = 4


def fnv1a(text: str) -> str:
    """與網頁 fnv1a() 相同：UTF-8 bytes、32 位元 FNV-1a、8 碼小寫十六進位。"""
    h = 0x811C9DC5
    for b in text.encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f"{h:08x}"


def load_data(html: Path) -> dict:
    m = re.search(r"^const DATA = (\{.*\});\s*$", html.read_text(encoding="utf-8"), re.M)
    if not m:
        raise ValueError(f"{html.name}: 找不到 const DATA")
    return json.loads(m.group(1))


def spoken_texts(data: dict) -> list[str]:
    out = []
    for ep in data.get("episodes", []):
        for para in ep.get("paras", []):
            for sent in para:
                out.append(sent[0])
    for v in data.get("vocab", []):
        out.append(v["w"])
        if v.get("ex"):
            out.append(v["ex"])
    for p in data.get("patterns", []):
        for ex in p.get("ex", []):
            out.append(ex["en"])
    return out


def collect() -> dict[str, str]:
    """回傳 {hash: text}，四篇共用一份 audio/，同句只留一筆。"""
    table: dict[str, str] = {}
    pages = sorted(HERE.glob("*.html"))
    if not pages:
        sys.exit("這個資料夾裡沒有教材 HTML")
    for page in pages:
        texts = spoken_texts(load_data(page))
        for t in texts:
            table[fnv1a(t)] = t
        print(f"  {page.name}: {len(texts)} 句")
    return table


async def synth_one(sem: asyncio.Semaphore, text: str, dest: Path) -> bool:
    import edge_tts

    async with sem:
        tmp = dest.with_suffix(".part")
        try:
            await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(tmp))
            if tmp.stat().st_size < 500:
                raise RuntimeError("輸出檔太小，可能合成失敗")
            tmp.replace(dest)
            print(f"  ✓ {dest.name}  {text[:60]}")
            return True
        except Exception as e:  # noqa: BLE001
            tmp.unlink(missing_ok=True)
            print(f"  ✗ {dest.name}  {text[:60]}  ({e})")
            return False


async def synth_all(jobs: list[tuple[str, Path]]) -> int:
    sem = asyncio.Semaphore(CONCURRENCY)
    results = await asyncio.gather(*(synth_one(sem, t, p) for t, p in jobs))
    return sum(1 for r in results if not r)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="只列出缺的，不合成")
    ap.add_argument("--force", action="store_true", help="全部重新合成")
    ap.add_argument("--prune", action="store_true", help="刪除沒有句子對應的孤兒 mp3")
    args = ap.parse_args()

    print("抽取教材句子：")
    table = collect()
    AUDIO_DIR.mkdir(exist_ok=True)
    existing = {p.stem for p in AUDIO_DIR.glob("*.mp3")}

    missing = sorted(h for h in table if args.force or h not in existing)
    orphans = sorted(existing - set(table))
    print(f"\n句子總數 {len(table)}（去重後）、已有錄音 {len(existing)}、要合成 {len(missing)}、孤兒檔 {len(orphans)}")

    if orphans:
        for h in orphans[:20]:
            print(f"  孤兒：{h}.mp3")
        if args.prune:
            for h in orphans:
                (AUDIO_DIR / f"{h}.mp3").unlink()
            print(f"  已刪除 {len(orphans)} 個孤兒檔")

    if not missing:
        print("沒有要合成的句子。")
        return
    if args.dry_run:
        for h in missing:
            print(f"  缺：{h}.mp3  {table[h][:70]}")
        return

    print(f"\n用 {VOICE}（rate {RATE}）合成 {len(missing)} 句：")
    jobs = [(table[h], AUDIO_DIR / f"{h}.mp3") for h in missing]
    failed = asyncio.run(synth_all(jobs))
    print(f"\n完成，失敗 {failed} 句。" + ("  重跑一次即可補失敗的。" if failed else ""))
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
