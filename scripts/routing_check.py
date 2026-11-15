#!/usr/bin/env python3
"""Check integrity of in-repo skill routing table (part of Quality Gate & check.sh).

Usage:
    python3 scripts/routing_check.py
    python3 scripts/routing_check.py --repo-path /path/to/repo

Verifies:
1. Every skill mentioned in AGENTS.md §4 routing table exists on disk at .github/skills/<id>/SKILL.md (and vice versa).
2. If docs/skills/routing-cases.tsv exists:
   - Every skill referenced in test cases exists.
   - Max 2 skills per test case.
   - Each skill has >= 2 test cases; at least 4 '-' cases (no skill loaded, ensuring small tasks don't load skills).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(description="In-repo skill routing table auditor")
    parser.add_argument("--repo-path", type=Path, default=ROOT, help="Target repository root")
    args = parser.parse_args()

    root = args.repo_path.resolve()
    skills_dir = root / ".github" / "skills"
    agents_file = root / "AGENTS.md"
    cases_file = root / "docs" / "skills" / "routing-cases.tsv"

    if not skills_dir.is_dir():
        print(f"INFO: No .github/skills directory found at {skills_dir} - skipping skill routing check.")
        return 0

    on_disk = {
        d.name for d in skills_dir.iterdir()
        if d.is_dir() and (d / "SKILL.md").is_file()
    }
    if not on_disk:
        print("INFO: .github/skills exists but contains no skills with SKILL.md.")
        return 0

    errors: list[str] = []

    if agents_file.exists():
        text = agents_file.read_text(encoding="utf-8")
        section = ""
        for marker in ("## 4.", "## Skill routing", "## Định tuyến skill"):
            if marker in text:
                section = text.split(marker, 1)[1].split("\n## ", 1)[0]
                break

        in_table = set(re.findall(r"^\|.*\|\s*`([a-z0-9-]+)`\s*\|\s*$", section, re.M))
        for s in sorted(in_table - on_disk):
            errors.append(f"AGENTS.md references skill `{s}` but .github/skills/{s}/SKILL.md is missing")
        for s in sorted(on_disk - in_table):
            errors.append(f"Skill `{s}` exists on disk but is not in AGENTS.md routing table")

    if cases_file.exists():
        counts = {s: 0 for s in on_disk}
        none_cases = 0
        total = 0
        for n, line in enumerate(cases_file.read_text(encoding="utf-8").splitlines(), 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) != 2:
                errors.append(f"routing-cases.tsv:{n}: must have exactly 2 tab-separated columns")
                continue
            total += 1
            if parts[1] == "-":
                none_cases += 1
                continue
            ids = parts[1].split("+")
            if len(ids) > 2:
                errors.append(f"routing-cases.tsv:{n}: exceeds max 2 skills ({parts[1]})")
            for i in ids:
                if i not in on_disk:
                    errors.append(f"routing-cases.tsv:{n}: unknown skill `{i}`")
                else:
                    counts[i] += 1

        for s, c in sorted(counts.items()):
            if c < 2:
                errors.append(f"Skill `{s}` has only {c} routing test cases (requires >= 2)")
        if none_cases < 4:
            errors.append(f"Only {none_cases} negative '-' test cases (requires >= 4 to guard small tasks)")

    for e in errors:
        print(f"FAIL  {e}")

    if errors:
        print(f"routing_check FAILED: {len(errors)} error(s)")
        return 1

    print(f"routing_check OK: {len(on_disk)} skills verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
