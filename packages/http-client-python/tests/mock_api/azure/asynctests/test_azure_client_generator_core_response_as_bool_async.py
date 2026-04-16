# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from specs.azure.clientgenerator.core.responseasbool.aio import ResponseAsBoolClient


@pytest_asyncio.fixture
async def client():
    async with ResponseAsBoolClient() as client:
        yield client


@pytest.mark.asyncio
async def test_exists(client: ResponseAsBoolClient):
    result = await client.head_as_boolean.exists()
    assert result is True


@pytest.mark.asyncio
async def test_not_exists(client: ResponseAsBoolClient):
    result = await client.head_as_boolean.not_exists()
    assert result is False
