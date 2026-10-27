# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from azure.clientgenerator.core.apiversion.clientapiversions.aio import ClientApiVersionsClient


@pytest_asyncio.fixture
async def client():
    async with ClientApiVersionsClient(endpoint="http://localhost:3000", api_version="2022-10-01") as client:
        yield client


@pytest.mark.asyncio
async def test_send_api_version(client: ClientApiVersionsClient):
    await client.send_api_version()
