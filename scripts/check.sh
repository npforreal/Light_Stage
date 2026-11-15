#!/usr/bin/env bash
# Fast Quality Gate for Light_Stage
# Usage:
#   bash scripts/check.sh           # Full checks (type-check, tests, build, cargo check)
#   bash scripts/check.sh --fast    # Fast unit checks (type-check, tests, audit)

set -euo pipefail

FAST=false
for arg in "$@"; do
    case "$arg" in
        --fast) FAST=true ;;
        *) ;;
    esac
done

echo "==> [Light_Stage] Starting quality gate checks..."

# 1. TypeScript type checking
echo "--> [1/4] Running TypeScript type check..."
npm run type-check

# 2. Vitest unit tests
echo "--> [2/4] Running unit tests..."
npm run test

# 3. Rust / Cargo check (if src-tauri exists and cargo is installed)
if [ -d "src-tauri" ] && command -v cargo >/dev/null 2>&1; then
    echo "--> [3/4] Running cargo check on src-tauri..."
    (cd src-tauri && cargo check)
else
    echo "--> [3/4] Skipping cargo check (cargo not installed or src-tauri absent)"
fi

# 4. Production build (skipped in --fast mode)
if [ "$FAST" = false ]; then
    echo "--> [4/4] Verifying production build..."
    npm run build
else
    echo "--> [4/4] Fast mode: skipping production build bundle"
fi

# 5. Workflow and token discipline audit
echo "--> Running workflow health audit..."
python3 scripts/audit_workflow.py

# 6. Architectural drift guard check
echo "--> Running architectural drift guard check..."
python3 scripts/guard_check.py

echo "OK: All Light_Stage quality gate checks passed!"
