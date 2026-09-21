# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for the ``get_long_running_output`` callback generated for LRO operations."""

import json

import pytest

from pygen.codegen.models import (
    CodeModel,
    Client,
    LROOperation,
    ParameterList,
    RequestBuilder,
)
from pygen.codegen.models.response import LROResponse
from pygen.codegen.models.parameter_list import RequestBuilderParameterList
from pygen.codegen.models.primitive_types import StringType
from pygen.codegen.serializers.builder_serializer import LROOperationSerializer

_CLIENT_YAML = {
    "name": "client",
    "namespace": "blah",
    "moduleName": "blah",
    "parameters": [],
    "url": "",
    "operationGroups": [],
}
_OPERATION_YAML = {
    "url": "http://fake.com",
    "method": "PUT",
    "groupName": "blah",
    "isOverload": False,
    "apiVersions": [],
}


def _make_lro_operation(options):
    code_model = CodeModel(
        {"clients": [_CLIENT_YAML], "namespace": "namespace"},
        options={
            "show-send-request": True,
            "builders-visibility": "public",
            "show-operations": True,
            "version-tolerant": True,
            **options,
        },
    )
    client = Client(_CLIENT_YAML, code_model, parameters=[])
    request_builder = RequestBuilder(
        yaml_data=_OPERATION_YAML,
        client=client,
        code_model=code_model,
        name="create",
        parameters=RequestBuilderParameterList({}, code_model, parameters=[]),
    )
    operation = LROOperation(
        yaml_data=_OPERATION_YAML,
        client=client,
        code_model=code_model,
        request_builder=request_builder,
        name="begin_create",
        parameters=ParameterList({}, code_model, []),
        responses=[],
        exceptions=[],
    )
    # The serializer reaches these through ``builder.lro_response``, which is
    # an LROResponse in a real code model rather than a plain Response.
    operation.responses = [
        LROResponse(
            yaml_data={
                "statusCodes": [200],
                "pollerSync": "azure.core.polling.LROPoller",
                "pollerAsync": "azure.core.polling.AsyncLROPoller",
                "pollingMethodSync": "azure.core.polling.base_polling.LROBasePolling",
                "pollingMethodAsync": "azure.core.polling.async_base_polling.AsyncLROBasePolling",
            },
            code_model=code_model,
            headers=[],
            type=StringType({"type": "string"}, code_model),
        )
    ]
    return code_model, operation


class _FakeHttpResponse:
    def __init__(self, body):
        self.content = json.dumps(body).encode()
        self._body = body

    def json(self):
        return self._body

    def text(self):
        return self._body


class _FakePipelineResponse:
    def __init__(self, body):
        self.http_response = _FakeHttpResponse(body)


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize(
    "options",
    [
        # 'models-mode: none' with TypedDict generation (TypeSpec)
        {"models-mode": None, "generate-typeddict": True, "tsp_file": True},
        {"models-mode": None},
        {"models-mode": "dpg"},
    ],
)
def test_long_running_output_binds_response_before_using_it(options, async_mode):
    code_model, operation = _make_lro_operation(options)
    serializer = LROOperationSerializer(code_model, async_mode=async_mode, client_namespace="blah")

    lines = serializer.get_long_running_output(operation)
    source = "\n".join(lines)
    uses_response = any("response." in line and "pipeline_response." not in line for line in lines)
    if uses_response:
        assert "    response = pipeline_response.http_response" in lines

    # The generated callback must run without a NameError for an unbound ``response``.
    namespace = {"cls": None, "_deserialize": lambda _type, value, *args, **kwargs: value}
    exec(compile(source, "<generated>", "exec"), namespace)  # pylint: disable=exec-used
    assert namespace["get_long_running_output"](_FakePipelineResponse("done")) == "done"
