# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pathlib import Path
from types import SimpleNamespace
import json

import pytest
from azure.core.exceptions import HttpResponseError
from azure.core.pipeline import PipelineContext, PipelineResponse
from azure.core.pipeline.transport import HttpRequest
from azure.core.utils import case_insensitive_dict
from jinja2 import Environment, FileSystemLoader, StrictUndefined


@pytest.fixture(scope="session", autouse=True)
def testserver():
    yield


@pytest.fixture(params=[False, True], ids=["data-plane", "arm"])
def polling(request):
    env = Environment(
        loader=FileSystemLoader(Path(__file__).parents[2] / "generator/pygen/codegen/templates"),
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


def response(body, headers=None):
    return SimpleNamespace(json=lambda: body, content=b"json" if body is not None else b"", headers=headers or {})


def test_latest_metadata_replaces_missing_and_changed_values(polling):
    state = polling._LroMetadata({k: ([k], lambda value: value) for k in ("progress", "errors")})
    state.update(response({"progress": 10}))
    assert state.details == {"progress": 10}
    for terminal_state in ("Failed", "Canceled"):
        state.update(response({"status": terminal_state, "errors": ["item error"]}))
        assert state.details == {"errors": ["item error"]}
    state.update(response(None))
    assert state.details == {}


@pytest.mark.parametrize("location", ["ResponseHeader", "ResponseBody", "Self"])
def test_selected_uri_segment_and_body_precedence(polling, location):
    state = polling._LroMetadata(
        {},
        operation_id_path=["wire-id"],
        operation_id_uri={
            "location": location,
            "property": "monitor",
            "path": "/operations/{operationId}/status",
            "parameter": "operationId",
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


def test_body_only_id_is_unavailable_until_monitor_response(polling):
    state = polling._LroMetadata({}, operation_id_path=["id"])
    state.initialize(response({"id": "unrelated-initial-resource"}))
    assert state.operation_id is None
    state.update(response({"id": "server-id"}))
    assert state.operation_id == "server-id"


def test_unmatched_uri_does_not_invent_an_operation_id(polling):
    state = polling._LroMetadata(
        {},
        operation_id_uri={
            "location": "ResponseHeader",
            "property": "Operation-Location",
            "path": "/operations/{operationId}/status",
            "parameter": "operationId",
        },
    )
    state.initialize(response(None, {"Operation-Location": "https://example.test/unrelated"}))
    assert state.operation_id is None


def test_initial_monitor_and_rehydration(polling):
    state = polling._LroMetadata({"progress": (["progress"], int)}, initial_response_is_monitor=True)
    state.initialize(response({"progress": 1}))
    assert state.details == {"progress": 1}
    resumed = polling._LroMetadata({"progress": (["progress"], int)}, initial_response_is_monitor=True)
    resumed.rehydrated = True
    resumed.initialize(response({"progress": 1}))
    assert resumed.details == {}
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
        {"progress": (["progress"], int)},
        operation_id_path=["id"],
        operation_id_uri={
            "location": "ResponseHeader",
            "property": "Operation-Location",
            "path": "/operations/{operationId}/status",
            "parameter": "operationId",
        },
        initial_response_is_monitor=True,
    )


@pytest.mark.parametrize("terminal", ["Succeeded", "Failed", "Canceled"])
def test_sync_poller_retains_monitor_metadata_after_terminal_response(polling, terminal):
    urls = []
    bodies = iter([{"status": "Running", "progress": 1}, {"status": terminal, "progress": 2, "id": "body-id"}])

    def run(request, **kwargs):
        urls.append(request.url)
        return pipeline_response({"final": True} if request.url == FINAL_URL else next(bodies))

    client = SimpleNamespace(
        send_request=run,
        get=lambda url: HttpRequest("GET", url),
        _pipeline=SimpleNamespace(run=run, _transport=SimpleNamespace(sleep=lambda _: None)),
    )
    state = metadata_state(polling)
    method = polling._MetadataPolling(0, lro_metadata=state)
    poller = polling.MetadataLROPoller(
        client,
        pipeline_response({"status": "Running", "progress": 0}, initial=True),
        lambda value: value.http_response.json(),
        method,
        lro_metadata=state,
    )
    if terminal == "Succeeded":
        assert poller.result() == {"final": True}
        assert urls == [POLL_URL, POLL_URL, FINAL_URL]
    else:
        with pytest.raises(HttpResponseError):
            poller.result()
        assert urls == [POLL_URL, POLL_URL]
    assert poller.details == {"progress": 2, "operation_id": "body-id"}


def test_sync_poller_repopulates_metadata_after_continuation(polling):
    urls = []

    def run(request, **kwargs):
        urls.append(request.url)
        return pipeline_response(
            {"final": True} if request.url == FINAL_URL else {"status": "Succeeded", "progress": 2, "id": "resumed-id"}
        )

    client = SimpleNamespace(
        send_request=run,
        get=lambda url: HttpRequest("GET", url),
        _pipeline=SimpleNamespace(run=run, _transport=SimpleNamespace(sleep=lambda _: None)),
    )
    initial_state = metadata_state(polling)
    method = polling._MetadataPolling(0, lro_metadata=initial_state)
    callback = lambda value: value.http_response.json()
    method.initialize(client, pipeline_response({"status": "Running", "progress": 0}, initial=True), callback)
    initial_state.update(response({"progress": 99, "id": "not-persisted"}))
    resumed_state = metadata_state(polling)
    resumed = polling.MetadataLROPoller.from_continuation_token(
        polling_method=polling._MetadataPolling(0, lro_metadata=resumed_state),
        continuation_token=method.get_continuation_token(),
        client=client,
        deserialization_callback=callback,
        lro_metadata=resumed_state,
    )
    assert resumed.result() == {"final": True}
    assert resumed.details == {"progress": 2, "operation_id": "resumed-id"}
    assert urls == [POLL_URL, FINAL_URL]


@pytest.mark.asyncio
@pytest.mark.parametrize("terminal", ["Succeeded", "Failed", "Canceled"])
async def test_async_poller_resumes_without_persisted_metadata(polling, terminal):
    urls = []
    bodies = iter([{"status": "Running", "progress": 1}, {"status": terminal, "progress": 2, "id": "body-id"}])

    async def run(request, **kwargs):
        urls.append(request.url)
        return pipeline_response({"final": True} if request.url == FINAL_URL else next(bodies))

    client = SimpleNamespace(
        send_request=run,
        get=lambda url: HttpRequest("GET", url),
        _pipeline=SimpleNamespace(run=run, _transport=None),
    )
    state = metadata_state(polling)
    method = polling._AsyncMetadataPolling(0, lro_metadata=state)
    poller = polling.AsyncMetadataLROPoller(
        client,
        pipeline_response({"status": "Running", "progress": 0}, initial=True),
        lambda value: value.http_response.json(),
        method,
        lro_metadata=state,
    )
    assert poller.details == {"progress": 0, "operation_id": "uri id"}
    await method.update_status()
    assert poller.details == {"progress": 1, "operation_id": "uri id"}
    resumed_state = metadata_state(polling)
    resumed = polling.AsyncMetadataLROPoller.from_continuation_token(
        polling_method=polling._AsyncMetadataPolling(0, lro_metadata=resumed_state),
        continuation_token=poller.continuation_token(),
        client=client,
        deserialization_callback=lambda value: value.http_response.json(),
        lro_metadata=resumed_state,
    )
    assert resumed.details == {"operation_id": "uri id"}
    if terminal == "Succeeded":
        assert await resumed.result() == {"final": True}
        assert urls == [POLL_URL, POLL_URL, FINAL_URL]
    else:
        with pytest.raises(HttpResponseError):
            await resumed.result()
        assert urls == [POLL_URL, POLL_URL]
    assert resumed.details == {"progress": 2, "operation_id": "body-id"}
