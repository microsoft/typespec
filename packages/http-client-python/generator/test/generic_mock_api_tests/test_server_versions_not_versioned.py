# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from server.versions.notversioned import NotVersionedClient


@pytest.fixture
def client():
    with NotVersionedClient(endpoint="http://localhost:3000", api_version="v1.0") as client:
        yield client


def test_without_api_version(client: NotVersionedClient):
    client.without_api_version()


def test_with_query_api_version(client: NotVersionedClient):
    client.with_query_api_version()


def test_with_path_api_version(client: NotVersionedClient):
    client.with_path_api_version()
