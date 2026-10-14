#!/usr/bin/env python3
"""Genera Manual-PrometIO.pdf (HTML + capturas → Playwright)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRINT_SCRIPT = ROOT / "scripts" / "print-manual.mjs"


def main() -> None:
    try:
        subprocess.run(["node", str(PRINT_SCRIPT)], cwd=ROOT, check=True)
    except FileNotFoundError:
        print("Se requiere Node.js.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
