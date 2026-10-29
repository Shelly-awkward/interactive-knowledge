#!/usr/bin/env bash
# 驗收一個 Codex 任務的產出：只改了自己的區塊？測試過了沒？
# 用法（在 repo 根目錄）：bash dev/韌性航線2100/verify.sh T2
set -uo pipefail
ROOT=$(git rev-parse --show-toplevel)
WORK=${WORK:-/tmp/climate-game-work}
T=$1
GAME="lessons/會計準則/韌性航線2100_氣候情境分析策略遊戲.html"
TESTS="$ROOT/dev/韌性航線2100/tests"
case $T in
  T1) REGIONS="ENGINE STYLE-ENGINE";;
  T2) REGIONS="MAP STYLE-MAP";;
  T3) REGIONS="EVENTS STYLE-EVENTS";;
  T4) REGIONS="ENDING STYLE-ENDING";;
  *) echo "未知任務 $T"; exit 2;;
esac
OUT="$WORK/$T/$GAME"
fail=0
echo "== $T：區塊檢查"; node "$TESTS/regions.mjs" "$ROOT/$GAME" "$OUT" $REGIONS || fail=1
echo "== $T：規則核心"; node "$TESTS/core.test.mjs" "$OUT" > /dev/null || { echo "core.test 沒過"; fail=1; }
if [ "$T" = T1 ]; then echo "== T1：流程"; node "$TESTS/flow.test.mjs" "$OUT" || fail=1; fi
echo "== $T：瀏覽器驗收"; node "$TESTS/accept.mjs" "$OUT" --only=common,$T --shots="$WORK/$T-shots" | tail -n 30 || fail=1
[ $fail = 0 ] && echo "$T 驗收通過" || echo "$T 驗收不通過：把上面的 FAIL 貼回給 Codex 重做"
exit $fail
