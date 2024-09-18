# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from server.versions.versioned import VersionedClient


@pytest.fixture
def client():
    with VersionedClient(endpoint="http://localhost:3000") as client:
        yield client


def test_without_api_version(client: VersionedClient):
    client.without_api_version()


def test_with_query_api_version(client: VersionedClient):
    client.with_query_api_version()


def test_with_path_api_version(client: VersionedClient):
    client.with_path_api_version()


def test_with_query_old_api_version():
    with VersionedClient(endpoint="http://localhost:3000", api_version="2021-01-01-preview") as client:
        client.with_query_old_api_version()
