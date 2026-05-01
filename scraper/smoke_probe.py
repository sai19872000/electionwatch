#!/usr/bin/env python3
"""
smoke_probe.py — probe both candidate ECI base paths and report which return 200.

Candidate base paths for May 2026 assembly results:
  AcResultGenMay2026/   (path variant A)
  ResultAcGenMay2026/   (path variant B)

For each base path, HEAD-checks the Statewise.htm index page plus one sample
constituency page. Prints HTTP status per probe and emits a shell-sourceable
recommendation at the end.

Usage:
  python3 smoke_probe.py
  python3 smoke_probe.py --timeout 10

Exit 0 if at least one base path returns HTTP 200 for the index page.
Exit 1 if neither is live (ECI hasn't published yet).
"""

from __future__ import annotations

import argparse
import sys
import urllib.request
import urllib.error

ECI_HOST = "https://results.eci.gov.in"
CANDIDATE_BASES = ["AcResultGenMay2026", "ResultAcGenMay2026"]
STATE_CODES = ["S03", "S11", "S22", "S25", "U06"]
SAMPLE_CODE = STATE_CODES[0]  # one state is enough to verify path structure


def probe_head(url: str, timeout: int) -> tuple[int | None, str]:
    """HEAD request; returns (status_code, error_string)."""
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "ElectionWatch-Probe/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, ""
    except urllib.error.HTTPError as e:
        return e.code, str(e.reason)
    except Exception as e:
        return None, str(e)


def probe_base(base: str, timeout: int) -> tuple[bool, list[tuple[str, int | None, str]]]:
    """
    Probe a candidate base path. Returns (index_200, list_of_(url, status, error)).
    """
    probes: list[tuple[str, int | None, str]] = []

    urls = [
        f"{ECI_HOST}/{base}/Statewise.htm",
        f"{ECI_HOST}/{base}/ConstituencywiseResult-{SAMPLE_CODE}.htm",
        f"{ECI_HOST}/{base}/PartywiseResult-{SAMPLE_CODE}.htm",
    ]
    index_200 = False
    for url in urls:
        status, err = probe_head(url, timeout)
        probes.append((url, status, err))
        ok = status == 200
        if url.endswith("Statewise.htm") and ok:
            index_200 = True

    return index_200, probes


def main() -> int:
    parser = argparse.ArgumentParser(description="ECI base-path smoke probe for May 2026 results portal")
    parser.add_argument("--timeout", type=int, default=5, help="HTTP timeout in seconds (default: 5)")
    args = parser.parse_args()

    print("=" * 60)
    print("ElectionWatch — ECI base path smoke probe")
    print(f"Host: {ECI_HOST}")
    print(f"Timeout: {args.timeout}s")
    print("=" * 60)

    winning: str | None = None

    for base in CANDIDATE_BASES:
        print(f"\n── {base}")
        index_200, probes = probe_base(base, args.timeout)
        for url, status, err in probes:
            st = str(status) if status is not None else "ERR"
            mark = "✓" if status == 200 else "✗"
            print(f"  [{st:>3}] {mark}  {url}")
            if err and status not in (404, 403):
                print(f"           └─ {err}")
        if index_200 and winning is None:
            winning = base

    print("\n" + "=" * 60)
    if winning:
        print(f"RESULT: confirmed → {winning}")
        print()
        print("Add to ~/factory/.env.electionwatch:")
        print(f"  ECI_BASE_PATH={winning}")
        return 0
    else:
        print("RESULT: neither base path returned HTTP 200")
        print()
        print("ECI has not yet published the May 2026 results portal.")
        print("Re-run from May 2 onward (ECI typically publishes T-3 to T-1 before counting day).")
        print()
        print("When confirmed, add to ~/factory/.env.electionwatch:")
        print("  ECI_BASE_PATH=<confirmed_path>")
        return 1


if __name__ == "__main__":
    sys.exit(main())
