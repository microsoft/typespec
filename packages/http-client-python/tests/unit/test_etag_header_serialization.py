# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Serializer-level tests for etag header emission.

These lock in the *shipped* request-builder output for the etag/match_condition
pair: the conditional header must be serialized with its canonical HTTP casing
(``If-Match`` / ``If-None-Match``) rather than a lowercased or empty wire name.
"""
from pygen.codegen.models import CodeModel, StringType
from pygen.codegen.models.request_builder_parameter import RequestBuilderParameter
from pygen.codegen.serializers.parameter_serializer import ParameterSerializer


def _code_model() -> CodeModel:
    return CodeModel(
        {
            "clients": [
                {
                    "name": "client",
                    "namespace": "blah",
                    "moduleName": "blah",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
            "namespace": "namespace",
        },
        options={
            "show-send-request": True,
            "builders-visibility": "public",
            "show-operations": True,
            "models-mode": "dpg",
            "only-path-and-body-params-positional": True,
        },
    )


def _etag_header(*, wire_name: str, etag_role: str) -> RequestBuilderParameter:
    code_model = _code_model()
    return RequestBuilderParameter(
        yaml_data={
            "wireName": wire_name,
            "clientName": "etag" if etag_role == "ifMatch" else "match_condition",
            "location": "header",
            "optional": True,
            "implementation": "Method",
            "inOverload": False,
            "inOverloaded": False,
            "etagRole": etag_role,
        },
        code_model=code_model,
        type=StringType(yaml_data={"type": "str"}, code_model=code_model),
    )


def test_if_none_match_header_serialized_with_canonical_casing():
    """The synthesized If-None-Match companion emits a properly-cased header."""
    param = _etag_header(wire_name="If-None-Match", etag_role="ifNoneMatch")
    lines = ParameterSerializer("").serialize_query_header(param, "headers", "_SERIALIZER", is_legacy=False)
    assert lines[0] == "if_none_match = prep_if_none_match(etag, match_condition)"
    assert lines[1] == "if if_none_match is not None:"
    assert '_headers["If-None-Match"]' in lines[2]
    # Never emit the lowercased or empty wire name that caused the original defect.
    assert not any('_headers["if-none-match"]' in line or '_headers[""]' in line for line in lines)


def test_if_match_header_serialized_with_canonical_casing():
    """The declared/synthesized If-Match header emits a properly-cased header."""
    param = _etag_header(wire_name="If-Match", etag_role="ifMatch")
    lines = ParameterSerializer("").serialize_query_header(param, "headers", "_SERIALIZER", is_legacy=False)
    assert lines[0] == "if_match = prep_if_match(etag, match_condition)"
    assert lines[1] == "if if_match is not None:"
    assert '_headers["If-Match"]' in lines[2]
