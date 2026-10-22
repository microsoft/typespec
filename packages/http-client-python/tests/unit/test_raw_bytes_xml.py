# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import asyncio
from types import SimpleNamespace

import pytest
from jinja2 import Environment, PackageLoader

from pygen import OptionsDict
from pygen.codegen.models import CodeModel, Operation, ParameterList, RequestBuilder, Response
from pygen.codegen.models.primitive_types import ByteArraySchema
from pygen.codegen.models.parameter_list import RequestBuilderParameterList
from pygen.codegen.serializers.builder_serializer import OperationSerializer


@pytest.fixture(scope="session", autouse=True)
def testserver():
    yield


@pytest.fixture(params=["azure", "unbranded"])
def operation(request):
    code_model = CodeModel(
        {
            "namespace": "test",
            "clients": [{"name": "Client", "namespace": "test", "parameters": [], "url": "", "operationGroups": []}],
        },
        options=OptionsDict(
            {"flavor": request.param, "models-mode": "dpg", "version-tolerant": True, "builders-visibility": "public"}
        ),
    )
    client = code_model.clients[0]
    yaml_data = {
        "url": "/profile",
        "method": "POST",
        "groupName": "WebApps",
        "apiVersions": [],
        "isOverload": False,
        "exposeStreamKeyword": True,
    }
    bytes_type = {"type": "bytes", "encode": "bytes"}
    code_model.types_map[id(bytes_type)] = ByteArraySchema(bytes_type, code_model)
    response = Response.from_yaml(
        {"statusCodes": [200], "defaultContentType": "application/xml", "headers": [], "type": bytes_type},
        code_model,
    )
    return Operation(
        yaml_data,
        code_model,
        client,
        "list_publishing_profile_xml_with_secrets",
        RequestBuilder(
            yaml_data,
            code_model,
            client,
            "build_profile_request",
            RequestBuilderParameterList({}, code_model, parameters=[]),
        ),
        ParameterList({}, code_model, parameters=[]),
        responses=[response],
        exceptions=[],
    )


@pytest.mark.parametrize("async_mode", [False, True])
def test_raw_bytes_xml_signature_and_default_streaming(operation, async_mode):
    operation.include_documentation = False
    serializer = OperationSerializer(operation.code_model, async_mode=async_mode, client_namespace="test")
    env = Environment(loader=PackageLoader("pygen.codegen", "templates"), trim_blocks=True, lstrip_blocks=True)
    generated = env.get_template("operation.py.jinja2").render(operation=operation, operation_serializer=serializer)

    assert f"-> {'AsyncIterator' if async_mode else 'Iterator'}[bytes]:" in generated
    assert ("async def list_publishing_profile_xml_with_secrets" in generated) == async_mode
    assert '_stream = kwargs.pop("stream", True)' in generated
    assert "deserialized = response.iter_bytes() if _decompress else response.iter_raw()" in generated
    assert "_deserialize_xml" not in generated
    compile(generated, "<generated raw XML operation>", "exec")


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize("decompress", [False, True])
@pytest.mark.parametrize(
    "body",
    [
        b'<publishData><publishProfile profileName="example" publishMethod="MSDeploy" /></publishData>',
        b'<?xml version="1.0"?>\n<publishData>\n  <publishProfile profileName="example" publishMethod="MSDeploy" />\n</publishData>',
    ],
)
def test_raw_bytes_xml_preserves_document(operation, async_mode, decompress, body):
    serializer = OperationSerializer(operation.code_model, async_mode=async_mode, client_namespace="test")
    deserialization = serializer.response_deserialization(operation, operation.responses[0])
    source = "\n".join(
        [
            f"{'async ' if async_mode else ''}def deserialize(response, **kwargs):",
            f"    _stream = {operation.stream_value}",
            f"    _decompress = {decompress}",
            *[f"    {line}" for line in deserialization],
            "    return deserialized",
        ]
    )
    namespace = {}
    exec(compile(source, "<generated raw XML deserialization>", "exec"), namespace)

    chunks = [body[index : index + 7] for index in range(0, len(body), 7)]

    async def async_chunks():
        for chunk in chunks:
            yield chunk

    def stream():
        return async_chunks() if async_mode else iter(chunks)

    response = SimpleNamespace(iter_bytes=stream, iter_raw=stream)

    async def consume():
        result = await namespace["deserialize"](response)
        return b"".join([chunk async for chunk in result])

    result = asyncio.run(consume()) if async_mode else b"".join(namespace["deserialize"](response))
    assert result == body
