# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest

from streaming.jsonl import JsonlClient


@pytest.fixture
def client():
    with JsonlClient(endpoint="http://localhost:3000") as client:
        yield client


JSONL = b'{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'


def test_basic_send(client: JsonlClient):
    client.basic.send(JSONL)


def test_basic_recv(client: JsonlClient):
    assert b"".join(client.basic.receive()) == JSONL
