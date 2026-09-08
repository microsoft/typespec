# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.clientgenerator.core.apiversion.clientapiversions import ClientApiVersionsClient


@pytest.fixture
def client():
    with ClientApiVersionsClient(endpoint="http://localhost:3000", api_version="2022-10-01") as client:
        yield client


def test_send_api_version(client: ClientApiVersionsClient):
    client.send_api_version()
