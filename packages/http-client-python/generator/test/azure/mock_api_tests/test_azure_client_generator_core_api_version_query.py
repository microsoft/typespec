# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.alternateapiversion.service.query import QueryClient


@pytest.fixture
def client():
    with QueryClient(endpoint="http://localhost:3000") as client:
        yield client


def test_query_api_version(client: QueryClient):
    client.query_api_version()
