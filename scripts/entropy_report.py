#!/usr/bin/env python3
"""Monthly entropy report: detect dead weight, unreferenced tools, and duplicate code blocks.

Usage:
    python3 scripts/entropy_report.py            # top 10 of each section
    python3 scripts/entropy_report.py --top 25
    python3 scripts/entropy_report.py --repo-path /path/to/repo

Sections:
1. Scripts/tools never referenced anywhere else in repository docs, configs, or scripts.
2. Tracked tool/module files missing from ARCHITECTURE.md.
3. Duplicated code blocks (8+ lines) across project source files (excluding third-party vendors).
"""

from __future__ import annotations

import argparse
import collections
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WINDOW_SIZE = 8
SOURCE_EXTENSIONS = (
    ".py", ".js", ".ts", ".jsx", ".tsx", ".php", ".go", ".rs", ".rb", ".css", ".html"
)
DOC_EXTENSIONS = (
    ".md", ".sh", ".py", ".php", ".js", ".ts", ".json", ".yml", ".yaml", ".tsv"
)
VENDOR_DIRS = (
    "node_modules", "vendor", "dist", "build", ".venv", "venv", "__pycache__", ".git",
    "wp-admin", "wp-includes"
)


def get_tracked_files(root: Path) -> list[str]:
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
        files = []
        for p in root.rglob("*"):
            if p.is_file() and not any(v in p.parts for v in VENDOR_DIRS):
                files.append(str(p.relative_to(root)))
        return files


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def main() -> int:
    parser = argparse.ArgumentParser(description="Repository entropy and dead code auditor")
    parser.add_argument("--top", type=int, default=10, help="Maximum items to display per section")
    parser.add_argument("--repo-path", type=Path, default=ROOT, help="Target repository root")
    args = parser.parse_args()

    root = args.repo_path.resolve()
    files = get_tracked_files(root)

    # Build searchable corpus
    corpus: dict[str, str] = {}
    for rel in files:
        if any(rel.endswith(ext) for ext in DOC_EXTENSIONS) and not any(v in rel for v in VENDOR_DIRS):
            corpus[rel] = read_text(root / rel)

    arch_text = corpus.get("ARCHITECTURE.md", "")

    # Section 1: Unreferenced tools
    unref = []
    for rel in files:
        if (rel.startswith("scripts/") or rel.startswith("tools/")) and not rel.endswith(".txt"):
            name = Path(rel).name
            if not any(name in text for path_key, text in corpus.items() if path_key != rel):
                unref.append(rel)

    print(f"[1] Unreferenced scripts/tools ({len(unref)} found):")
    for p in unref[:args.top]:
        print(f"    - {p}")
    if not unref:
        print("    (None - all tools are referenced)")

    # Section 2: Tools missing from ARCHITECTURE.md
    unreg = []
    if arch_text:
        for rel in files:
            if (rel.startswith("scripts/") or rel.startswith("tools/")) and not rel.endswith(".txt"):
                name = Path(rel).name
                if name not in arch_text:
                    unreg.append(rel)
    print(f"\n[2] Tools missing from ARCHITECTURE.md ({len(unreg)} found):")
    for p in unreg[:args.top]:
        print(f"    - {p}")
    if not unreg:
        print("    (None - all tools registered in ARCHITECTURE.md)")

    # Section 3: Duplicate code blocks
    seen: dict[str, set[str]] = collections.defaultdict(set)
    for rel in files:
        if any(rel.endswith(ext) for ext in SOURCE_EXTENSIONS) and not any(v in rel for v in VENDOR_DIRS):
            raw = read_text(root / rel)
            lines = [re.sub(r"\s+", " ", l.strip()) for l in raw.splitlines()]
            # Filter trivial lines
            lines = [l for l in lines if len(l) > 3 and not l.startswith(("//", "*", "/*", "#", "}", "{", "import ", "from "))]
            for i in range(len(lines) - WINDOW_SIZE + 1):
                window = "\n".join(lines[i : i + WINDOW_SIZE])
                seen[window].add(f"{rel}:{i+1}")

    duplicates = {block: locs for block, locs in seen.items() if len(locs) > 1}
    print(f"\n[3] Duplicated {WINDOW_SIZE}-line code blocks ({len(duplicates)} block patterns found):")
    for block, locs in sorted(duplicates.items(), key=lambda kv: len(kv[1]), reverse=True)[:args.top]:
        print(f"    - Found across {len(locs)} locations: {', '.join(sorted(locs)[:4])}")
        sample_line = block.splitlines()[0]
        print(f"      Sample line: {sample_line[:60]}...")
    if not duplicates:
        print(f"    (None - no duplicated {WINDOW_SIZE}-line blocks detected)")

    print(f"\nAudit complete. Target: {root}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
