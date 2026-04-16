# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from specs.azure.clientgenerator.core.clientdoc.aio import ClientDocClient
from specs.azure.clientgenerator.core.clientdoc.documentation import models


@pytest_asyncio.fixture
async def client():
    async with ClientDocClient() as client:
        yield client


@pytest.mark.asyncio
async def test_harvest(client: ClientDocClient):
    plant = models.Plant(name="Rose", species="Rosa")
    result = await client.documentation.harvest(plant)
    assert result == models.Plant(name="Rose", species="Rosa")
