# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Unit tests for the generated ``prepare_multipart_form_data`` helper.

The helper is rendered from ``utils.py.jinja2`` into every SDK that has a
multipart/form-data operation. We import one such rendered copy (from the
``payload.multipart`` test SDK) and assert that:

1. Fields are serialized in the TypeSpec declaration order — not split into
   "all files first, then all data" the way the previous implementation did.
   This matters because some streaming server-side parsers require JSON
   metadata parts to precede binary file parts (see RFC 7578 §5.2 and the
   ``create_agent_version_from_code`` endpoint of the Azure AI Foundry
   hosted-agents service).
2. File fields handle list-valued entries (multiple files under the same
   wire name) by emitting one part per element.
3. Data fields are serialized through ``serialize_multipart_data_entry`` so
   model/dict/list values are encoded as JSON.
"""

import json

from payload.multipart._utils.utils import prepare_multipart_form_data


def test_fields_preserve_declaration_order():
    """Data fields declared before file fields must appear first on the wire."""
    body = {
        "id": "123",
        "address": {"city": "X"},
        "profileImage": b"jpg-bytes",
        "previousAddresses": [{"city": "Y"}, {"city": "Z"}],
        "pictures": [b"png-bytes-1", b"png-bytes-2"],
    }
    fields = [
        ("id", False),
        ("address", False),
        ("profileImage", True),
        ("previousAddresses", False),
        ("pictures", True),
    ]

    files = prepare_multipart_form_data(body, fields)

    assert [name for name, _ in files] == [
        "id",
        "address",
        "profileImage",
        "previousAddresses",
        "pictures",
        "pictures",
    ]


def test_files_first_when_declared_first():
    """If the TypeSpec model declares files first, that order is preserved."""
    body = {"profileImage": b"jpg-bytes", "id": "123"}
    fields = [("profileImage", True), ("id", False)]

    files = prepare_multipart_form_data(body, fields)

    assert [name for name, _ in files] == ["profileImage", "id"]


def test_list_valued_file_field_emits_one_part_per_element():
    body = {"pictures": [b"a", b"b", b"c"]}
    fields = [("pictures", True)]

    files = prepare_multipart_form_data(body, fields)

    assert files == [("pictures", b"a"), ("pictures", b"b"), ("pictures", b"c")]


def test_data_field_dict_is_json_encoded():
    body = {"address": {"city": "X"}}
    fields = [("address", False)]

    files = prepare_multipart_form_data(body, fields)

    assert len(files) == 1
    name, value = files[0]
    assert name == "address"
    assert json.loads(value) == {"city": "X"}


def test_data_field_list_is_json_encoded():
    body = {"previousAddresses": [{"city": "Y"}, {"city": "Z"}]}
    fields = [("previousAddresses", False)]

    files = prepare_multipart_form_data(body, fields)

    assert len(files) == 1
    name, value = files[0]
    assert name == "previousAddresses"
    assert json.loads(value) == [{"city": "Y"}, {"city": "Z"}]


def test_missing_or_falsy_entries_are_skipped():
    """Matches the pre-fix behavior: ``body.get(field)`` falsy values are dropped."""
    body = {"id": "", "profileImage": None, "address": {"city": "X"}}
    fields = [
        ("id", False),
        ("address", False),
        ("profileImage", True),
    ]

    files = prepare_multipart_form_data(body, fields)

    assert [name for name, _ in files] == ["address"]
