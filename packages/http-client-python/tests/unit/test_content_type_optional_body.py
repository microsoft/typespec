# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for content-type serialization when a request has an optional body.

When an operation has an optional body whose content-type is modeled as
required/constant (e.g. a single specific media type), calling the operation
without a body leaves ``content_type = None``. The generated request builder
must therefore declare ``content_type`` as ``Optional[str]`` and guard the
header serialization with ``if content_type is not None:`` so a ``None`` value
is omitted instead of serialized (which would raise
``ValueError: No value for given attribute``).

Regression test for https://github.com/microsoft/typespec/issues/11253.
"""
from pygen.codegen.models import CodeModel, StringType
from pygen.codegen.models.request_builder_parameter import RequestBuilderParameter
from pygen.codegen.serializers.parameter_serializer import ParameterSerializer, PopKwargType


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
            "only-path-and-body-params-positional": True,
        },
    )


def get_content_type_parameter(*, required: bool):
    code_model = get_code_model()
    return RequestBuilderParameter(
        yaml_data={
            "wireName": "content-type",
            "clientName": "content_type",
            "location": "header",
            "optional": not required,
            "implementation": "Method",
            "inOverload": False,
            "inOverloaded": False,
        },
        code_model=code_model,
        type=StringType(yaml_data={"type": "str"}, code_model=code_model),
    )


def test_optional_body_guards_required_content_type_header():
    """A required content-type header is guarded when the body is optional."""
    content_type = get_content_type_parameter(required=True)
    lines = ParameterSerializer("").serialize_query_header(
        content_type,
        "headers",
        "_SERIALIZER",
        is_legacy=False,
        is_body_optional=True,
    )
    assert lines[0] == "if content_type is not None:"
    assert lines[1].strip().startswith("_headers['content-type'] =")


def test_required_body_does_not_guard_required_content_type_header():
    """A required content-type header stays unguarded when the body is required."""
    content_type = get_content_type_parameter(required=True)
    lines = ParameterSerializer("").serialize_query_header(
        content_type,
        "headers",
        "_SERIALIZER",
        is_legacy=False,
        is_body_optional=False,
    )
    assert len(lines) == 1
    assert lines[0].startswith("_headers['content-type'] =")


def test_optional_body_makes_required_content_type_kwarg_optional():
    """The popped content-type kwarg becomes ``Optional[str]`` with a ``None`` default."""
    content_type = get_content_type_parameter(required=True)
    lines = ParameterSerializer.pop_kwargs_from_signature(
        [content_type],
        check_kwarg_dict=True,
        pop_headers_kwarg=PopKwargType.CASE_INSENSITIVE,
        pop_params_kwarg=PopKwargType.NO,
        is_body_optional=True,
    )
    declaration = next(line for line in lines if line.startswith("content_type"))
    assert declaration == "content_type: Optional[str] = kwargs.pop('content_type', _headers.pop('content-type', None))"
    # No body reassignment should be emitted in the request builder layer.
    assert not any("content_type = content_type if" in line for line in lines)


def test_required_body_keeps_required_content_type_kwarg():
    """The popped content-type kwarg stays required when the body is required."""
    content_type = get_content_type_parameter(required=True)
    lines = ParameterSerializer.pop_kwargs_from_signature(
        [content_type],
        check_kwarg_dict=True,
        pop_headers_kwarg=PopKwargType.CASE_INSENSITIVE,
        pop_params_kwarg=PopKwargType.NO,
        is_body_optional=False,
    )
    declaration = next(line for line in lines if line.startswith("content_type"))
    assert declaration == "content_type: str = kwargs.pop('content_type')"
