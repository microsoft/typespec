# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.alternateapiversion.service.header.aio import HeaderClient


@pytest.fixture
async def client():
    async with HeaderClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_header_api_version(client: HeaderClient):
    await client.header_api_version()