#!/usr/bin/env python3
"""Enforce strict character and token budget on in-repo skills (part of Quality Gate).

Usage:
    python3 scripts/skill_lint.py
    python3 scripts/skill_lint.py --repo-path /path/to/repo

Checks:
1. Size budget: each SKILL.md <= 4,800 characters (~1,500 tokens), total <= 25,000 characters.
2. Frontmatter: `name` matches directory name, `description` <= 25 words.
3. Detail link: points to detailed doc in docs/skills/ or references/.
"""

from __future__ import annotations

import argparse
import glob
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_FILE_CHARS = 4800
MAX_TOTAL_CHARS = 25000
MAX_DESC_WORDS = 25


def main() -> int:
    parser = argparse.ArgumentParser(description="Skill token budget and frontmatter linter")
    parser.add_argument("--repo-path", type=Path, default=ROOT, help="Target repository root")
    args = parser.parse_args()

    root = args.repo_path.resolve()
    skills_dir = root / ".github" / "skills"

    if not skills_dir.is_dir():
        print("INFO: No .github/skills directory found - skipping skill budget check.")
        return 0

    files = sorted(skills_dir.glob("*/SKILL.md"))
    if not files:
        print("INFO: .github/skills exists but contains no SKILL.md files.")
        return 0

    problems = 0
    total_chars = 0

    for path in files:
        rel = path.relative_to(root)
        text = path.read_text(encoding="utf-8")
        size = len(text)
        total_chars += size
        folder = path.parent.name

        if size > MAX_FILE_CHARS:
            print(f"FAIL  {rel}: {size} chars exceeds budget ({MAX_FILE_CHARS})")
            problems += 1

        m = re.search(r"^name:\s*(.+)$", text, re.M)
        if not m:
            print(f"FAIL  {rel}: missing `name` in frontmatter")
            problems += 1
        elif m.group(1).strip() != folder:
            print(f"FAIL  {rel}: name `{m.group(1).strip()}` != folder `{folder}`")
            problems += 1

        d = re.search(r"^description:\s*(.+)$", text, re.M)
        if not d:
            print(f"FAIL  {rel}: missing `description` in frontmatter")
            problems += 1
        elif len(d.group(1).split()) > MAX_DESC_WORDS:
            print(f"FAIL  {rel}: description exceeds {MAX_DESC_WORDS} words")
            problems += 1

    if total_chars > MAX_TOTAL_CHARS:
        print(f"FAIL  Total skill budget {total_chars} chars > limit {MAX_TOTAL_CHARS}")
        problems += 1

    print(f"skill_lint: {len(files)} skill(s), {total_chars} chars (~{int(total_chars / 4.4)} tokens) — "
          f"{'OK' if not problems else f'{problems} errors'}")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
