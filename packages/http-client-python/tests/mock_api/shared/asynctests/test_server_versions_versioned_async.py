# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from server.versions.versioned.aio import VersionedClient


@pytest.fixture
async def client():
    async with VersionedClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_without_api_version(client: VersionedClient):
    await client.without_api_version()


@pytest.mark.asyncio
async def test_with_query_api_version(client: VersionedClient):
    await client.with_query_api_version()


@pytest.mark.asyncio
async def test_with_path_api_version(client: VersionedClient):
    await client.with_path_api_version()


@pytest.mark.asyncio
async def test_with_query_old_api_version():
    async with VersionedClient(endpoint="http://localhost:3000", api_version="2021-01-01-preview") as client:
        await client.with_query_old_api_version()
