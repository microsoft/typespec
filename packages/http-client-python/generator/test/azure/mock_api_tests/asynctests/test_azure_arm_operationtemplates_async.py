# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.operationtemplates.aio import OperationTemplatesClient
from azure.resourcemanager.operationtemplates import models

SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000"
RESOURCE_GROUP_NAME = "test-rg"


@pytest.fixture
async def client(credential, authentication_policy):
    async with OperationTemplatesClient(
        credential,
        SUBSCRIPTION_ID,
        "http://localhost:3000",
        authentication_policy=authentication_policy,
        polling_interval=0,
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_check_name_availability_check_global(client):
    result = await client.check_name_availability.check_global(
        body=models.CheckNameAvailabilityRequest(name="checkName", type="Microsoft.Web/site")
    )
    assert result.name_available == False
    assert result.reason == models.CheckNameAvailabilityReason.ALREADY_EXISTS
    assert result.message == "Hostname 'checkName' already exists. Please select a different name."


@pytest.mark.asyncio
async def test_check_name_availability_check_local(client):
    result = await client.check_name_availability.check_local(
        location="westus",
        body=models.CheckNameAvailabilityRequest(name="checkName", type="Microsoft.Web/site"),
    )
    assert result.name_available == False
    assert result.reason == models.CheckNameAvailabilityReason.ALREADY_EXISTS
    assert result.message == "Hostname 'checkName' already exists. Please select a different name."


@pytest.mark.asyncio
async def test_operations_list(client):
    result = client.operations.list()
    async for operation in result:
        assert operation.name == "Microsoft.Compute/virtualMachines/write"
        assert operation.display.operation == "Create or Update Virtual Machine."
        assert operation.origin == "user,system"
        assert operation.action_type == "Internal"


@pytest.mark.asyncio
async def test_lro_begin_create_or_replace(client):
    result = await (
        await client.lro.begin_create_or_replace(
            resource_group_name=RESOURCE_GROUP_NAME,
            order_name="order1",
            resource=models.Order(
                location="eastus",
                properties=models.OrderProperties(product_id="product1", amount=1),
            ),
        )
    ).result()
    assert result.name == "order1"
    assert (
        result.id
        == "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.OperationTemplates/orders/order1"
    )
    assert result.type == "Azure.ResourceManager.Resources/orders"
    assert result.location == "eastus"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_lro_begin_export(client):
    await (
        await client.lro.begin_export(
            resource_group_name=RESOURCE_GROUP_NAME,
            order_name="order1",
            body=models.ExportRequest(format="csv"),
        )
    ).result()


@pytest.mark.asyncio
async def test_lro_begin_delete(client):
    await (
        await client.lro.begin_delete(
            resource_group_name=RESOURCE_GROUP_NAME,
            order_name="order1",
        )
    ).result()
