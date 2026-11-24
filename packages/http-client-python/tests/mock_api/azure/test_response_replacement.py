# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.responsereplacement import ResponseReplacementClient


@pytest.fixture
def client():
    with ResponseReplacementClient() as client:
        yield client


def test_void_response(client: ResponseReplacementClient):
    assert client.void_response() is None
    result = client.void_response(
        cls=lambda response, value, headers: (
            value,
            response.http_response.status_code,
            response.http_response.json(),
        )
    )
    assert result == (None, 200, {"name": "widget"})
