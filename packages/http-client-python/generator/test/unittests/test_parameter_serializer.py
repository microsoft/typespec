# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pygen.codegen.models import Parameter, CodeModel
from pygen.codegen.models.primitive_types import StringType
from pygen.codegen.serializers.parameter_serializer import ParameterSerializer


def get_code_model():
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
        },
    )


def make_header_param(wire_name, optional=False):
    cm = get_code_model()
    return Parameter(
        yaml_data={
            "wireName": wire_name,
            "clientName": wire_name.replace("-", "_").lower(),
            "location": "header",
            "optional": optional,
            "implementation": "Method",
            "inOverload": False,
            "inOverloaded": False,
        },
        code_model=cm,
        type=StringType({"type": "string"}, cm),
    )


def test_content_type_header_has_none_guard():
    """Content-Type header should always have an 'if is not None' guard,
    even when the parameter is required, to handle the case where
    content_type is set to None for optional bodies."""
    param = make_header_param("Content-Type", optional=False)
    result = ParameterSerializer("namespace").serialize_query_header(
        param, "headers", "_SERIALIZER", is_legacy=False
    )
    joined = "\n".join(result)
    assert "is not None" in joined


def test_non_content_type_required_header_no_guard():
    """A required non-Content-Type header should be a direct assignment
    with no None guard."""
    param = make_header_param("x-ms-version", optional=False)
    result = ParameterSerializer("namespace").serialize_query_header(
        param, "headers", "_SERIALIZER", is_legacy=False
    )
    joined = "\n".join(result)
    assert "is not None" not in joined


def test_optional_header_has_none_guard():
    """An optional header parameter should have an 'if is not None' guard
    regardless of its wire name."""
    param = make_header_param("x-ms-version", optional=True)
    result = ParameterSerializer("namespace").serialize_query_header(
        param, "headers", "_SERIALIZER", is_legacy=False
    )
    joined = "\n".join(result)
    assert "is not None" in joined
