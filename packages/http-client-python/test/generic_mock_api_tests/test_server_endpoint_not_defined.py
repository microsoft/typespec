# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from server.endpoint.notdefined import NotDefinedClient


@pytest.fixture
def client():
    with NotDefinedClient(endpoint="http://localhost:3000") as client:
        yield client


def test_valid(client: NotDefinedClient):
    assert client.valid() is True
