# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from server.versions.notversioned.aio import NotVersionedClient


@pytest.fixture
async def client():
    async with NotVersionedClient(endpoint="http://localhost:3000", api_version="v1.0") as client:
        yield client


@pytest.mark.asyncio
async def test_without_api_version(client: NotVersionedClient):
    await client.without_api_version()


@pytest.mark.asyncio
async def test_with_query_api_version(client: NotVersionedClient):
    await client.with_query_api_version()


@pytest.mark.asyncio
async def test_with_path_api_version(client: NotVersionedClient):
    await client.with_path_api_version()
