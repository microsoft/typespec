# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for the placement of the flattened JSON model body of paging operations.

Regression coverage for the bug where the ``if body is _Unset: ...`` body
construction was emitted *inside* the ``prepare_request`` closure of a paging
operation. Because the closure assigned to ``body``, Python treated ``body`` as
a function local for the whole closure and the earlier ``if body is _Unset``
read raised ``UnboundLocalError`` at runtime.
"""

import pytest

from pygen.codegen.models import (
    BodyParameter,
    Client,
    CodeModel,
    JSONModelType,
    PagingOperation,
    Parameter,
    ParameterList,
    RequestBuilder,
)
from pygen.codegen.models.parameter_list import RequestBuilderParameterList
from pygen.codegen.models.primitive_types import StringType
from pygen.codegen.serializers.builder_serializer import (
    PagingOperationSerializer,
    _serialize_json_model_body,
    is_json_model_type,
)


@pytest.fixture
def code_model():
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
            "version-tolerant": True,
        },
    )


@pytest.fixture
def client(code_model):
    return Client(
        {
            "name": "client",
            "namespace": "blah",
            "moduleName": "blah",
            "parameters": [],
            "url": "",
            "operationGroups": [],
        },
        code_model,
        parameters=[],
    )


def _json_model_type(code_model):
    return JSONModelType(
        {"type": "model", "name": "MyBody", "snakeCaseName": "my_body"},
        code_model,
    )


def _body_parameter(code_model):
    return BodyParameter(
        yaml_data={
            "clientName": "body",
            "optional": False,
            "location": "body",
            "wireName": "body",
            "contentTypes": ["application/json"],
            "defaultContentType": "application/json",
            "propertyToParameterName": {"filter": "filter", "maxCount": "max_count"},
        },
        code_model=code_model,
        type=_json_model_type(code_model),
    )


def _flattened_parameters(code_model):
    required = Parameter(
        yaml_data={
            "clientName": "filter",
            "optional": False,
            "location": "other",
            "wireName": "filter",
            "inFlattenedBody": True,
            "defaultToUnsetSentinel": True,
        },
        code_model=code_model,
        type=StringType({"type": "string"}, code_model),
    )
    optional = Parameter(
        yaml_data={
            "clientName": "max_count",
            "optional": True,
            "location": "other",
            "wireName": "maxCount",
            "inFlattenedBody": True,
            "defaultToUnsetSentinel": True,
        },
        code_model=code_model,
        type=StringType({"type": "string"}, code_model),
    )
    return [required, optional]


@pytest.fixture
def json_body_parameter_list(code_model):
    return ParameterList(
        {},
        code_model,
        _flattened_parameters(code_model),
        body_parameter=_body_parameter(code_model),
    )


@pytest.fixture
def request_builder(code_model, client):
    return RequestBuilder(
        yaml_data={
            "url": "http://fake.com",
            "method": "GET",
            "groupName": "blah",
            "isOverload": False,
            "apiVersions": [],
        },
        client=client,
        code_model=code_model,
        name="paging_json_body_test_request",
        parameters=RequestBuilderParameterList({}, code_model, parameters=[]),
    )


@pytest.fixture
def paging_operation(code_model, client, request_builder, json_body_parameter_list):
    return PagingOperation(
        yaml_data={
            "url": "http://fake.com",
            "method": "GET",
            "groupName": "blah",
            "isOverload": False,
            "apiVersions": [],
            "pagerSync": "blah",
            "pagerAsync": "blah",
        },
        client=client,
        code_model=code_model,
        request_builder=request_builder,
        name="paging_json_body_test",
        parameters=json_body_parameter_list,
        responses=[],
        exceptions=[],
    )


class _TestPagingOperationSerializer(PagingOperationSerializer):
    """Stubs out the heavy request-builder calls so we can assert on placement."""

    def call_request_builder(self, builder, is_paging=False):
        return ["_request = build_request()"]

    def call_next_link_request_builder(self, builder):
        return ["_request = build_next_request()"]


def test_is_json_model_type(json_body_parameter_list):
    assert is_json_model_type(json_body_parameter_list)


def test_serialize_json_model_body_emits_unset_guard(
    code_model, json_body_parameter_list
):
    lines = _serialize_json_model_body(
        json_body_parameter_list.body_parameter, json_body_parameter_list.parameters
    )
    text = "\n".join(lines)

    # The body is only constructed when the caller did not pass it explicitly.
    assert "if body is _Unset:" in lines

    # The required flattened parameter gets a missing-argument guard...
    assert any("if filter is _Unset:" in line for line in lines)
    assert "raise TypeError('missing required argument: filter')" in text

    # ...but the optional one does not.
    assert all("max_count is _Unset" not in line for line in lines)

    # The body dict is constructed from the flattened parameters and then pruned
    # of None values.
    assert any('"filter": filter' in line for line in lines)
    assert any('"maxCount": max_count' in line for line in lines)
    assert any("if v is not None" in line for line in lines)


def test_paging_body_constructed_outside_prepare_request(code_model, paging_operation):
    serializer = _TestPagingOperationSerializer(
        code_model, async_mode=False, client_namespace="blah"
    )
    lines = serializer._prepare_request_callback(paging_operation)

    unset_index = next(
        i for i, line in enumerate(lines) if "if body is _Unset:" in line
    )
    prepare_request_index = next(
        i for i, line in enumerate(lines) if line.startswith("def prepare_request(")
    )

    # The regression: body construction must happen before (and therefore
    # outside) the prepare_request closure.
    assert unset_index < prepare_request_index

    # The body block must not be indented under the closure body.
    body_line = lines[unset_index]
    assert body_line == "if body is _Unset:"
