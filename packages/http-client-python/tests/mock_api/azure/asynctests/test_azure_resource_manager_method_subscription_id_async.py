# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.methodsubscriptionid.aio import MethodSubscriptionIdClient
from azure.resourcemanager.methodsubscriptionid import models

SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000"
RESOURCE_GROUP_NAME = "test-rg"


@pytest.fixture
async def client(credential, authentication_policy):
    async with MethodSubscriptionIdClient(
        credential,
        SUBSCRIPTION_ID,
        "http://localhost:3000",
        authentication_policy=authentication_policy,
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_operations_list(client):
    """Test Operations.list() endpoint."""
    operations = client.operations.list()
    operations_list = [op async for op in operations]
    assert len(operations_list) > 0

    operation = operations_list[0]
    assert operation.name == "Azure.ResourceManager.MethodSubscriptionId/services/read"
    assert operation.is_data_action is False
    assert operation.display.provider == "Azure.ResourceManager.MethodSubscriptionId"
    assert operation.display.resource == "services"
    assert operation.display.operation == "Lists services"
    assert operation.display.description == "Lists registered services"


@pytest.mark.asyncio
async def test_two_subscription_resources_method_level_subscription_resource1_operations_get(client):
    """Test get operation for SubscriptionResource1 with method-level subscription ID."""
    result = await client.two_subscription_resources_method_level.subscription_resource1_operations.get(
        subscription_id=SUBSCRIPTION_ID,
        subscription_resource1_name="sub-resource-1",
    )

    assert (
        result.id
        == f"/subscriptions/{SUBSCRIPTION_ID}/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s/sub-resource-1"
    )
    assert result.name == "sub-resource-1"
    assert result.type == "Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s"
    assert result.properties.description == "Valid subscription resource 1"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_two_subscription_resources_method_level_subscription_resource1_operations_put(client):
    """Test put operation for SubscriptionResource1 with method-level subscription ID."""
    resource = models.SubscriptionResource1(
        properties=models.SubscriptionResource1Properties(description="Valid subscription resource 1")
    )

    result = await client.two_subscription_resources_method_level.subscription_resource1_operations.put(
        subscription_id=SUBSCRIPTION_ID,
        subscription_resource1_name="sub-resource-1",
        resource=resource,
    )

    assert (
        result.id
        == f"/subscriptions/{SUBSCRIPTION_ID}/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s/sub-resource-1"
    )
    assert result.name == "sub-resource-1"
    assert result.type == "Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s"
    assert result.properties.description == "Valid subscription resource 1"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_two_subscription_resources_method_level_subscription_resource1_operations_delete(client):
    """Test delete operation for SubscriptionResource1 with method-level subscription ID."""
    await client.two_subscription_resources_method_level.subscription_resource1_operations.delete(
        subscription_id=SUBSCRIPTION_ID,
        subscription_resource1_name="sub-resource-1",
    )


@pytest.mark.asyncio
async def test_two_subscription_resources_method_level_subscription_resource2_operations_get(client):
    """Test get operation for SubscriptionResource2 with method-level subscription ID."""
    result = await client.two_subscription_resources_method_level.subscription_resource2_operations.get(
        subscription_id=SUBSCRIPTION_ID,
        subscription_resource2_name="sub-resource-2",
    )

    assert (
        result.id
        == f"/subscriptions/{SUBSCRIPTION_ID}/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s/sub-resource-2"
    )
    assert result.name == "sub-resource-2"
    assert result.type == "Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s"
    assert result.properties.config_value == "test-config"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_two_subscription_resources_method_level_subscription_resource2_operations_put(client):
    """Test put operation for SubscriptionResource2 with method-level subscription ID."""
    resource = models.SubscriptionResource2(
        properties=models.SubscriptionResource2Properties(config_value="test-config")
    )

    result = await client.two_subscription_resources_method_level.subscription_resource2_operations.put(
        subscription_id=SUBSCRIPTION_ID,
        subscription_resource2_name="sub-resource-2",
        resource=resource,
    )

    assert (
        result.id
        == f"/subscriptions/{SUBSCRIPTION_ID}/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s/sub-resource-2"
    )
    assert result.name == "sub-resource-2"
    assert result.type == "Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s"
    assert result.properties.config_value == "test-config"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_two_subscription_resources_method_level_subscription_resource2_operations_delete(client):
    """Test delete operation for SubscriptionResource2 with method-level subscription ID."""
    await client.two_subscription_resources_method_level.subscription_resource2_operations.delete(
        subscription_id=SUBSCRIPTION_ID,
        subscription_resource2_name="sub-resource-2",
    )


@pytest.mark.asyncio
async def test_mixed_subscription_placement_subscription_resource_operations_get(client):
    """Test get operation for SubscriptionResource in mixed placement scenario."""
    result = await client.mixed_subscription_placement.subscription_resource_operations.get(
        subscription_id=SUBSCRIPTION_ID,
        subscription_resource_name="sub-resource",
    )

    assert (
        result.id
        == f"/subscriptions/{SUBSCRIPTION_ID}/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResources/sub-resource"
    )
    assert result.name == "sub-resource"
    assert result.type == "Azure.ResourceManager.MethodSubscriptionId/subscriptionResources"
    assert result.properties.subscription_setting == "test-sub-setting"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_mixed_subscription_placement_subscription_resource_operations_put(client):
    """Test put operation for SubscriptionResource in mixed placement scenario."""
    resource = models.SubscriptionResource(
        properties=models.SubscriptionResourceProperties(subscription_setting="test-sub-setting")
    )

    result = await client.mixed_subscription_placement.subscription_resource_operations.put(
        subscription_id=SUBSCRIPTION_ID,
        subscription_resource_name="sub-resource",
        resource=resource,
    )

    assert (
        result.id
        == f"/subscriptions/{SUBSCRIPTION_ID}/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResources/sub-resource"
    )
    assert result.name == "sub-resource"
    assert result.type == "Azure.ResourceManager.MethodSubscriptionId/subscriptionResources"
    assert result.properties.subscription_setting == "test-sub-setting"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_mixed_subscription_placement_subscription_resource_operations_delete(client):
    """Test delete operation for SubscriptionResource in mixed placement scenario."""
    await client.mixed_subscription_placement.subscription_resource_operations.delete(
        subscription_id=SUBSCRIPTION_ID,
        subscription_resource_name="sub-resource",
    )


@pytest.mark.asyncio
async def test_mixed_subscription_placement_resource_group_resource_operations_get(client):
    """Test get operation for ResourceGroupResource with client-level subscription ID."""
    result = await client.mixed_subscription_placement.resource_group_resource_operations.get(
        resource_group_name=RESOURCE_GROUP_NAME,
        resource_group_resource_name="rg-resource",
    )

    assert (
        result.id
        == f"/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP_NAME}/providers/Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources/rg-resource"
    )
    assert result.name == "rg-resource"
    assert result.type == "Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources"
    assert result.location == "eastus"
    assert result.properties.resource_group_setting == "test-setting"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_mixed_subscription_placement_resource_group_resource_operations_put(client):
    """Test put operation for ResourceGroupResource with client-level subscription ID."""
    resource = models.ResourceGroupResource(
        location="eastus", properties=models.ResourceGroupResourceProperties(resource_group_setting="test-setting")
    )

    result = await client.mixed_subscription_placement.resource_group_resource_operations.put(
        resource_group_name=RESOURCE_GROUP_NAME,
        resource_group_resource_name="rg-resource",
        resource=resource,
    )

    assert (
        result.id
        == f"/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP_NAME}/providers/Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources/rg-resource"
    )
    assert result.name == "rg-resource"
    assert result.type == "Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources"
    assert result.location == "eastus"
    assert result.properties.resource_group_setting == "test-setting"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_mixed_subscription_placement_resource_group_resource_operations_delete(client):
    """Test delete operation for ResourceGroupResource with client-level subscription ID."""
    await client.mixed_subscription_placement.resource_group_resource_operations.delete(
        resource_group_name=RESOURCE_GROUP_NAME,
        resource_group_resource_name="rg-resource",
    )
