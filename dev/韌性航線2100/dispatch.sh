#!/usr/bin/env bash
# 派工給 Codex：每個任務在獨立的 git worktree 裡做，互不干擾；做完由總指揮用 verify.sh 驗收、merge.mjs 合併。
# 用法（在 repo 根目錄）：bash dev/韌性航線2100/dispatch.sh T1 T2 T3 T4
# 環境變數：CODEX_MODEL（選填）、WORK（工作資料夾，預設 /tmp/climate-game-work）
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
WORK=${WORK:-/tmp/climate-game-work}
export OPENAI_API_KEY=${OPENAI_API_KEY:-sk-proxy-injected}   # 雲端環境由代理換成真的金鑰
mkdir -p "$WORK"
for T in "$@"; do
  DIR="$WORK/$T"
  git -C "$ROOT" worktree remove --force "$DIR" 2>/dev/null || rm -rf "$DIR"
  git -C "$ROOT" worktree add --detach "$DIR" HEAD >/dev/null
  PROMPT="$(cat "$ROOT/dev/韌性航線2100/tasks/$T.md" "$ROOT/dev/韌性航線2100/tasks/_common.md")"
  echo "派工 $T → $DIR"
  codex exec --skip-git-repo-check -C "$DIR" --sandbox workspace-write ${CODEX_MODEL:+-m "$CODEX_MODEL"} \
    -o "$WORK/$T.last.md" "$PROMPT" > "$WORK/$T.log" 2>&1 &
done
wait
echo "全部回來了。用 verify.sh 逐一驗收。"
