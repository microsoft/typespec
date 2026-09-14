# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from types import SimpleNamespace

import pytest

from pygen.codegen.models.response import (
    StreamingEvent,
    _get_terminal_event_names,
    get_streaming_event_discriminator,
)
from pygen.codegen.serializers.builder_serializer import (
    OperationSerializer,
    _sse_fallback_data_expression,
)


@pytest.fixture(scope="session", autouse=True)
def testserver():
    yield


def _streaming_event(event_type=None, *, is_terminal=False, payload_type=None):
    return StreamingEvent(
        event_type=event_type,
        payload_type=payload_type,  # type: ignore[arg-type]
        payload_content_type="application/json",
        is_terminal=is_terminal,
    )


def _discriminated_payload(value, annotation="Payload"):
    return SimpleNamespace(
        discriminator_property=SimpleNamespace(wire_name="kind"),
        discriminator_value=value,
        type_annotation=lambda **kwargs: annotation,
    )


def test_single_unnamed_terminal_event_uses_default_sse_event_name():
    events = [
        _streaming_event(is_terminal=True),
    ]

    assert _get_terminal_event_names(events) == ["message"]


def test_multiple_unnamed_events_cannot_identify_terminal_by_event_name():
    events = [
        _streaming_event(),
        _streaming_event(is_terminal=True),
    ]

    assert _get_terminal_event_names(events) == []


def test_multiple_unnamed_events_expose_common_discriminator():
    connected = _streaming_event(payload_type=_discriminated_payload("connected"))
    disconnected = _streaming_event(
        payload_type=_discriminated_payload("disconnected"),
        is_terminal=True,
    )

    assert get_streaming_event_discriminator([connected, disconnected]) == (
        "kind",
        [("connected", connected), ("disconnected", disconnected)],
    )


def test_inconsistent_unnamed_discriminators_are_ambiguous():
    events = [
        _streaming_event(payload_type=_discriminated_payload("connected")),
        _streaming_event(payload_type=SimpleNamespace(discriminator_property=None)),
    ]

    assert get_streaming_event_discriminator(events) is None


@pytest.mark.parametrize(
    ("async_mode", "stream_class"),
    [(False, "Stream"), (True, "AsyncStream")],
)
def test_generated_unnamed_discriminator_dispatch_and_terminal_predicate(async_mode, stream_class):
    connected = _streaming_event(payload_type=_discriminated_payload("connected", "_models.Connected"))
    disconnected = _streaming_event(
        payload_type=_discriminated_payload("disconnected", "_models.Disconnected"),
        is_terminal=True,
    )
    response = SimpleNamespace(
        is_structured_stream=True,
        streaming_kind="sse",
        streaming_events=[connected, disconnected],
        terminal_event=None,
        terminal_event_names=[],
        stream_item_annotation=lambda **kwargs: "Union[_models.Connected, _models.Disconnected]",
        stream_class_name=lambda is_async: "AsyncStream" if is_async else "Stream",
    )
    code_model = SimpleNamespace(
        options={"models-mode": "dpg"},
        get_serialize_namespace=lambda *args, **kwargs: "test",
    )
    serializer = OperationSerializer(code_model, async_mode=async_mode, client_namespace="test")

    generated = "\n".join(serializer.handle_structured_stream_response(SimpleNamespace(responses=[response])))

    assert ("if isinstance(_event_json, dict) and " "_event_json.get('kind') == 'connected':") in generated
    assert "_deserialize(_models.Connected, _event_json)" in generated
    assert ("elif isinstance(_event_json, dict) and " "_event_json.get('kind') == 'disconnected':") in generated
    assert "_deserialize(_models.Disconnected, _event_json)" in generated
    assert "def _is_terminal_event(_event):" in generated
    assert "_event_json.get('kind') in ['disconnected']" in generated
    assert f"deserialized: {stream_class}[" in generated
    assert "terminal_event_predicate=_is_terminal_event" in generated
    assert generated.count("return cls(pipeline_response, deserialized, {})") == 1
    assert 'raise ValueError(f"Unknown SSE event type: {_event.event!r}")' in generated
    assert not any(line.strip().startswith("_event.event =") for line in generated.splitlines())


def test_named_terminal_event_uses_explicit_event_name():
    events = [
        _streaming_event("progress"),
        _streaming_event("complete", is_terminal=True),
    ]

    assert _get_terminal_event_names(events) == ["complete"]


@pytest.mark.parametrize(
    ("content_types", "expected"),
    [
        ([], "_event.data"),
        (["application/json", "application/vnd.example+json"], "json.loads(_event.data)"),
        (["text/plain", "text/csv"], "_event.data"),
        (["application/json", "text/plain"], "_event.data"),
    ],
)
def test_sse_fallback_data_expression(content_types, expected):
    events = [SimpleNamespace(payload_content_type=content_type) for content_type in content_types]

    assert _sse_fallback_data_expression(events) == expected
