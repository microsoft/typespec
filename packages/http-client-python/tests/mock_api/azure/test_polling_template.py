# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
import json

import pytest
from azure.core.pipeline import PipelineContext, PipelineResponse
from azure.core.pipeline.transport import HttpRequest
from azure.core.polling.base_polling import BadStatus
from azure.core.utils import case_insensitive_dict
from jinja2 import Environment, FileSystemLoader, StrictUndefined

from pygen import OptionsDict
from pygen.codegen.models import CodeModel, build_type
from pygen.codegen.models.lro_operation import LROOperationBase
from pygen.codegen.models.response import LROResponse
from pygen.codegen.serializers.builder_serializer import LROOperationSerializer


@pytest.fixture(scope="session", autouse=True)
def testserver():
    yield


@pytest.fixture(params=[False, True], ids=["data-plane", "arm"])
def polling(request):
    env = Environment(
        loader=FileSystemLoader(Path(__file__).parents[3] / "generator/pygen/codegen/templates"),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    namespace = {}
    exec(
        env.get_template("polling.py.jinja2").render(
            code_model=SimpleNamespace(license_header="", options={"azure-arm": request.param})
        ),
        namespace,
    )
    return SimpleNamespace(**namespace)


def response(body, headers=None, status_code=200):
    return SimpleNamespace(
        json=lambda: body,
        content=b"json" if body is not None else b"",
        headers=headers or {},
        status_code=status_code,
    )


def test_latest_metadata_replaces_missing_and_changed_values(polling):
    state = polling._LroMetadata({k: [k] for k in ("progress", "errors")}, deserialize_monitor=lambda body: body)
    assert state.details == {"progress": None, "errors": None}
    state.update(response({"progress": 10}))
    assert state.details == {"progress": 10, "errors": None}
    for terminal_state in ("Failed", "Canceled"):
        state.update(response({"status": terminal_state, "errors": ["item error"]}))
        assert state.details == {"progress": None, "errors": ["item error"]}
    state.update(response(None))
    assert state.details == {"progress": None, "errors": None}


def test_monitor_is_deserialized_once_and_selected_client_properties_are_preserved(polling):
    calls = []

    def deserialize(body):
        calls.append(body)
        return SimpleNamespace(
            operation_id=body["metadataId"],
            progress=SimpleNamespace(completed=body["progress"]["done"]),
            server_id=body["serverId"],
        )

    state = polling._LroMetadata(
        {"operation_id": ["operation_id"], "completed": ["progress", "completed"]},
        deserialize_monitor=deserialize,
        operation_id_path=["server_id"],
    )
    state.update(response({"metadataId": "metadata", "progress": {"done": 2}, "serverId": "server"}))
    assert len(calls) == 1
    assert state.details == {"operation_id": "metadata", "completed": 2}
    assert state.operation_id == "server"


def test_metadata_decode_errors_preserve_last_snapshot(polling, caplog):
    def deserialize(body):
        if body.get("bad"):
            raise ValueError("invalid monitor value")
        return body

    state = polling._LroMetadata({"progress": ["progress"]}, deserialize_monitor=deserialize)
    state.update(response({"progress": 1}))
    invalid_json = response({})
    invalid_json.json = lambda: json.loads("not json")
    state.update(invalid_json)
    state.update(response({"bad": True}))
    assert state.details == {"progress": 1}
    assert "metadata" in caplog.text.lower()
    state.update(response({"progress": 2}))
    assert state.details == {"progress": 2}


@pytest.mark.asyncio
@pytest.mark.parametrize("async_mode", [False, True], ids=["sync", "async"])
async def test_non_success_poll_preserves_last_metadata(polling, monkeypatch, async_mode):
    state = polling._LroMetadata({"progress": ["progress"]}, deserialize_monitor=lambda body: body)
    state.update(response({"progress": 1}))
    cls = polling._AsyncMetadataPolling if async_mode else polling._MetadataPolling
    method = cls(0, lro_metadata=state)
    method._operation = SimpleNamespace(get_polling_url=lambda: POLL_URL)
    failed_response = pipeline_response({"error": "failed"})
    failed_response.http_response.status_code = 400
    if async_mode:

        async def request_status(*args, **kwargs):
            return failed_response

    else:

        def request_status(*args, **kwargs):
            return failed_response

    monkeypatch.setattr(cls.__mro__[1], "request_status", request_status)
    with pytest.raises(BadStatus):
        result = method.update_status()
        if async_mode:
            await result
    assert state.details == {"progress": 1}


@pytest.mark.asyncio
@pytest.mark.parametrize("async_mode", [False, True], ids=["sync", "async"])
async def test_metadata_decode_error_does_not_fail_polling(polling, monkeypatch, caplog, async_mode):
    def deserialize(body):
        if body.get("bad"):
            raise ValueError("invalid monitor metadata")
        return body

    state = polling._LroMetadata({"progress": ["progress"]}, deserialize_monitor=deserialize)
    state.update(response({"progress": 1}))
    cls = polling._AsyncMetadataPolling if async_mode else polling._MetadataPolling
    method = cls(0, lro_metadata=state)
    method._operation = SimpleNamespace(get_polling_url=lambda: POLL_URL, get_status=lambda _: "Succeeded")
    response_mock = AsyncMock if async_mode else Mock
    monkeypatch.setattr(
        cls.__mro__[1],
        "request_status",
        response_mock(return_value=pipeline_response({"status": "Succeeded", "bad": True})),
    )

    result = method.update_status()
    if async_mode:
        await result
    assert method.status() == "Succeeded"
    assert state.details == {"progress": 1}
    assert "metadata" in caplog.text.lower()


@pytest.mark.parametrize("location", ["ResponseHeader", "ResponseBody", "Self"])
def test_selected_uri_segment_and_body_precedence(polling, location):
    state = polling._LroMetadata(
        {},
        deserialize_monitor=lambda body: body,
        operation_id_path=["wire-id"],
        operation_id_uri={
            "location": location,
            "property": "monitor",
            "pattern": r"/operations/(?P<operation_id>[^/]+)/status/?$",
        },
    )
    url = "https://example.test/prefix/operations/uri%20id/status?api-version=1#fragment"
    initial = response(url if location == "Self" else {"monitor": url}, {"monitor": url})
    state.initialize(initial)
    assert state.operation_id == "uri id"
    state.update(response({"wire-id": "body-id"}))
    assert state.operation_id == "body-id"
    state.update(response({"wire-id": None}))
    assert state.operation_id == "uri id"
    assert state.details["operation_id"] == "uri id"


def test_unmatched_uri_does_not_invent_an_operation_id(polling):
    state = polling._LroMetadata(
        {},
        deserialize_monitor=lambda body: body,
        operation_id_uri={
            "location": "ResponseHeader",
            "property": "Operation-Location",
            "pattern": r"/operations/(?P<operation_id>[^/]+)/status/?$",
        },
    )
    state.initialize(response(None, {"Operation-Location": "https://example.test/unrelated"}))
    assert state.operation_id is None


def test_initial_monitor_and_rehydration(polling):
    state = polling._LroMetadata(
        {"progress": ["progress"]}, deserialize_monitor=lambda body: body, initial_response_is_monitor=True
    )
    state.initialize(response({"progress": 1}))
    assert state.details == {"progress": 1}
    resumed = polling._LroMetadata(
        {"progress": ["progress"]}, deserialize_monitor=lambda body: body, initial_response_is_monitor=True
    )
    resumed.rehydrated = True
    resumed.initialize(response({"progress": 1}))
    assert resumed.details == {"progress": None}
    resumed.update(response({"progress": 2}))
    assert resumed.details == {"progress": 2}


POLL_URL = "https://example.test/operations/uri%20id/status?api-version=1&token=opaque"
FINAL_URL = "https://example.test/result"


class _HttpResponse:
    def __init__(self, request, body, initial):
        self.content = json.dumps(body).encode()
        self.request = request
        self.status_code = 202 if initial else 200
        self.reason = "Accepted" if initial else "OK"
        self.headers = case_insensitive_dict(
            {"Operation-Location": POLL_URL, "Azure-AsyncOperation": POLL_URL, "Location": FINAL_URL} if initial else {}
        )

    def json(self):
        return json.loads(self.content)

    def body(self):
        return self.content

    def text(self):
        return self.content.decode()


def pipeline_response(body, *, initial=False):
    request = HttpRequest(
        "POST" if initial else "GET",
        "https://example.test/start" if initial else POLL_URL,
        headers={"x-ms-client-request-id": "request-id"},
    )
    http_response = _HttpResponse(request, body, initial)
    return PipelineResponse(request, http_response, PipelineContext(None))


def metadata_state(polling):
    return polling._LroMetadata(
        {"progress": ["progress"]},
        deserialize_monitor=lambda body: body,
        operation_id_path=["id"],
        operation_id_uri={
            "location": "ResponseHeader",
            "property": "Operation-Location",
            "pattern": r"/operations/(?P<operation_id>[^/]+)/status/?$",
        },
        initial_response_is_monitor=True,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("async_mode", [False, True], ids=["sync", "async"])
async def test_final_get_at_polling_url_preserves_monitor_metadata(polling, async_mode):
    urls = []
    bodies = iter([{"status": "Succeeded", "progress": 2, "id": "body-id"}, {"final": True}])

    def run_sync(request, **kwargs):
        urls.append(request.url)
        return pipeline_response(next(bodies))

    async def run_async(request, **kwargs):
        return run_sync(request, **kwargs)

    run = run_async if async_mode else run_sync
    client = SimpleNamespace(
        send_request=run,
        get=lambda url: HttpRequest("GET", url),
        _pipeline=SimpleNamespace(run=run, _transport=SimpleNamespace(sleep=lambda _: None)),
    )
    initial = pipeline_response({"status": "Running", "progress": 0}, initial=True)
    initial.http_response.headers["Location"] = POLL_URL
    state = metadata_state(polling)
    method_class = polling._AsyncMetadataPolling if async_mode else polling._MetadataPolling
    poller_class = polling.AsyncMetadataLROPoller if async_mode else polling.MetadataLROPoller
    poller = poller_class(
        client,
        initial,
        lambda value: value.http_response.json(),
        method_class(0, lro_metadata=state),
        lro_metadata=state,
    )

    result = await poller.result() if async_mode else poller.result()
    assert result == {"final": True}
    assert urls == [POLL_URL, POLL_URL]
    assert poller.details == {"progress": 2, "operation_id": "body-id"}


class _TestLROOperationSerializer(LROOperationSerializer):
    def response_headers_and_deserialization(self, builder, response):
        return ["deserialized = response.json()"]


@pytest.mark.parametrize("models_mode", [None, "dpg"])
@pytest.mark.parametrize("generate_typeddict_only", [False, True])
def test_lro_response_is_available_for_deserialization(models_mode, generate_typeddict_only):
    code_model = SimpleNamespace(
        options={"models-mode": models_mode},
        generate_typeddict_only=generate_typeddict_only,
        get_serialize_namespace=lambda *args, **kwargs: "test",
    )
    serializer = _TestLROOperationSerializer(code_model, async_mode=False, client_namespace="test")
    operation = SimpleNamespace(
        lro_response=SimpleNamespace(headers=[], type=object()),
    )

    generated = serializer.get_long_running_output(operation)

    assert "    response = pipeline_response.http_response" in generated
    assert "    deserialized = response.json()" in generated


@pytest.mark.parametrize(
    "models_mode, expected",
    [("dpg", ["parent_", "class_"]), ("msrest", ["parent_", "class_"]), ("none", ["wire.parent", "wire.class"])],
)
def test_monitor_metadata_paths_use_model_names_or_wire_names(models_mode, expected):
    code_model = CodeModel(
        {
            "namespace": "sample",
            "clients": [
                {
                    "name": "client",
                    "namespace": "sample",
                    "moduleName": "sample",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
        },
        OptionsDict({"models-mode": models_mode, "flavor": "azure", "tsp_file": True}),
    )
    monitor = build_type(
        {
            "type": "model",
            "base": "dpg",
            "name": "Monitor",
            "snakeCaseName": "monitor",
            "properties": [
                {
                    "wireName": "wire.parent",
                    "clientName": "parent_",
                    "optional": True,
                    "type": {
                        "type": "model",
                        "base": "dpg",
                        "name": "Details",
                        "snakeCaseName": "details",
                        "properties": [
                            {
                                "wireName": "wire.class",
                                "clientName": "class_",
                                "optional": True,
                                "type": {"type": "string"},
                            }
                        ],
                    },
                }
            ],
        },
        code_model,
    )
    operation = LROOperationBase.__new__(LROOperationBase)
    operation.code_model = code_model
    operation.status_monitor_type = monitor
    properties = operation._metadata_properties(["wire.parent", "wire.class"])
    assert properties[-1].client_name == "class_"
    assert operation._metadata_path(properties) == expected


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize("subdir", [None, "_generated"])
def test_metadata_poller_paths_use_the_public_package(async_mode, subdir):
    response = LROResponse.__new__(LROResponse)
    response.code_model = SimpleNamespace(namespace="sample", options={"generation-subdir": subdir})
    response.has_lro_metadata = True
    package = f"sample.{subdir}" if subdir else "sample"

    assert response.get_poller_path(async_mode) == (
        f"{package}.aio.AsyncMetadataLROPoller" if async_mode else f"{package}.MetadataLROPoller"
    )
    assert response.get_polling_method_path(async_mode) == (
        f"{package}._polling._AsyncMetadataPolling" if async_mode else f"{package}._polling._MetadataPolling"
    )
