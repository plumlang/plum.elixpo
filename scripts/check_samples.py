"""Check the code samples the landing page shows against a real plum.

    python3 scripts/check_samples.py path/to/plum      (npm run samples:check -- path/to/plum)

Every content/samples/NAME.plum must pass `plum check`, unless NAME.err
exists: then `plum check` must fail and print exactly NAME.err. When
NAME.out exists, `plum run` must print exactly NAME.out. Run from the
repository's root; Python standard library only.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

SAMPLES = Path("content/samples")


def run(plum: str, *args: str) -> tuple[int, str]:
    done = subprocess.run([plum, *args], cwd=SAMPLES, capture_output=True, text=True, timeout=60)
    return done.returncode, done.stdout + done.stderr


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    plum = str(Path(sys.argv[1]).resolve())
    problems: list[str] = []
    files = sorted(SAMPLES.glob("*.plum"))
    for file in files:
        name = file.name
        err = file.with_suffix(".err")
        code, output = run(plum, "check", name)
        if err.is_file():
            if code == 0:
                problems.append(f"{name}: plum check passed, expected the error in {err.name}")
            elif output != err.read_text(encoding="utf-8"):
                problems.append(f"{name}: plum check printed\n{output}")
            continue
        if code != 0:
            problems.append(f"{name}: plum check failed:\n{output}")
            continue
        out = file.with_suffix(".out")
        if out.is_file():
            code, output = run(plum, "run", name)
            if code != 0 or output != out.read_text(encoding="utf-8"):
                problems.append(f"{name}: plum run printed\n{output}")
    for problem in problems:
        print(problem, file=sys.stderr)
    if problems:
        print(f"samples: {len(problems)} problem(s)", file=sys.stderr)
        return 1
    print(f"samples: {len(files)} checked with {plum}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
