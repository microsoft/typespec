# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest

from streaming.jsonl import JsonlClient
from streaming.jsonl._utils.streaming_base import Stream
from streaming.jsonl.basic.models import Info


@pytest.fixture
def client():
    with JsonlClient(endpoint="http://localhost:3000") as client:
        yield client


JSONL = b'{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'


def test_basic_send(client: JsonlClient):
    client.basic.send(JSONL)


def test_basic_recv(client: JsonlClient):
    stream = client.basic.receive()
    assert isinstance(stream, Stream)
    items = list(stream)
    assert all(isinstance(item, Info) for item in items)
    assert [item.desc for item in items] == ["one", "two", "three"]
