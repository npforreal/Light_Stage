#!/usr/bin/env python3
"""Lossless log archiver for PLAN.md, PROGRESS.md, and REVIEW.md.

Moves completed/older sections to archive/ directory so agents don't have to read large historical logs.
Preserves all history without deleting or rewriting content.

Usage:
    python scripts/archive_logs.py             # keep 3 newest PROGRESS entries, 2 REVIEW entries
    python scripts/archive_logs.py --dry-run   # show what would be moved without changing files
    python scripts/archive_logs.py --keep-progress 5
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def find_repo_root(start_dir: Path | None = None) -> Path:
    """Find the root of the repository by walking up looking for .git or PLAN.md."""
    current = (start_dir or Path.cwd()).resolve()
    for parent in [current, *current.parents]:
        if (parent / ".git").exists() or (parent / "PLAN.md").exists():
            return parent
    return current


def split_sections(text: str) -> tuple[str, list[str]]:
    """Split text into preamble and sections starting with '## '."""
    lines = text.splitlines(keepends=True)
    starts = [i for i, line in enumerate(lines) if line.startswith("## ")]
    if not starts:
        return text, []
    preamble = "".join(lines[: starts[0]])
    ends = [*starts[1:], len(lines)]
    sections = ["".join(lines[a:b]) for a, b in zip(starts, ends, strict=True)]
    return preamble, sections


def section_title(section: str) -> str:
    """Extract the title of a section."""
    lines = section.splitlines()
    if not lines:
        return ""
    return lines[0].removeprefix("## ").removeprefix("### ").strip()


def ensure_pointer(preamble: str, archive_name: str, lang: str = "vi") -> str:
    """Add a pointer note in the preamble if not already present."""
    if lang == "en":
        note = f"> Older history is stored in `archive/{archive_name}` (lookup only).\n"
    else:
        note = f"> Lịch sử cũ nằm trong `archive/{archive_name}` (chỉ đọc khi cần tra cứu).\n"

    if f"`archive/{archive_name}`" in preamble:
        return preamble
    return preamble.rstrip("\n") + "\n\n" + note + "\n"


def write_archive_file(archive_dir: Path, name: str, moved: list[str], newest_first: bool, lang: str = "vi") -> None:
    """Append or prepend moved sections to the archive file."""
    archive_dir.mkdir(parents=True, exist_ok=True)
    path = archive_dir / name
    if lang == "en":
        header = f"# Archived {name} (verbatim, unedited)\n\n"
    else:
        header = f"# Lưu trữ {name} (nguyên văn, không chỉnh sửa)\n\n"

    existing = path.read_text(encoding="utf-8") if path.exists() else ""
    body = existing.removeprefix(header)
    new_content = "".join(moved)

    if newest_first:
        content = header + new_content + body
    else:
        content = header + body + new_content

    path.write_text(content, encoding="utf-8")


def archive_progress(root: Path, archive_dir: Path, keep: int, dry_run: bool, lang: str) -> list[str]:
    """Archive older entries from PROGRESS.md (newest at top convention)."""
    path = root / "PROGRESS.md"
    if not path.exists():
        return []

    preamble, sections = split_sections(path.read_text(encoding="utf-8"))
    kept, moved = sections[:keep], sections[keep:]
    if moved and not dry_run:
        write_archive_file(archive_dir, "PROGRESS.md", moved, newest_first=True, lang=lang)
        path.write_text(ensure_pointer(preamble, "PROGRESS.md", lang) + "".join(kept), encoding="utf-8")
    return [section_title(s) for s in moved]


def archive_review(root: Path, archive_dir: Path, keep: int, dry_run: bool, lang: str) -> list[str]:
    """Archive older entries from REVIEW.md (oldest at top convention)."""
    path = root / "REVIEW.md"
    if not path.exists():
        return []

    preamble, sections = split_sections(path.read_text(encoding="utf-8"))
    cut = max(len(sections) - keep, 0)
    moved, kept = sections[:cut], sections[cut:]
    if moved and not dry_run:
        write_archive_file(archive_dir, "REVIEW.md", moved, newest_first=False, lang=lang)
        path.write_text(ensure_pointer(preamble, "REVIEW.md", lang) + "".join(kept), encoding="utf-8")
    return [section_title(s) for s in moved]


def is_fully_done(section: str) -> bool:
    """Check if section has completed tasks and no pending task checkboxes."""
    has_done = "- [x]" in section
    has_pending = "- [ ]" in section
    return has_done and not has_pending


def split_subsections(section: str) -> tuple[str, list[str]]:
    """Split a section into its head and '### ' subsections."""
    lines = section.splitlines(keepends=True)
    starts = [i for i, line in enumerate(lines) if line.startswith("### ")]
    if not starts:
        return section, []
    ends = [*starts[1:], len(lines)]
    head = "".join(lines[: starts[0]])
    return head, ["".join(lines[a:b]) for a, b in zip(starts, ends, strict=True)]


def archive_done_phases_in_last_round(last_round: str) -> tuple[str, list[str]]:
    """Archive completed '### Phase/Giai đoạn' in the active round."""
    head, subs = split_subsections(last_round)
    moved = [
        s for s in subs
        if (s.startswith("### Giai đoạn") or s.startswith("### Phase") or s.startswith("### Milestone"))
        and is_fully_done(s)
    ]
    if not moved:
        return last_round, []

    kept = [s for s in subs if s not in moved]
    moved_names = [section_title(s).split(" — ")[0].split(" - ")[0] for s in moved]

    # Prepend a notice of completed phases
    done_notice = "> Đã xong và lưu trữ (xem `archive/PLAN.md`): " + ", ".join(moved_names) + "\n\n"
    lines = head.splitlines(keepends=True)
    new_head_lines: list[str] = []
    prefix_found = False
    for line in lines:
        if line.startswith("> Đã xong và lưu trữ") or line.startswith("> Completed and archived"):
            new_head_lines.append(done_notice)
            prefix_found = True
        else:
            new_head_lines.append(line)
    if not prefix_found:
        if len(lines) >= 1:
            new_head_lines = [lines[0], "\n", done_notice, *lines[1:]]
        else:
            new_head_lines = [done_notice]

    return "".join(new_head_lines) + "".join(kept), moved


def archive_plan(root: Path, archive_dir: Path, dry_run: bool, lang: str) -> list[str]:
    """Archive fully completed rounds and phases in PLAN.md."""
    path = root / "PLAN.md"
    if not path.exists():
        return []

    preamble, sections = split_sections(path.read_text(encoding="utf-8"))
    if not sections:
        return []

    # Completed historical sections before the last active one
    candidate_sections = sections[:-1]
    last_section = sections[-1]

    fully_done_sections = [s for s in candidate_sections if is_fully_done(s)]
    kept_sections = [s for s in candidate_sections if s not in fully_done_sections]

    # Check subsections inside the last section
    updated_last, moved_phases = archive_done_phases_in_last_round(last_section)
    kept_sections.append(updated_last)

    all_moved = fully_done_sections + moved_phases
    if all_moved and not dry_run:
        write_archive_file(archive_dir, "PLAN.md", all_moved, newest_first=False, lang=lang)
        path.write_text(ensure_pointer(preamble, "PLAN.md", lang) + "".join(kept_sections), encoding="utf-8")

    return [section_title(s) for s in all_moved]


def detect_language(root: Path) -> str:
    """Detect if the project uses English or Vietnamese primarily."""
    plan_path = root / "PLAN.md"
    if plan_path.exists():
        text = plan_path.read_text(encoding="utf-8", errors="ignore")
        if "Giai đoạn" in text or "Lịch sử" in text:
            return "vi"
    return "en"


def main() -> int:
    parser = argparse.ArgumentParser(description="Lossless log archiver for project agent logs")
    parser.add_argument("--repo-path", type=Path, default=None, help="Root path of the repository")
    parser.add_argument("--keep-progress", type=int, default=3, help="Number of newest PROGRESS entries to keep")
    parser.add_argument("--keep-review", type=int, default=2, help="Number of newest REVIEW entries to keep")
    parser.add_argument("--dry-run", action="store_true", help="Report what would be archived without modifying files")
    parser.add_argument("--lang", choices=["vi", "en"], default=None, help="Language for headers and pointer notes")
    args = parser.parse_args()

    root = find_repo_root(args.repo_path)
    archive_dir = root / "archive"
    lang = args.lang or detect_language(root)

    print(f"Archiving logs in repo: {root}")
    if args.dry_run:
        print("[DRY RUN MODE - No files will be changed]")

    moved_progress = archive_progress(root, archive_dir, args.keep_progress, args.dry_run, lang)
    moved_review = archive_review(root, archive_dir, args.keep_review, args.dry_run, lang)
    moved_plan = archive_plan(root, archive_dir, args.dry_run, lang)

    print(f"- PROGRESS.md: archived {len(moved_progress)} entries ({', '.join(moved_progress) or 'none'})")
    print(f"- REVIEW.md:   archived {len(moved_review)} entries ({', '.join(moved_review) or 'none'})")
    print(f"- PLAN.md:     archived {len(moved_plan)} items ({', '.join(moved_plan) or 'none'})")

    return 0


if __name__ == "__main__":
    sys.exit(main())
