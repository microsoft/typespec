# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for etag-typed header handling in the preprocess plugin."""
from pygen.preprocess import PreProcessPlugin


def _plugin() -> PreProcessPlugin:
    return PreProcessPlugin(
        output_folder="",
        options={
            "version-tolerant": True,
            "models-mode": "dpg",
            "show-operations": True,
            "show-send-request": True,
            "builders-visibility": "public",
        },
    )


def _header_param(client_name: str, wire_name: str, etag_role: str | None) -> dict:
    p: dict = {
        "clientName": client_name,
        "wireName": wire_name,
        "location": "header",
        "optional": True,
        "implementation": "Method",
        "type": {"type": "string"},
    }
    if etag_role is not None:
        p["etagRole"] = etag_role
    return p


def _client_yaml(operation_params: list[dict]) -> dict:
    return {
        "name": "TestClient",
        "namespace": "test",
        "moduleName": "test",
        "url": "",
        "description": "test",
        "parameters": [],
        "operationGroups": [
            {
                "operations": [
                    {
                        "name": "copyFromUrl",
                        "parameters": operation_params,
                    }
                ]
            }
        ],
    }


def _get_op(client: dict) -> dict:
    return client["operationGroups"][0]["operations"][0]


def test_etag_role_preserved_when_only_standard_pair_present():
    """Standard If-Match/If-None-Match keep their etagRole."""
    if_match = _header_param("if_match", "If-Match", "ifMatch")
    if_none_match = _header_param("if_none_match", "If-None-Match", "ifNoneMatch")
    client = _client_yaml([if_match, if_none_match])

    _plugin().update_client(client)

    op = _get_op(client)
    standard_match = next(p for p in op["parameters"] if p["wireName"] == "If-Match")
    standard_none = next(p for p in op["parameters"] if p["wireName"] == "If-None-Match")
    assert standard_match.get("etagRole") == "ifMatch"
    assert standard_none.get("etagRole") == "ifNoneMatch"
    assert op["hasEtag"] is True


def test_etag_role_preserved_when_only_custom_pair_present():
    """Custom etag headers alone are promoted to the etag/match_condition slot."""
    source_match = _header_param("source_if_match", "x-ms-source-if-match", "ifMatch")
    source_none = _header_param(
        "source_if_none_match", "x-ms-source-if-none-match", "ifNoneMatch"
    )
    client = _client_yaml([source_match, source_none])

    _plugin().update_client(client)

    assert source_match.get("etagRole") == "ifMatch"
    assert source_none.get("etagRole") == "ifNoneMatch"


def test_standard_etag_wins_over_custom_when_both_present():
    """When both standard and custom etag headers are present in the same operation,
    the standard If-Match/If-None-Match pair takes the etag/match_condition slot and
    the custom headers have their etagRole stripped so they retain their natural
    clientName (e.g. source_if_match) instead of colliding with the standard pair.

    Regression test for PR #10494 which caused operations like Storage's copyFromUrl
    to emit two parameters named "etag" and two named "match_condition".
    """
    source_match = _header_param(
        "source_if_match", "x-ms-source-if-match", "ifMatch"
    )
    source_none = _header_param(
        "source_if_none_match", "x-ms-source-if-none-match", "ifNoneMatch"
    )
    if_match = _header_param("if_match", "If-Match", "ifMatch")
    if_none_match = _header_param("if_none_match", "If-None-Match", "ifNoneMatch")

    # Mirror the parameter ordering in routes.tsp: source headers come first.
    client = _client_yaml([source_match, source_none, if_match, if_none_match])
    _plugin().update_client(client)

    # Standard pair keeps etagRole and so will be transformed into etag/match_condition.
    assert if_match.get("etagRole") == "ifMatch"
    assert if_none_match.get("etagRole") == "ifNoneMatch"
    # Custom pair has etagRole stripped, so update_parameter will NOT rename them.
    assert "etagRole" not in source_match
    assert "etagRole" not in source_none

    # The selected pair should be at the end of the operation parameters.
    op = _get_op(client)
    assert op["parameters"][-2] is if_match
    assert op["parameters"][-1] is if_none_match
    assert op["hasEtag"] is True


def test_first_custom_pair_chosen_when_multiple_custom_pairs_present():
    """With multiple custom etag pairs and no standard pair, the first candidate wins."""
    blob_match = _header_param("blob_if_match", "x-ms-blob-if-match", "ifMatch")
    blob_none = _header_param(
        "blob_if_none_match", "x-ms-blob-if-none-match", "ifNoneMatch"
    )
    source_match = _header_param(
        "source_if_match", "x-ms-source-if-match", "ifMatch"
    )
    source_none = _header_param(
        "source_if_none_match", "x-ms-source-if-none-match", "ifNoneMatch"
    )
    client = _client_yaml([blob_match, blob_none, source_match, source_none])

    _plugin().update_client(client)

    # First-encountered pair wins; the rest have etagRole stripped.
    assert blob_match.get("etagRole") == "ifMatch"
    assert blob_none.get("etagRole") == "ifNoneMatch"
    assert "etagRole" not in source_match
    assert "etagRole" not in source_none


def test_synthetic_partner_still_works_with_only_one_custom_etag():
    """When only a single custom etag header is present (no partner), the existing
    synthetic-partner code path still creates a matching ifNoneMatch (or ifMatch)
    copy. The fix must not regress this behaviour.
    """
    source_match = _header_param(
        "source_if_match", "x-ms-source-if-match", "ifMatch"
    )
    client = _client_yaml([source_match])

    _plugin().update_client(client)

    op = _get_op(client)
    assert op.get("hasEtag") is True
    # The original custom param plus a synthetic partner are pushed to the end.
    last_two = op["parameters"][-2:]
    assert last_two[0]["etagRole"] == "ifMatch"
    assert last_two[1]["etagRole"] == "ifNoneMatch"


def test_full_update_yaml_does_not_collide_client_names():
    """End-to-end: after update_client + update_parameter, the four etag headers
    have distinct clientNames.

    Without the fix, both source_if_match and if_match end up with clientName="etag",
    and both source_if_none_match and if_none_match end up with clientName="match_condition".
    """
    source_match = _header_param(
        "source_if_match", "x-ms-source-if-match", "ifMatch"
    )
    source_none = _header_param(
        "source_if_none_match", "x-ms-source-if-none-match", "ifNoneMatch"
    )
    if_match = _header_param("if_match", "If-Match", "ifMatch")
    if_none_match = _header_param("if_none_match", "If-None-Match", "ifNoneMatch")
    client = _client_yaml([source_match, source_none, if_match, if_none_match])

    plugin = _plugin()
    plugin.update_client(client)
    # update_client does the slot/strip; update_parameter does the rename.
    op = _get_op(client)
    for p in op["parameters"]:
        plugin.update_parameter(p)

    client_names = [p["clientName"] for p in op["parameters"]]
    assert len(client_names) == len(set(client_names)), (
        f"Duplicate clientNames after preprocess: {client_names}"
    )
    # The standard pair was promoted; the custom pair retains its natural names.
    assert "etag" in client_names
    assert "match_condition" in client_names
    assert "source_if_match" in client_names
    assert "source_if_none_match" in client_names
