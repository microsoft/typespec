# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from streaming.jsonl import JsonlClient
from streaming.sse import SseClient


def test_jsonl_response_remains_raw_bytes():
    with JsonlClient(endpoint="http://localhost:3000") as client:
        payload = b"".join(client.basic.receive())

    assert payload == b'{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'


def test_sse_response_remains_raw_bytes():
    with SseClient(endpoint="http://localhost:3000") as client:
        payload = b"".join(client.named.receive())

    assert b"event: responseCreated" in payload
    assert b"data: [DONE]" in payload
