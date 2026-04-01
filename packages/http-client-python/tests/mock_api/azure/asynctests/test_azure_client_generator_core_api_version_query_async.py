# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from client.alternateapiversion.service.query.aio import QueryClient


@pytest_asyncio.fixture
async def client():
    async with QueryClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_query_api_version(client: QueryClient):
    await client.query_api_version()
