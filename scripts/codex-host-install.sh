#!/usr/bin/env bash
# Puts this laptop's Codex login and a headless config on a host, under the `codex` user,
# and proves the model plus the Solari MCP work end to end. Tokens travel only over SSH and
# land as 600 files; nothing is echoed.
#
#   scripts/codex-host-install.sh <host> [ssh-key]     (needs SOLARI_API_KEY in the env)
set -euo pipefail
HOST="$1"; KEY="${2:-$HOME/.ssh/kleeto_azure_ed25519}"; : "${SOLARI_API_KEY:?set SOLARI_API_KEY}"
PAY=$(mktemp -d); chmod 700 "$PAY"; trap 'rm -rf "$PAY"' EXIT
cp "$HOME/.codex/auth.json" "$PAY/auth.json"
cat > "$PAY/config.toml" <<TOML
approval_policy = "never"
sandbox_mode = "danger-full-access"
model = "gpt-6-astra"
model_reasoning_effort = "medium"

[mcp_servers.solari]
command = "npx"
args = ["-y", "@solarisdk/mcp"]
startup_timeout_sec = 120

[mcp_servers.solari.env]
SOLARI_API_KEY = "$SOLARI_API_KEY"
TOML
chmod 600 "$PAY"/*
scp -q -i "$KEY" -o StrictHostKeyChecking=accept-new -r "$PAY" "kleeto@$HOST:/home/kleeto/codex-payload"
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "kleeto@$HOST" 'set -e
  sudo install -o codex -g codex -m 600 ~/codex-payload/auth.json /home/codex/.codex/auth.json
  sudo install -o codex -g codex -m 600 ~/codex-payload/config.toml /home/codex/.codex/config.toml
  rm -rf ~/codex-payload
  echo "login: $(sudo -iu codex codex login status 2>&1 | head -1)"
  echo "smoke: $(sudo -iu codex bash -c "cd ~ && timeout 300 codex exec --skip-git-repo-check -c model_reasoning_effort=low \"Call the solari MCP tool solari_list and reply with only the number of running sandboxes as a bare integer.\" 2>/dev/null | tail -1")"'
