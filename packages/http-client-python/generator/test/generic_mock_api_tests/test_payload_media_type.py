# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from payload.mediatype import MediaTypeClient


@pytest.fixture
def client():
    with MediaTypeClient(endpoint="http://localhost:3000") as client:
        yield client


def test_json(client: MediaTypeClient):
    data = "foo"
    client.string_body.send_as_json(data)
    assert client.string_body.get_as_json() == data


def test_text(client: MediaTypeClient):
    data = "{cat}"
    client.string_body.send_as_text(data)
    assert client.string_body.get_as_text() == data
