#!/usr/bin/env bash
# Fast Quality Gate for Light_Stage
# Usage:
#   bash scripts/check.sh           # Full checks
#   bash scripts/check.sh --fast    # Fast unit checks

set -euo pipefail

FAST=false
for arg in "$@"; do
    case "$arg" in
        --fast) FAST=true ;;
        *) ;;
    esac
done

echo "==> [Light_Stage] Quality gate checks..."
# Verify workflow health
python3 scripts/audit_workflow.py

echo "OK: All checks passed."
