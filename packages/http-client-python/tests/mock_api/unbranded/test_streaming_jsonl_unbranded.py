# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Unbranded JSONL streaming: ``receive()`` keeps the raw byte-iterator behavior.

Structured streaming (`Stream[T]` / `AsyncStream[T]`) targets the vendored
`azure.core.rest`-based runtime and so applies to the Azure flavor only. For the
unbranded flavor, JSONL streaming responses keep the existing
`Iterator[bytes]` / `AsyncIterator[bytes]` behavior, which this test asserts.

(The Azure structured `receive()` is covered by mock_api/azure/test_streaming_structured.py.)
"""
import pytest

from streaming.jsonl import JsonlClient


@pytest.fixture
def client():
    with JsonlClient(endpoint="http://localhost:3000") as client:
        yield client


JSONL = b'{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'


def test_basic_recv(client: JsonlClient):
    assert b"".join(client.basic.receive()) == JSONL
