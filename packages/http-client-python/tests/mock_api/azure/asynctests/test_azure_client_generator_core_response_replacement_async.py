# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from _specs_.azure.clientgenerator.core.responsereplacement.aio import ResponseReplacementClient
from _specs_.azure.clientgenerator.core.responsereplacement.models import Widget


@pytest_asyncio.fixture
async def client():
    async with ResponseReplacementClient() as client:
        yield client


@pytest.mark.asyncio
async def test_void_response(client: ResponseReplacementClient):
    assert await client.void_response() == Widget(name="widget")


@pytest.mark.asyncio
async def test_bytes_response(client: ResponseReplacementClient):
    assert await client.bytes_response() == Widget(name="widget")
