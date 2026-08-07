# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import asyncio
from contextlib import aclosing, closing
from types import ModuleType, SimpleNamespace

from jinja2 import Environment, PackageLoader

from pygen.codegen.models import Response
from pygen.codegen.serializers.builder_serializer import OperationSerializer
from pygen.codegen.serializers.general_serializer import GeneralSerializer


def _env() -> Environment:
    return Environment(
        loader=PackageLoader("pygen.codegen", "templates"),
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def _streaming_module() -> ModuleType:
    source = _env().get_template("streaming.py.jinja2").render(code_model=SimpleNamespace(license_header=""))
    module = ModuleType("streaming")
    exec(compile(source, "streaming.py", "exec"), module.__dict__)
    return module


class _SyncResponse:
    def __init__(self, chunks):
        self._chunks = chunks
        self.closed = False

    def iter_bytes(self):
        yield from self._chunks

    def close(self):
        self.closed = True


class _AsyncResponse:
    def __init__(self, chunks):
        self._chunks = chunks
        self.closed = False

    async def iter_bytes(self):
        for chunk in self._chunks:
            yield chunk

    async def close(self):
        self.closed = True


def test_jsonl_framing_handles_chunked_utf8_blank_and_trailing_lines():
    streaming = _streaming_module()
    response = _SyncResponse(
        [
            b"\n",
            b'{"name":"caf\xc3',
            b'\xa9"}\r\n  \r\n{"name":"last"}',
        ]
    )

    assert list(streaming._iter_jsonl(response)) == [
        '{"name":"caf\u00e9"}',
        '{"name":"last"}',
    ]


def test_sse_framing_handles_bom_crlf_comments_fields_and_eof_dispatch():
    streaming = _streaming_module()
    response = _SyncResponse(
        [
            b"\xef",
            b"\xbb\xbf: keepalive\r",
            b"\nevent: connected\rdata: first\r",
            b"\ndata: second\rid: 42\rretry: 1500\r\n\r",
            b"\nevent: message\ndata: trailing",
        ]
    )

    events = list(streaming._iter_sse(response))
    assert [(event.event, event.data, event.id, event.retry) for event in events] == [
        ("connected", "first\nsecond", "42", 1500),
        ("message", "trailing", "42", 1500),
    ]


def test_async_framing_matches_sync_behavior():
    async def run():
        streaming = _streaming_module()
        jsonl = _AsyncResponse([b'{"value":1}\n\n{"value":', b"2}"])
        sse = _AsyncResponse([b"data: one\n\n", b"event: two\ndata: two"])
        jsonl_records = [record async for record in streaming._aiter_jsonl(jsonl)]
        sse_events = [event async for event in streaming._aiter_sse(sse)]
        return jsonl_records, sse_events

    records, events = asyncio.run(run())
    assert records == ['{"value":1}', '{"value":2}']
    assert [(event.event, event.data) for event in events] == [
        ("message", "one"),
        ("two", "two"),
    ]


class _FakeType:
    type = "model"

    def __init__(self, name):
        self.name = name

    def type_annotation(self, **_kwargs):
        return f"_models.{self.name}"

    def docstring_text(self, **_kwargs):
        return self.name

    def docstring_type(self, **_kwargs):
        return f"~sample.models.{self.name}"

    def imports(self, **_kwargs):
        from pygen.codegen.models.imports import FileImport

        return FileImport(SimpleNamespace())


def _response(*, kind="sse", events=None, terminal="[DONE]"):
    response = Response(
        yaml_data={"statusCodes": [200]},
        code_model=SimpleNamespace(namespace="sample"),
        headers=[],
        type=_FakeType("Events"),
    )
    response.streaming_kind = kind
    response.streaming_events = events or []
    response._streaming_terminal_event = terminal
    return response


def test_structured_response_uses_standard_generator_annotations():
    response = _response(events=[("message", _FakeType("Message"))])

    assert response.type_annotation(async_mode=False) == ("Generator[_models.Message, None, None]")
    assert response.type_annotation(async_mode=True) == "AsyncGenerator[_models.Message, None]"
    assert response.docstring_type(async_mode=False) == ("Generator[~sample.models.Message, None, None]")
    assert "[DONE]" not in response.type_annotation(async_mode=False)
    assert "[DONE]" not in response.docstring_text(async_mode=False)


def _serializer(*, async_mode=False):
    code_model = SimpleNamespace(
        options={"version-tolerant": True},
        namespace="sample",
        core_library="azure.core",
        is_azure_flavor=True,
        get_serialize_namespace=lambda namespace, **_kwargs: namespace,
    )
    return OperationSerializer(code_model, async_mode=async_mode, client_namespace="sample")


def test_pipeline_forces_stream_and_consumes_conflicting_kwarg():
    serializer = _serializer()
    builder = SimpleNamespace(
        stream_value=True,
        has_structured_stream_response=True,
        group_name="operations",
    )

    source = "\n".join(serializer.make_pipeline_call(builder))
    assert "kwargs.pop('stream', None)" in source
    assert "_stream = True" in source
    assert "stream=_stream" in source


def test_sync_adapter_owns_deserialization_cls_dispatch_and_cleanup():
    serializer = _serializer()
    response = _response(
        events=[
            ("connected", _FakeType("Connected")),
            (None, _FakeType("Message")),
        ]
    )
    source = "\n".join(serializer.handle_structured_stream_response(SimpleNamespace(responses=[response])))

    assert "def _response_iterator() -> Generator[" in source
    assert "for _event in _iter_sse(response):" in source
    assert "json.loads(_event.data)" in source
    assert "_deserialize(_models.Connected" in source
    assert "_deserialize(_models.Message" in source
    assert "raise DeserializationError" not in source
    assert "finally:" in source
    assert "response.close()" in source
    assert source.count("cls(") == 1
    assert "return cls(pipeline_response, _response_generator, {})" in source


def test_async_adapter_is_strict_without_unnamed_fallback():
    serializer = _serializer(async_mode=True)
    response = _response(events=[("connected", _FakeType("Connected"))])
    source = "\n".join(serializer.handle_structured_stream_response(SimpleNamespace(responses=[response])))

    assert "async def _response_iterator() -> AsyncGenerator[" in source
    assert "async for _event in _aiter_sse(response):" in source
    assert "raise DeserializationError" in source
    assert "finally:" in source
    assert "await response.close()" in source
    assert source.count("cls(") == 1


def _compile_adapter(*, async_mode, response_model, http_response, serializer):
    adapter_source = serializer.handle_structured_stream_response(SimpleNamespace(responses=[response_model]))
    function_def = "async def" if async_mode else "def"
    source = [f"{function_def} operation(cls=None):"]
    source.extend(f"    {line}" if line else "" for line in adapter_source)
    streaming = _streaming_module()

    class DeserializationError(Exception):
        pass

    namespace = {
        "AsyncGenerator": __import__("typing").AsyncGenerator,
        "DeserializationError": DeserializationError,
        "Generator": __import__("typing").Generator,
        "_aiter_sse": streaming._aiter_sse,
        "_iter_sse": streaming._iter_sse,
        "_models": SimpleNamespace(Connected="Connected", Message="Message"),
        "_deserialize": lambda model, value: (model, value),
        "json": __import__("json"),
        "pipeline_response": SimpleNamespace(http_response=http_response),
        "response": http_response,
    }
    exec(compile("\n".join(source), "operation.py", "exec"), namespace)
    return namespace["operation"], DeserializationError


def test_sync_adapter_calls_cls_once_and_closes_on_partial_consumption():
    response = _response(events=[("connected", _FakeType("Connected"))])
    http_response = _SyncResponse(
        [
            b'event: connected\ndata: {"value": 1}\n\n',
            b'event: connected\ndata: {"value": 2}\n\n',
        ]
    )
    operation, _ = _compile_adapter(
        async_mode=False,
        response_model=response,
        http_response=http_response,
        serializer=_serializer(),
    )
    calls = []

    def cls(_pipeline_response, generator, _headers):
        calls.append(generator)
        return generator

    with closing(operation(cls)) as generator:
        assert next(generator) == ("Connected", {"value": 1})
    assert calls == [generator]
    assert http_response.closed


def test_sync_adapter_raises_for_unknown_named_event_and_closes():
    response = _response(events=[("connected", _FakeType("Connected"))])
    http_response = _SyncResponse([b'event: unknown\ndata: {"value": 1}\n\n'])
    operation, deserialization_error = _compile_adapter(
        async_mode=False,
        response_model=response,
        http_response=http_response,
        serializer=_serializer(),
    )

    try:
        list(operation())
    except deserialization_error:
        pass
    else:
        raise AssertionError("Unknown SSE event did not raise DeserializationError")
    assert http_response.closed


def test_async_adapter_calls_cls_once_and_closes_on_partial_consumption():
    async def run():
        response = _response(events=[("connected", _FakeType("Connected"))])
        http_response = _AsyncResponse(
            [
                b'event: connected\ndata: {"value": 1}\n\n',
                b'event: connected\ndata: {"value": 2}\n\n',
            ]
        )
        operation, _ = _compile_adapter(
            async_mode=True,
            response_model=response,
            http_response=http_response,
            serializer=_serializer(async_mode=True),
        )
        calls = []

        def cls(_pipeline_response, generator, _headers):
            calls.append(generator)
            return generator

        generator = await operation(cls)
        async with aclosing(generator):
            assert await anext(generator) == ("Connected", {"value": 1})
        return calls, generator, http_response

    calls, generator, http_response = asyncio.run(run())
    assert calls == [generator]
    assert http_response.closed


def test_private_streaming_helper_is_emitted_without_public_exports():
    code_model = SimpleNamespace(
        namespace="sample",
        license_header="",
        core_library="azure.core",
        options={"package-version": None},
        get_serialize_namespace=lambda namespace, async_mode: (f"{namespace}.aio" if async_mode else namespace),
        get_relative_import_path=lambda _namespace, module_name: f".{module_name}",
        is_top_namespace=lambda namespace: namespace == "sample",
    )
    client = SimpleNamespace(filename="_client", name="SampleClient")
    serializer = GeneralSerializer(code_model=code_model, env=_env(), async_mode=False)

    init_file = serializer.serialize_init_file([client])
    assert "Stream" not in init_file
    assert "AsyncStream" not in init_file
    assert "_iter_jsonl" in serializer.serialize_streaming_file()
