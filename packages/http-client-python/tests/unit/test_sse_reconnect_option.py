# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import asyncio
import inspect
from types import ModuleType, SimpleNamespace

import pytest
from jinja2 import Environment, PackageLoader

from pygen import OptionsDict
from pygen.codegen.models import CodeModel
from pygen.codegen.models.response import Response
from pygen.codegen.serializers.builder_serializer import OperationSerializer
from pygen.codegen.serializers.general_serializer import GeneralSerializer


@pytest.fixture(params=["azure", "unbranded"])
def flavor(request):
    return request.param


@pytest.fixture(params=[{}, {"enable-sse-reconnect": False}, {"enable-sse-reconnect": True}])
def reconnect_options(request):
    return request.param


@pytest.fixture
def code_model(flavor, reconnect_options):
    return CodeModel(
        {
            "namespace": "test",
            "clients": [{"name": "Client", "namespace": "test", "parameters": [], "url": "", "operationGroups": []}],
        },
        options=OptionsDict({"flavor": flavor, "models-mode": "dpg", **reconnect_options}),
    )


@pytest.fixture
def runtime(code_model):
    env = Environment(loader=PackageLoader("pygen.codegen", "templates"), trim_blocks=True, lstrip_blocks=True)
    source = GeneralSerializer(code_model=code_model, env=env).serialize_streaming_base_file()
    module = ModuleType("generated_streaming")
    exec(compile(source, "<generated streaming runtime>", "exec"), module.__dict__)
    return SimpleNamespace(module=module, source=source)


class FakeResponse:
    def __init__(self, body, *, content_type="text/event-stream", status_code=200, error=None):
        self.headers = {"Content-Type": content_type}
        self.body = body
        self.status_code = status_code
        self.error = error
        self.closed = False
        self.byte_iterator_closed = False

    def iter_bytes(self):
        try:
            for index in range(0, len(self.body), 7):
                yield self.body[index : index + 7]
            if self.error:
                raise self.error
        finally:
            self.byte_iterator_closed = True

    def close(self):
        self.closed = True


class AsyncFakeResponse(FakeResponse):
    async def iter_bytes(self):
        try:
            for chunk in super().iter_bytes():
                yield chunk
        finally:
            self.byte_iterator_closed = True

    async def close(self):
        self.closed = True


def _consume(runtime, body, *, async_mode=False, stream_kwargs=None, response_kwargs=None):
    async def consume_async():
        response = AsyncFakeResponse(body, **(response_kwargs or {}))
        stream = runtime.module.AsyncStream(
            response=response,
            deserialization_callback=lambda _response, event: event,
            **(stream_kwargs or {}),
        )
        return [event async for event in stream], stream, response

    if async_mode:
        return asyncio.run(consume_async())
    response = FakeResponse(body, **(response_kwargs or {}))
    stream = runtime.module.Stream(
        response=response,
        deserialization_callback=lambda _response, event: event,
        **(stream_kwargs or {}),
    )
    return list(stream), stream, response


def test_runtime_reconnect_support_is_generated_only_when_enabled(runtime, reconnect_options):
    enabled = reconnect_options.get("enable-sse-reconnect", False)
    for name in ["Stream", "AsyncStream"]:
        parameters = inspect.signature(getattr(runtime.module, name)).parameters
        assert ("reconnect_callback" in parameters) is enabled
        assert ("last_event_id" in parameters) is enabled
    for name in ["SSEDecoder", "AsyncSSEDecoder"]:
        assert ("last_event_id" in inspect.signature(getattr(runtime.module, name)).parameters) is enabled
    for symbol in ["_read_sse_response", "_read_sse_response_async", "_update_sse_request_headers", "HttpRequest"]:
        assert hasattr(runtime.module, symbol) is enabled
    if not enabled:
        assert "reconnect_callback" not in runtime.source
        assert "reconnect_delay" not in runtime.source
        assert "Last-Event-ID" not in runtime.source


@pytest.mark.parametrize("async_mode", [False, True])
def test_normal_sse_eof_keeps_metadata_and_closes(runtime, async_mode):
    events, stream, response = _consume(
        runtime, b"id: first\nretry: 1000\ndata: one\n\ndata: two\n\n", async_mode=async_mode
    )
    assert [event.data for event in events] == ["one", "two"]
    assert [event.id for event in events] == ["first", "first"]
    assert [event.retry for event in events] == [1000, 1000]
    assert stream.last_event_id == "first"
    assert stream.retry == 1000
    assert response.closed
    assert response.byte_iterator_closed


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize(
    ("body", "kwargs", "expected"),
    [
        (b"data: one\n\ndata: [DONE]\n\ndata: after\n\n", {"terminal_event": "[DONE]"}, ["one"]),
        (
            b"event: complete\ndata: done\n\ndata: after\n\n",
            {"terminal_event_names": ["complete"]},
            ["done"],
        ),
        (
            b"data: done\n\ndata: after\n\n",
            {"terminal_event_predicate": lambda event: event.data == "done"},
            ["done"],
        ),
    ],
)
def test_terminal_events_are_preserved(runtime, async_mode, body, kwargs, expected):
    events, _, response = _consume(runtime, body, async_mode=async_mode, stream_kwargs=kwargs)
    assert [event.data for event in events] == expected
    assert response.closed
    assert response.byte_iterator_closed


@pytest.mark.parametrize("async_mode", [False, True])
def test_transport_error_propagates_without_reconnect(runtime, async_mode):
    response = (AsyncFakeResponse if async_mode else FakeResponse)(b"data: one\n\n", error=OSError("disconnected"))

    async def consume_async():
        stream = runtime.module.AsyncStream(response=response, deserialization_callback=lambda _response, event: event)
        return [event async for event in stream]

    with pytest.raises(OSError, match="disconnected"):
        if async_mode:
            asyncio.run(consume_async())
        else:
            list(runtime.module.Stream(response=response, deserialization_callback=lambda _response, event: event))
    assert response.closed
    assert response.byte_iterator_closed


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize("started", [False, True])
def test_explicit_close_releases_response(runtime, async_mode, started):
    response = (AsyncFakeResponse if async_mode else FakeResponse)(b"data: one\n\ndata: two\n\n")

    async def consume_async():
        stream = runtime.module.AsyncStream(response=response, deserialization_callback=lambda _response, event: event)
        if started:
            await stream.__anext__()
        await stream.close()

    if async_mode:
        asyncio.run(consume_async())
    else:
        stream = runtime.module.Stream(response=response, deserialization_callback=lambda _response, event: event)
        if started:
            next(stream)
        stream.close()
    assert response.closed
    if started:
        assert response.byte_iterator_closed


@pytest.mark.parametrize("async_mode", [False, True])
def test_jsonl_is_unchanged(runtime, async_mode):
    events, _, response = _consume(
        runtime,
        b'{"message": "one"}\n{"message": "two"}\n',
        async_mode=async_mode,
        response_kwargs={"content_type": "application/jsonl"},
    )
    assert [event.json() for event in events] == [{"message": "one"}, {"message": "two"}]
    assert response.closed


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize("kind", ["sse", "jsonl", None])
def test_initial_request_resumption_is_gated(code_model, reconnect_options, async_mode, kind, monkeypatch):
    serializer = OperationSerializer(code_model, async_mode=async_mode, client_namespace="test")
    monkeypatch.setattr(
        serializer, "_call_request_builder_helper", lambda *args, **kwargs: ["_request = build_request()"]
    )
    builder = SimpleNamespace(
        request_builder=object(),
        has_structured_stream_response=kind is not None,
        responses=[SimpleNamespace(streaming_kind=kind)],
    )
    generated = "\n".join(serializer.call_request_builder(builder))
    enabled = reconnect_options.get("enable-sse-reconnect", False) and kind == "sse"
    assert ('kwargs.pop("last_event_id", None)' in generated) is enabled
    assert ("Last-Event-ID" in generated) is enabled


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize("kind", ["sse", "jsonl"])
def test_reconnect_only_operation_imports_are_gated(code_model, reconnect_options, async_mode, kind):
    response = Response({"statusCodes": [200], "streaming": {"kind": kind}}, code_model)
    imports = response.imports(async_mode=async_mode).imports
    names = {item.submodule_name for item in imports}
    enabled = reconnect_options.get("enable-sse-reconnect", False) and kind == "sse"
    assert ("_update_sse_request_headers" in names) is enabled
    assert (("_read_sse_response_async" if async_mode else "_read_sse_response") in names) is enabled
    assert ("AsyncStream" if async_mode else "Stream") in names


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize("metadata, expected", [(b"", ("", 3.0)), (b"id: first\nretry: 1000\n", ("first", 1.0))])
@pytest.mark.parametrize("reconnect_options", [{"enable-sse-reconnect": True}])
def test_enabled_reconnect_resumes_and_stops_at_204(runtime, reconnect_options, async_mode, metadata, expected):
    calls = []
    first = (AsyncFakeResponse if async_mode else FakeResponse)(metadata + b"data: one\n\n")
    second = (AsyncFakeResponse if async_mode else FakeResponse)(b"", status_code=204)

    def reconnect(last_event_id, delay):
        calls.append((last_event_id, delay))
        return second

    async def reconnect_async(last_event_id, delay):
        return reconnect(last_event_id, delay)

    async def consume_async():
        stream = runtime.module.AsyncStream(
            response=first,
            deserialization_callback=lambda _response, event: event.data,
            reconnect_callback=reconnect_async,
        )
        return [event async for event in stream]

    if async_mode:
        items = asyncio.run(consume_async())
    else:
        items = list(
            runtime.module.Stream(
                response=first,
                deserialization_callback=lambda _response, event: event.data,
                reconnect_callback=reconnect,
            )
        )
    assert items == ["one"]
    assert calls == [expected]
    assert first.closed and second.closed
