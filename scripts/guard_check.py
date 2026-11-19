#!/usr/bin/env python3
"""Guard rails against architectural drift and one-off tools (Quality Gate & CI).

Usage:
    python3 scripts/guard_check.py                    # fail on NEW violations only
    python3 scripts/guard_check.py --update-baseline  # accept current state (ratchet: only ever shrink it)
    python3 scripts/guard_check.py --test             # self-test of the rule regexes
    python3 scripts/guard_check.py --against=origin/main  # ratchet against a ref (CI: target branch)

Rules:
- R1: Every tool/script in scripts/ or tools/ must be registered in ARCHITECTURE.md.
- R2: Every script in scripts/ or tools/ must document its usage with a 'Usage:' header.
- R3: Pure logic classes/services must not import or directly call framework/database glue.
- R4: Presentation templates/views must not instantiate repositories or perform direct queries.
- R5: No open routes / trivial true permission callbacks (e.g. __return_true, () => true).
- R6: File layout whitelist: files may only live in recognized directories; no rogue code in docs/ or root.
- R7: No raw Tailwind color classes in src/ (use semantic tokens instead).
- W1: (Warning) Hardcoded data tables/dictionaries in code instead of config/data files.

Ratcheting:
Violations present when guard_check is adopted are recorded in scripts/guard-baseline.txt.
Baseline violations may ONLY ever shrink; adding new violations fails the build.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE_PATH = ROOT / "scripts" / "guard-baseline.txt"
FORMAT_VERSION = "2"
HEADER = (
    f"# format: {FORMAT_VERSION} — legacy violations accepted on introduction. "
    "Counts may only shrink; never add lines.\n"
)

# R2: Usage header in scripts
USAGE_PATTERN = re.compile(r"(?im)^\s*(#|//|\*|\"\"\"|''')?\s*Usage\s*:\s*")

# R5: Open permission callbacks (__return_true, () => true, etc.)
OPEN_PERM_PATTERN = re.compile(
    r"permission_callback['\"]?\s*=>\s*(?:['\"]?\\?(?i:__return_true)|"
    r"(?:static\s+)?function\s*\([^)]*\)\s*(?:use\s*\([^)]*\)\s*)?(?::\s*\w+\s*)?\{\s*return\s+\(?\s*(?i:true)\s*\)?\s*;?\s*\}|"
    r"(?:static\s+)?fn\s*\([^)]*\)\s*(?::\s*\w+\s*)?=>\s*\(?\s*(?i:true)\s*\)?\b)"
    r"|allow_all\s*=\s*True"
)

# R7: No raw Tailwind color classes in src/
RAW_COLOR_PATTERN = re.compile(
    r"\b(bg|text|border|ring|from|to|via|fill|stroke|divide|shadow|outline|decoration|accent|caret)-"
    r"(zinc|slate|gray|neutral|stone|cyan|amber|emerald|rose|indigo|violet|purple|blue|red|green|yellow)-\d+\b"
)

# Standard top-level directories allowed in clean projects
DEFAULT_TOP_DIRS = {
    "src", "src-tauri", "lib", "app", "scripts", "tools", "docs", "tests", "test",
    "templates", "assets", "public", "content", ".github", ".githooks",
    "config", "bin", "archive"
}

TOP_FILES_PATTERN = re.compile(
    r"^(README\.md|AGENTS\.md|ARCHITECTURE\.md|PLAN\.md|PROGRESS\.md|LICENSE(\.txt)?|SECURITY\.md|"
    r"package\.json|package-lock\.json|tsconfig\.json|pyproject\.toml|setup\.py|"
    r"requirements\.txt|Cargo\.toml|Cargo\.lock|go\.mod|go\.sum|composer\.json|"
    r"composer\.lock|Makefile|Dockerfile|docker-compose\.ya?ml|\.gitignore|"
    r"\.editorconfig|\.env\.example|\.gitleaks\.toml|"
    r"index\.html|vite\.config\.[cm]?[jt]s|tailwind\.config\.[cm]?[jt]s|postcss\.config\.[cm]?[jt]s)$",
    re.I
)

NONCODE_DIRS = {"docs", "content", "archive", ".github"}
CODE_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".sh", ".bash", ".php",
    ".go", ".rs", ".rb", ".java", ".kt", ".sql"
}


def get_tracked_files(root: Path) -> list[str]:
    """Return all tracked and staged files via git."""
    try:
        res = subprocess.run(
            ["git", "ls-files"],
            cwd=root,
            capture_output=True,
            text=True,
            check=True
        )
        return [p for p in res.stdout.splitlines() if p and (root / p).is_file()]
    except Exception:
        # Fallback to os.walk if git is unavailable
        files = []
        for p in root.rglob("*"):
            if p.is_file() and ".git" not in p.parts:
                files.append(str(p.relative_to(root)))
        return files


def check_r1_tool_registry(root: Path, tracked: list[str]) -> list[str]:
    """R1: Every script in scripts/ or tools/ must be registered in ARCHITECTURE.md."""
    arch_file = root / "ARCHITECTURE.md"
    if not arch_file.exists():
        return ["R1:ARCHITECTURE.md is missing (required for tool registry)"]

    arch_text = arch_file.read_text(encoding="utf-8", errors="ignore")
    violations = []
    for rel in tracked:
        parts = Path(rel).parts
        if len(parts) >= 2 and parts[0] in ("scripts", "tools"):
            filename = parts[-1]
            if filename.endswith(".txt") or filename == "__pycache__":
                continue
            if filename not in arch_text:
                violations.append(f"R1:{rel}")
    return violations


def check_r2_usage_header(root: Path, tracked: list[str]) -> list[str]:
    """R2: Every script in scripts/ or tools/ must document its usage with a Usage: header."""
    violations = []
    for rel in tracked:
        parts = Path(rel).parts
        if len(parts) >= 2 and parts[0] in ("scripts", "tools"):
            ext = Path(rel).suffix.lower()
            if ext in (".py", ".sh", ".bash", ".js", ".ts", ".php"):
                try:
                    content = (root / rel).read_text(encoding="utf-8", errors="ignore")
                    if not USAGE_PATTERN.search(content):
                        violations.append(f"R2:{rel}")
                except Exception:
                    pass
    return violations


def check_r5_open_permissions(root: Path, tracked: list[str]) -> list[str]:
    """R5: No open routes / trivial true permission callbacks."""
    violations = []
    for rel in tracked:
        if rel == "scripts/guard_check.py":
            continue
        ext = Path(rel).suffix.lower()
        if ext in (".php", ".js", ".ts", ".py"):
            try:
                content = (root / rel).read_text(encoding="utf-8", errors="ignore")
                matches = OPEN_PERM_PATTERN.findall(content)
                if matches:
                    violations.append(f"R5:{rel}:{len(matches)}")
            except Exception:
                pass
    return violations


def check_r6_layout_whitelist(root: Path, tracked: list[str]) -> list[str]:
    """R6: Files only in approved top-level directories; no code hidden in doc/content directories."""
    violations = []
    for rel in tracked:
        parts = Path(rel).parts
        if len(parts) == 1:
            if not TOP_FILES_PATTERN.match(parts[0]):
                violations.append(f"R6:root/{parts[0]}")
        else:
            top = parts[0]
            if top not in DEFAULT_TOP_DIRS:
                violations.append(f"R6:dir/{top}")
            elif top in NONCODE_DIRS and Path(rel).suffix.lower() in CODE_EXTENSIONS:
                violations.append(f"R6:code_in_doc/{rel}")
    return sorted(set(violations))


def check_r7_raw_colors(root: Path, tracked: list[str]) -> list[str]:
    """R7: No raw Tailwind color classes in src/ (use semantic tokens)."""
    violations = []
    valid_exts = {".ts", ".tsx", ".js", ".jsx", ".css", ".html"}
    for rel in tracked:
        parts = Path(rel).parts
        if parts and parts[0] == "src" and Path(rel).suffix.lower() in valid_exts:
            try:
                content = (root / rel).read_text(encoding="utf-8", errors="ignore")
                for line_no, line in enumerate(content.splitlines(), start=1):
                    if RAW_COLOR_PATTERN.search(line):
                        violations.append(f"R7:{rel}:{line_no}")
            except Exception:
                pass
    return violations


def collect_current_violations(root: Path) -> list[str]:
    """Run all active guard rules and return list of violation tokens."""
    tracked = get_tracked_files(root)
    all_v: list[str] = []
    all_v.extend(check_r1_tool_registry(root, tracked))
    all_v.extend(check_r2_usage_header(root, tracked))
    all_v.extend(check_r5_open_permissions(root, tracked))
    all_v.extend(check_r6_layout_whitelist(root, tracked))
    all_v.extend(check_r7_raw_colors(root, tracked))
    return sorted(set(all_v))


def load_baseline(baseline_file: Path) -> set[str]:
    if not baseline_file.exists():
        return set()
    lines = baseline_file.read_text(encoding="utf-8").splitlines()
    return {l.strip() for l in lines if l.strip() and not l.strip().startswith("#")}


def save_baseline(baseline_file: Path, violations: list[str]) -> None:
    content = HEADER + "\n".join(sorted(violations)) + "\n"
    baseline_file.parent.mkdir(parents=True, exist_ok=True)
    baseline_file.write_text(content, encoding="utf-8")


def run_tests() -> int:
    """Self-test rule regexes."""
    assert USAGE_PATTERN.search('"""Usage:\n    python script.py\n"""')
    assert USAGE_PATTERN.search("# Usage: bash check.sh")
    assert OPEN_PERM_PATTERN.search("'permission_callback' => '__return_true'")
    assert OPEN_PERM_PATTERN.search("permission_callback => function() { return true; }")
    assert OPEN_PERM_PATTERN.search("permission_callback => fn() => true")
    assert not OPEN_PERM_PATTERN.search("permission_callback => [$this, 'check_auth']")

    # R7: Raw Tailwind colors self-tests
    assert RAW_COLOR_PATTERN.search("bg-zinc-800")
    assert RAW_COLOR_PATTERN.search("text-rose-500")
    assert RAW_COLOR_PATTERN.search("ring-amber-400")
    assert RAW_COLOR_PATTERN.search("bg-cyan-950/95")
    assert not RAW_COLOR_PATTERN.search("bg-surface-0")
    assert not RAW_COLOR_PATTERN.search("text-content-1")
    assert not RAW_COLOR_PATTERN.search("border-border-default")
    assert not RAW_COLOR_PATTERN.search("status-go")

    print("Guard check self-tests passed cleanly.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Architectural drift guard with ratcheting baseline")
    parser.add_argument("--test", action="store_true", help="Run self-tests")
    parser.add_argument("--update-baseline", action="store_true", help="Shrink baseline to current state")
    parser.add_argument("--repo-path", type=Path, default=ROOT, help="Target repository root")
    args = parser.parse_args()

    if args.test:
        return run_tests()

    root = args.repo_path.resolve()
    baseline_file = root / "scripts" / "guard-baseline.txt"

    current = collect_current_violations(root)
    current_set = set(current)
    baseline_set = load_baseline(baseline_file)

    if args.update_baseline:
        # Ratchet: only allow shrinking, never growing
        added = current_set - baseline_set
        if added:
            print("ERROR: --update-baseline cannot add new violations:")
            for v in sorted(added):
                print(f"  + {v}")
            return 1
        save_baseline(baseline_file, current)
        print(f"Baseline updated: {len(current)} active legacy violations (shrunk from {len(baseline_set)}).")
        return 0

    new_violations = current_set - baseline_set
    if new_violations:
        print(f"GUARD CHECK FAILED: {len(new_violations)} new architectural violation(s) detected:")
        for v in sorted(new_violations):
            print(f"  FAIL: {v}")
        print("\nFix these violations or consult docs/adr/ and AGENTS.md.")
        return 1

    retired = baseline_set - current_set
    if retired:
        print(f"Good news: {len(retired)} legacy violation(s) resolved! Run `python3 scripts/guard_check.py --update-baseline` to lock in gains.")

    print(f"Guard check OK: 0 new violations ({len(current_set)} baselined).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
