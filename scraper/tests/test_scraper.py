"""
ElectionWatch scraper tests.

Tests:
  1. parse_constituency_page — validates parser against local ECI-structure HTML fixture.
  2. parse_partywise_page — validates party tally + vote share extraction.
  3. diff_constituencies — smoke tests for lead_flip and result_declared events.
  4. Schema validation — parsed output validates against snapshot.schema.json.

Run:
  cd ~/electionwatch/scraper
  pytest tests/ -v
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Ensure scraper module is importable without env vars set
# ---------------------------------------------------------------------------
sys.path.insert(0, str(Path(__file__).parent.parent))

from scraper import (
    diff_constituencies,
    parse_constituency_page,
    parse_partywise_page,
    ParseDriftError,
)

FIXTURES = Path(__file__).parent / "fixtures"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def load_fixture(name: str) -> str:
    return (FIXTURES / name).read_text()


# ---------------------------------------------------------------------------
# parse_constituency_page tests
# ---------------------------------------------------------------------------
class TestParseConstituencyPage:
    def test_parses_four_rows(self):
        html = load_fixture("constituency_S22.html")
        rows = parse_constituency_page(html, "S22")
        assert len(rows) == 4

    def test_row_schema(self):
        html = load_fixture("constituency_S22.html")
        rows = parse_constituency_page(html, "S22")
        required_keys = {
            "ac_no", "name", "leading_candidate", "leading_party",
            "leading_margin", "rounds_completed", "rounds_total",
            "status", "last_change_ts",
        }
        for row in rows:
            missing = required_keys - set(row.keys())
            assert not missing, f"Missing keys in row: {missing}"

    def test_ac_no_is_integer(self):
        html = load_fixture("constituency_S22.html")
        rows = parse_constituency_page(html, "S22")
        for row in rows:
            assert isinstance(row["ac_no"], int)
            assert row["ac_no"] >= 1

    def test_declared_status(self):
        html = load_fixture("constituency_S22.html")
        rows = parse_constituency_page(html, "S22")
        # Row 2 (Ponneri) has "Result Declared" status
        ponneri = next(r for r in rows if r["name"] == "Ponneri")
        assert ponneri["status"] == "declared"

    def test_won_status_maps_to_declared(self):
        html = load_fixture("constituency_S22.html")
        rows = parse_constituency_page(html, "S22")
        # Row 4 (Sholinghur) has "Won" status — should map to declared
        sholinghur = next(r for r in rows if r["name"] == "Sholinghur")
        assert sholinghur["status"] == "declared"

    def test_counting_status(self):
        html = load_fixture("constituency_S22.html")
        rows = parse_constituency_page(html, "S22")
        gummi = next(r for r in rows if r["name"] == "Gummidipoondi")
        assert gummi["status"] == "leading"

    def test_margin_parsed_with_comma(self):
        html = load_fixture("constituency_S22.html")
        rows = parse_constituency_page(html, "S22")
        gummi = next(r for r in rows if r["name"] == "Gummidipoondi")
        assert gummi["leading_margin"] == 5824

    def test_party_extracted(self):
        html = load_fixture("constituency_S22.html")
        rows = parse_constituency_page(html, "S22")
        tiruttani = next(r for r in rows if r["name"] == "Tiruttani")
        assert tiruttani["leading_party"] == "AIADMK"

    def test_rounds_parsed(self):
        html = load_fixture("constituency_S22.html")
        rows = parse_constituency_page(html, "S22")
        gummi = next(r for r in rows if r["name"] == "Gummidipoondi")
        assert gummi["rounds_completed"] == 11
        assert gummi["rounds_total"] == 18

    def test_raises_on_empty_html(self):
        with pytest.raises(ParseDriftError):
            parse_constituency_page("<html><body></body></html>", "S22")

    def test_raises_on_no_data_rows(self):
        html = "<html><body><table><tr><th>Party</th><th>Won</th></tr></table></body></html>"
        with pytest.raises(ParseDriftError):
            parse_constituency_page(html, "S22")


# ---------------------------------------------------------------------------
# parse_partywise_page tests
# ---------------------------------------------------------------------------
class TestParsePartywisePage:
    def test_returns_seats_tally(self):
        html = load_fixture("partywise_S22.html")
        seats, _ = parse_partywise_page(html, "S22")
        assert seats["DMK"] == 138
        assert seats["AIADMK"] == 66
        assert seats["BJP"] == 8

    def test_excludes_grand_total_row(self):
        html = load_fixture("partywise_S22.html")
        seats, _ = parse_partywise_page(html, "S22")
        assert "Grand Total" not in seats
        assert "Total" not in seats

    def test_vote_share_empty_when_no_vote_column(self):
        html = load_fixture("partywise_S22.html")
        _, vote_share = parse_partywise_page(html, "S22")
        # fixture has no vote count column → vote_share should be empty
        assert vote_share == {}

    def test_empty_html_returns_empty_dicts(self):
        seats, vote_share = parse_partywise_page("<html><body></body></html>", "S22")
        assert seats == {}
        assert vote_share == {}


# ---------------------------------------------------------------------------
# diff_constituencies tests
# ---------------------------------------------------------------------------
class TestDiffConstituencies:
    NOW = "2026-05-04T11:00:00+05:30"

    def _make_ac(self, ac_no: int, party: str, status: str = "leading", margin: int = 1000) -> dict:
        return {
            "ac_no": ac_no,
            "name": f"AC-{ac_no}",
            "leading_party": party,
            "leading_candidate": f"Candidate-{ac_no}",
            "leading_margin": margin,
            "rounds_completed": 10,
            "rounds_total": 20,
            "status": status,
            "last_change_ts": self.NOW,
        }

    def test_no_events_when_identical(self):
        prev = [self._make_ac(1, "DMK"), self._make_ac(2, "AIADMK")]
        curr = [self._make_ac(1, "DMK"), self._make_ac(2, "AIADMK")]
        events = diff_constituencies(prev, curr, "S22", self.NOW)
        assert events == []

    def test_lead_flip_detected(self):
        prev = [self._make_ac(1, "DMK"), self._make_ac(2, "AIADMK")]
        curr = [self._make_ac(1, "AIADMK"), self._make_ac(2, "AIADMK")]
        events = diff_constituencies(prev, curr, "S22", self.NOW)
        assert len(events) == 1
        e = events[0]
        assert e["type"] == "lead_flip"
        assert e["ac_no"] == 1
        assert e["from"] == "DMK"
        assert e["to"] == "AIADMK"
        assert e["state"] == "S22"
        assert e["ts"] == self.NOW

    def test_result_declared_detected(self):
        prev = [self._make_ac(1, "DMK", status="leading")]
        curr = [self._make_ac(1, "DMK", status="declared")]
        events = diff_constituencies(prev, curr, "S22", self.NOW)
        assert len(events) == 1
        e = events[0]
        assert e["type"] == "result_declared"
        assert e["ac_no"] == 1
        assert e["party"] == "DMK"
        assert e["state"] == "S22"

    def test_both_events_in_one_diff(self):
        """Lead flip on AC 1, result declared on AC 2."""
        prev = [self._make_ac(1, "DMK", status="leading"), self._make_ac(2, "BJP", status="leading")]
        curr = [self._make_ac(1, "AIADMK", status="leading"), self._make_ac(2, "BJP", status="declared")]
        events = diff_constituencies(prev, curr, "S22", self.NOW)
        types = {e["type"] for e in events}
        assert types == {"lead_flip", "result_declared"}

    def test_no_event_for_new_ac_not_in_prev(self):
        """New AC appears in curr but not prev — no event (can't diff without baseline)."""
        prev = [self._make_ac(1, "DMK")]
        curr = [self._make_ac(1, "DMK"), self._make_ac(99, "INC")]
        events = diff_constituencies(prev, curr, "S22", self.NOW)
        assert events == []

    def test_no_lead_flip_when_same_party_different_candidate(self):
        prev = [self._make_ac(1, "DMK")]
        curr = [self._make_ac(1, "DMK")]
        curr[0]["leading_candidate"] = "Different Candidate"
        events = diff_constituencies(prev, curr, "S22", self.NOW)
        assert events == []

    def test_no_event_if_party_empty(self):
        """Empty leading_party should not generate a lead_flip event."""
        prev = [{"ac_no": 1, "name": "AC-1", "leading_party": "", "leading_candidate": "",
                 "leading_margin": 0, "rounds_completed": 0, "rounds_total": 10,
                 "status": "leading", "last_change_ts": self.NOW}]
        curr = [{"ac_no": 1, "name": "AC-1", "leading_party": "DMK", "leading_candidate": "X",
                 "leading_margin": 100, "rounds_completed": 1, "rounds_total": 10,
                 "status": "leading", "last_change_ts": self.NOW}]
        events = diff_constituencies(prev, curr, "S22", self.NOW)
        # from="" → no lead_flip (prev party was empty)
        lead_flips = [e for e in events if e["type"] == "lead_flip"]
        assert len(lead_flips) == 0


# ---------------------------------------------------------------------------
# Schema validation integration test
# ---------------------------------------------------------------------------
class TestSnapshotSchemaValidation:
    """Validate the fixture against the schema — ensures fixture and schema stay in sync."""

    def test_snapshot_fixture_validates(self):
        try:
            import jsonschema
            from jsonschema import Draft202012Validator
        except ImportError:
            pytest.skip("jsonschema not installed")

        schema_path = Path(__file__).parent.parent / "schemas" / "snapshot.schema.json"
        fixture_path = Path(__file__).parent.parent / "fixtures" / "snapshot_sample.json"

        schema = json.loads(schema_path.read_text())
        instance = json.loads(fixture_path.read_text())

        validator = Draft202012Validator(schema)
        errors = list(validator.iter_errors(instance))
        assert not errors, f"Schema validation failed: {[e.message for e in errors]}"

    def test_snapshot_has_correct_version(self):
        fixture_path = Path(__file__).parent.parent / "fixtures" / "snapshot_sample.json"
        snapshot = json.loads(fixture_path.read_text())
        assert snapshot["version"] == 1

    def test_states_is_array(self):
        fixture_path = Path(__file__).parent.parent / "fixtures" / "snapshot_sample.json"
        snapshot = json.loads(fixture_path.read_text())
        assert isinstance(snapshot["states"], list)
        assert len(snapshot["states"]) == 5

    def test_states_have_total_ac(self):
        fixture_path = Path(__file__).parent.parent / "fixtures" / "snapshot_sample.json"
        snapshot = json.loads(fixture_path.read_text())
        for state in snapshot["states"]:
            assert "total_ac" in state
            assert "code" in state

    def test_national_structure(self):
        fixture_path = Path(__file__).parent.parent / "fixtures" / "snapshot_sample.json"
        snapshot = json.loads(fixture_path.read_text())
        national = snapshot["national"]
        assert "declared" in national
        assert "leading" in national
        assert "vote_share" in national
