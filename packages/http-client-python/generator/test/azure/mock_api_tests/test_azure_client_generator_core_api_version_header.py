# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.alternateapiversion.service.header import HeaderClient


@pytest.fixture
def client():
    with HeaderClient(endpoint="http://localhost:3000") as client:
        yield client


def test_header_api_version(client: HeaderClient):
    client.header_api_version()
