#!/bin/bash
# ============================================================
# lib-env.sh — shared safe .env loader
#
# The 2026-06-29 P0 security fix replaced `source .env` with a strict
# KEY=VALUE parser (a .env line like `$(rm -rf ~)` executes under `source`).
# That parser lived only inside start-chrome-debug.sh, so connect-gemini.sh
# still `source`d .env and kept the exact RCE vector the fix closed.
# Extracted here so EVERY entry point uses the same parser.
#
# Usage (from any script in scripts/):
#   SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
#   PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
#   source "$SCRIPT_DIR/lib-env.sh"
#   load_project_env "$PROJECT_DIR"
# ============================================================

# Only parses strict KEY=VALUE lines.  Strips optional single/double quotes.
# Blocks: PATH, PYTHONPATH, LD_PRELOAD, LD_LIBRARY_PATH injection.
_safe_load_env() {
    local env_file="$1"
    if [ ! -f "$env_file" ]; then
        return 0
    fi
    while IFS='=' read -r key value; do
        # Skip blank lines and comments
        [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
        # Only allow safe variable names: uppercase letters, digits, underscore
        if [[ ! "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]]; then
            echo "[WARN] .env: skipping unsafe key '$key'" >&2
            continue
        fi
        # Block injection of dangerous path variables
        case "$key" in
            PATH|PYTHONPATH|LD_PRELOAD|LD_LIBRARY_PATH|PYTHONSTARTUP|BASH_ENV|PROMPT_COMMAND)
                echo "[WARN] .env: blocked dangerous key '$key'" >&2
                continue
                ;;
        esac
        # Strip surrounding quotes (single or double)
        value="${value#\"}"; value="${value%\"}"
        value="${value#\'}"; value="${value%\'}"
        export "$key=$value"
    done < "$env_file"
}

# Load ~/.env first, then the project .env (project overrides).
load_project_env() {
    local project_dir="$1"
    if [ -f "$HOME/.env" ]; then
        _safe_load_env "$HOME/.env"
    fi
    if [ -f "$project_dir/.env" ]; then
        _safe_load_env "$project_dir/.env"
    fi
}
