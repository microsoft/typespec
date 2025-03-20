# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.core.scalar.aio import ScalarClient
from specs.azure.core.scalar import models


@pytest.fixture
async def client():
    async with ScalarClient() as client:
        yield client


@pytest.mark.asyncio
async def test_azure_location_scalar_get(client: ScalarClient):
    result = await client.azure_location_scalar.get()
    assert result == "eastus"


@pytest.mark.asyncio
async def test_azure_location_scalar_put(client: ScalarClient):
    await client.azure_location_scalar.put("eastus")


@pytest.mark.asyncio
async def test_azure_location_scalar_post(client: ScalarClient):
    result = await client.azure_location_scalar.post(models.AzureLocationModel(location="eastus"))
    assert result == models.AzureLocationModel(location="eastus")


@pytest.mark.asyncio
async def test_azure_location_scalar_header(client: ScalarClient):
    await client.azure_location_scalar.header(region="eastus")


@pytest.mark.asyncio
async def test_azure_location_scalar_query(client: ScalarClient):
    await client.azure_location_scalar.query(region="eastus")
