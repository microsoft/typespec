# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from server.endpoint.notdefined.aio import NotDefinedClient


@pytest.fixture
async def client():
    async with NotDefinedClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_valid(client: NotDefinedClient):
    assert await client.valid() is True
