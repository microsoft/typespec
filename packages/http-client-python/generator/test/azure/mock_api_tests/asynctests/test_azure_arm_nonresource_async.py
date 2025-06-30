# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.nonresource.aio import NonResourceClient
from azure.resourcemanager.nonresource import models

SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000"
RESOURCE_GROUP_NAME = "test-rg"


@pytest.fixture
async def client(credential, authentication_policy):
    async with NonResourceClient(
        credential, SUBSCRIPTION_ID, "http://localhost:3000", authentication_policy=authentication_policy
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_non_resource_create(client: NonResourceClient):
    result = await client.non_resource_operations.create(
        location="eastus", parameter="hello", body=models.NonResource(id="id", name="hello", type="nonResource")
    )
    assert result == models.NonResource(id="id", name="hello", type="nonResource")


@pytest.mark.asyncio
async def test_non_resource_get(client: NonResourceClient):
    result = await client.non_resource_operations.get(
        location="eastus",
        parameter="hello",
    )
    assert result == models.NonResource(id="id", name="hello", type="nonResource")
