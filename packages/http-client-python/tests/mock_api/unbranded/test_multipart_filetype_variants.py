# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Offline unit tests for ``prepare_multipart_form_data``.

Verify that every concrete variant of the ``FileType`` union produces a
multipart-equivalent normalized entry — i.e. the same field name, filename,
and content payload.  These tests run entirely offline (no network, no mock
server) and operate directly on the generated helper.
"""

import io
from pathlib import Path

import pytest

from payload.multipart._utils.utils import prepare_multipart_form_data

FILENAME = "image.jpg"
CONTENT = b"\xff\xd8\xff\xe0 fake jpeg"
FIELD = "profileImage"


def _read(value):
    """Return raw bytes regardless of whether *value* is bytes or IO."""
    if hasattr(value, "read"):
        try:
            value.seek(0)
        except Exception:  # pylint: disable=broad-except
            pass
        return value.read()
    return value


def _canonicalize(prepared, field=FIELD):
    """Extract the first entry for *field* as (field, filename, bytes)."""
    for f, entry in prepared:
        if f == field:
            assert isinstance(entry, tuple), f"helper must wrap entry as a tuple, got {entry!r}"
            filename = entry[0]
            content = _read(entry[1])
            return (f, filename, content)
    raise AssertionError(f"field {field!r} not found in {prepared!r}")


# ── Variant helpers ──────────────────────────────────────────────────────


def _io_from_disk(tmp_path):
    p = tmp_path / FILENAME
    p.write_bytes(CONTENT)
    return p.open("rb")


# ── Tests ────────────────────────────────────────────────────────────────


class TestNormalizeBareInputs:
    """Bare bytes / IO must be wrapped with a synthesized filename."""

    def test_bare_io_gets_filename_from_name_attr(self, tmp_path):
        """IO objects with a .name attribute use basename as filename."""
        body = {FIELD: _io_from_disk(tmp_path)}
        result = prepare_multipart_form_data(body, [FIELD], [])
        field, filename, content = _canonicalize(result)
        assert field == FIELD
        assert filename == FILENAME
        assert content == CONTENT

    def test_bare_bytes_gets_field_name_as_filename(self):
        """Bare bytes without .name fall back to the field name."""
        body = {FIELD: CONTENT}
        result = prepare_multipart_form_data(body, [FIELD], [])
        field, filename, content = _canonicalize(result)
        assert field == FIELD
        assert filename == FIELD  # fallback
        assert content == CONTENT

    def test_bare_bytes_io_gets_field_name_as_filename(self):
        """BytesIO without .name falls back to the field name."""
        body = {FIELD: io.BytesIO(CONTENT)}
        result = prepare_multipart_form_data(body, [FIELD], [])
        field, filename, content = _canonicalize(result)
        assert field == FIELD
        assert filename == FIELD  # BytesIO.name is not a real path
        assert content == CONTENT


class TestTuplePassthrough:
    """Tuple variants of FileType must pass through unchanged."""

    def test_two_tuple(self):
        body = {FIELD: (FILENAME, CONTENT)}
        result = prepare_multipart_form_data(body, [FIELD], [])
        _, entry = result[0]
        assert entry == (FILENAME, CONTENT)

    def test_three_tuple(self):
        body = {FIELD: (FILENAME, CONTENT, "image/jpeg")}
        result = prepare_multipart_form_data(body, [FIELD], [])
        _, entry = result[0]
        assert entry == (FILENAME, CONTENT, "image/jpeg")


class TestListEntries:
    """List-valued file fields normalize each element independently."""

    def test_list_of_bare_bytes(self):
        body = {FIELD: [b"file0", b"file1"]}
        result = prepare_multipart_form_data(body, [FIELD], [])
        assert len(result) == 2
        _, entry0 = result[0]
        _, entry1 = result[1]
        # index 0 → field name (no suffix), index 1+ → field_N
        assert entry0[0] == FIELD
        assert entry1[0] == f"{FIELD}_1"

    def test_list_of_tuples(self):
        body = {FIELD: [("a.jpg", b"a"), ("b.jpg", b"b")]}
        result = prepare_multipart_form_data(body, [FIELD], [])
        assert len(result) == 2
        _, entry0 = result[0]
        _, entry1 = result[1]
        assert entry0 == ("a.jpg", b"a")
        assert entry1 == ("b.jpg", b"b")


class TestDataFieldOrdering:
    """Data fields must appear before file fields."""

    def test_data_precedes_files(self, tmp_path):
        body = {"id": "123", FIELD: _io_from_disk(tmp_path)}
        result = prepare_multipart_form_data(body, [FIELD], ["id"])
        fields = [f for f, _ in result]
        assert fields == ["id", FIELD]


class TestEdgeCases:
    """Edge cases: None values, empty content."""

    def test_none_value_skipped(self):
        body = {FIELD: None}
        result = prepare_multipart_form_data(body, [FIELD], [])
        assert len(result) == 0

    def test_missing_field_skipped(self):
        body = {}
        result = prepare_multipart_form_data(body, [FIELD], [])
        assert len(result) == 0
