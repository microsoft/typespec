# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pathlib import Path
import subprocess
import sys

import pytest
from jinja2 import Environment, PackageLoader

from pygen import OptionsDict
from pygen.codegen.models import CodeModel, Operation, ParameterList, RequestBuilder, Response
from pygen.codegen.models.parameter import BodyParameter, Parameter
from pygen.codegen.models.parameter_list import RequestBuilderParameterList
from pygen.codegen.models.primitive_types import StringType
from pygen.codegen.models.request_builder_parameter import RequestBuilderBodyParameter, RequestBuilderParameter
from pygen.codegen.models.response import StreamingEvent
from pygen.codegen.serializers.builder_serializer import OperationSerializer


@pytest.fixture(scope="session", autouse=True)
def testserver():
    yield


def _operation(streaming_kind, *, is_overload=False, reconnect=False):
    code_model = CodeModel(
        {
            "namespace": "test",
            "clients": [{"name": "Client", "namespace": "test", "parameters": [], "url": "", "operationGroups": []}],
        },
        options=OptionsDict(
            {
                "flavor": "azure",
                "models-mode": "dpg",
                "version-tolerant": True,
                "builders-visibility": "public",
                "enable-sse-reconnect": reconnect,
            }
        ),
    )
    client = code_model.clients[0]
    yaml_data = {
        "url": "/retrieve",
        "method": "POST",
        "groupName": "KnowledgeBase",
        "isOverload": is_overload,
        "apiVersions": [],
    }
    payload = StringType({"type": "string"}, code_model)
    body_data = {
        "clientName": "request",
        "wireName": "request",
        "location": "body",
        "optional": False,
        "implementation": "Method",
        "contentTypes": ["application/json"],
        "defaultContentType": "application/json",
    }
    content_type_data = {
        "clientName": "content_type",
        "wireName": "Content-Type",
        "location": "header",
        "optional": True,
        "implementation": "Method",
    }
    request_builder = RequestBuilder(
        yaml_data,
        code_model,
        client,
        "build_retrieve_stream_request",
        RequestBuilderParameterList(
            {},
            code_model,
            parameters=[RequestBuilderParameter(content_type_data, code_model, payload)],
            body_parameter=RequestBuilderBodyParameter(body_data, code_model, payload),
        ),
    )
    response_data = {"statusCodes": [200]}
    if streaming_kind:
        response_data["streaming"] = {"kind": streaming_kind}
    response = Response(response_data, code_model, type=payload)
    if streaming_kind == "sse":
        response.streaming_events = [
            StreamingEvent(
                event_type=f"event-{index}",
                payload_type=payload,
                payload_content_type="application/json",
                is_terminal=False,
            )
            for index in range(10)
        ]
    return Operation(
        yaml_data,
        code_model,
        client,
        "retrieve_stream",
        request_builder,
        ParameterList(
            {},
            code_model,
            [Parameter(content_type_data, code_model, payload)],
            body_parameter=BodyParameter(body_data, code_model, payload),
        ),
        responses=[response],
        exceptions=[],
    )


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize("streaming_kind", [None, "sse", "jsonl"])
@pytest.mark.parametrize("is_overload", [False, True])
def test_statement_limit_suppression_is_scoped_to_structured_implementations(async_mode, streaming_kind, is_overload):
    operation = _operation(streaming_kind, is_overload=is_overload)
    serializer = OperationSerializer(operation.code_model, async_mode=async_mode, client_namespace="test")

    signature = serializer.method_signature_and_response_type_annotation(operation)

    assert ("too-many-statements" in signature) == (streaming_kind is not None and not is_overload)
    assert ("@overload" in signature) == is_overload
    assert ("async def retrieve_stream" in signature) == async_mode


def _statement_limit_messages(path):
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pylint",
            "--rcfile",
            str(Path(__file__).parents[2] / "eng" / "scripts" / "ci" / "config" / "pylintrc"),
            "--disable=all",
            "--enable=too-many-statements",
            "--max-statements=50",
            "--score=no",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode in (0, 8), result.stdout + result.stderr
    return result.stdout


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize("reconnect", [False, True])
def test_generated_sse_operation_passes_statement_limit(tmp_path, async_mode, reconnect):
    operation = _operation("sse", reconnect=reconnect)
    operation.include_documentation = False
    serializer = OperationSerializer(operation.code_model, async_mode=async_mode, client_namespace="test")
    env = Environment(loader=PackageLoader("pygen.codegen", "templates"), trim_blocks=True, lstrip_blocks=True)
    generated = env.get_template("operation.py.jinja2").render(
        operation=operation,
        operation_serializer=serializer,
    )
    compile(generated, "<generated SSE operation>", "exec")
    path = tmp_path / "operations.py"
    path.write_text(generated, encoding="utf-8")

    # Removing only the directive must reproduce the original lint failure.
    without_suppression = generated.replace("  # pylint: disable=too-many-statements", "")
    path.write_text(without_suppression, encoding="utf-8")
    messages = _statement_limit_messages(path)
    assert f"Too many statements ({65 if reconnect else 54}/50)" in messages
    assert "too-many-statements" in messages

    path.write_text(generated, encoding="utf-8")
    assert "too-many-statements" in generated
    assert "too-many-statements" not in _statement_limit_messages(path)
