#!/usr/bin/env python3
"""
validate.py — JSON schema validator for ElectionWatch scraper outputs.

Usage:
    python validate.py                    # validate all three sample fixtures
    python validate.py snapshot           # validate fixtures/snapshot_sample.json
    python validate.py state              # validate fixtures/state_S22_sample.json
    python validate.py events             # validate fixtures/events_sample.json
    python validate.py path/to/file.json snapshot   # validate arbitrary file against snapshot schema

Requires:
    pip install jsonschema

Exit code 0 = all valid, non-zero = one or more failures.
"""

import json
import sys
from pathlib import Path

try:
    import jsonschema
    from jsonschema import validate, Draft202012Validator
except ImportError:
    print("ERROR: jsonschema not installed. Run: pip install jsonschema", file=sys.stderr)
    sys.exit(2)

BASE = Path(__file__).parent

SCHEMA_MAP = {
    "snapshot": BASE / "schemas" / "snapshot.schema.json",
    "state":    BASE / "schemas" / "state.schema.json",
    "events":   BASE / "schemas" / "events.schema.json",
}

FIXTURE_MAP = {
    "snapshot": BASE / "fixtures" / "snapshot_sample.json",
    "state":    BASE / "fixtures" / "state_S22_sample.json",
    "events":   BASE / "fixtures" / "events_sample.json",
}


def load_json(path: Path) -> dict:
    with open(path) as f:
        return json.load(f)


def run_validation(instance_path: Path, schema_key: str) -> bool:
    schema_path = SCHEMA_MAP.get(schema_key)
    if schema_path is None:
        print(f"  UNKNOWN schema key '{schema_key}'. Choose: snapshot, state, events")
        return False

    schema = load_json(schema_path)
    instance = load_json(instance_path)

    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(instance), key=lambda e: e.path)

    if not errors:
        print(f"  OK  {instance_path.name} → {schema_path.name}")
        return True
    else:
        print(f"  FAIL {instance_path.name} → {schema_path.name}")
        for err in errors:
            path = " > ".join(str(p) for p in err.absolute_path) or "(root)"
            print(f"       [{path}] {err.message}")
        return False


def main():
    args = sys.argv[1:]

    # Determine what to validate
    if len(args) == 0:
        # Validate all three fixtures
        jobs = [
            (FIXTURE_MAP["snapshot"], "snapshot"),
            (FIXTURE_MAP["state"],    "state"),
            (FIXTURE_MAP["events"],   "events"),
        ]
    elif len(args) == 1 and args[0] in SCHEMA_MAP:
        jobs = [(FIXTURE_MAP[args[0]], args[0])]
    elif len(args) == 2:
        # validate.py path/to/file.json schema_key
        jobs = [(Path(args[0]), args[1])]
    else:
        print(__doc__)
        sys.exit(1)

    print("ElectionWatch schema validation")
    print("=" * 50)
    all_ok = True
    for path, schema_key in jobs:
        ok = run_validation(path, schema_key)
        if not ok:
            all_ok = False

    print("=" * 50)
    if all_ok:
        print("All validations passed.")
        sys.exit(0)
    else:
        print("One or more validations FAILED.")
        sys.exit(1)


if __name__ == "__main__":
    main()
