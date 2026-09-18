# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from _specs_.azure.clientgenerator.core.responsereplacement import ResponseReplacementClient
from _specs_.azure.clientgenerator.core.responsereplacement.models import Widget


@pytest.fixture
def client():
    with ResponseReplacementClient() as client:
        yield client


def test_void_response(client: ResponseReplacementClient):
    assert client.void_response() == Widget(name="widget")


def test_bytes_response(client: ResponseReplacementClient):
    assert client.bytes_response() == Widget(name="widget")
