# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.resources.aio import ResourcesClient
from azure.resourcemanager.resources import models

SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000"
RESOURCE_GROUP_NAME = "test-rg"


@pytest.fixture
async def client(credential, authentication_policy):
    async with ResourcesClient(
        credential, SUBSCRIPTION_ID, "http://localhost:3000", authentication_policy=authentication_policy
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_client_signature(credential, authentication_policy):
    # make sure signautre order is correct
    client1 = ResourcesClient(
        credential, SUBSCRIPTION_ID, "http://localhost:3000", authentication_policy=authentication_policy
    )
    # make sure signautre name is correct
    client2 = ResourcesClient(
        credential=credential,
        subscription_id=SUBSCRIPTION_ID,
        base_url="http://localhost:3000",
        authentication_policy=authentication_policy,
    )
    for client in [client1, client2]:
        # make sure signautre order is correct
        await client.top_level.get(RESOURCE_GROUP_NAME, "top")
        # make sure signautre name is correct
        await client.top_level.get(
            resource_group_name=RESOURCE_GROUP_NAME, top_level_tracked_resource_name="top"
        )


@pytest.mark.asyncio
async def test_top_level_begin_create_or_replace(client):
    result = await (
        await client.top_level.begin_create_or_replace(
            resource_group_name=RESOURCE_GROUP_NAME,
            top_level_tracked_resource_name="top",
            resource=models.TopLevelTrackedResource(
                location="eastus",
                properties=models.TopLevelTrackedResourceProperties(
                    models.TopLevelTrackedResourceProperties(description="valid")
                ),
            ),
            polling_interval=0,  # set polling_interval to 0 s to make the test faster since default is 30s
        )
    ).result()
    assert result.location == "eastus"
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.name == "top"
    assert result.type == "Azure.ResourceManager.Resources/topLevelTrackedResources"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_top_level_begin_update(client):
    result = await (
        await client.top_level.begin_update(
            resource_group_name=RESOURCE_GROUP_NAME,
            top_level_tracked_resource_name="top",
            properties=models.TopLevelTrackedResource(
                location="eastus",
                properties=models.TopLevelTrackedResourceProperties(
                    models.TopLevelTrackedResourceProperties(description="valid2")
                ),
            ),
            polling_interval=0,  # set polling_interval to 0 s to make the test faster since default is 30s
        )
    ).result()
    assert result.location == "eastus"
    assert result.properties.description == "valid2"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.name == "top"
    assert result.type == "Azure.ResourceManager.Resources/topLevelTrackedResources"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_top_level_begin_delete(client):
    await (
        await client.top_level.begin_delete(
            resource_group_name=RESOURCE_GROUP_NAME,
            top_level_tracked_resource_name="top",
            polling_interval=0,  # set polling_interval to 0 s to make the test faster since default is 30s
        )
    ).result()


@pytest.mark.asyncio
async def test_top_level_list_by_resource_group(client):
    response = client.top_level.list_by_resource_group(
        resource_group_name=RESOURCE_GROUP_NAME,
    )
    result = [r async for r in response]
    for result in result:
        assert result.location == "eastus"
        assert result.properties.description == "valid"
        assert result.properties.provisioning_state == "Succeeded"
        assert result.name == "top"
        assert result.type == "Azure.ResourceManager.Resources/topLevelTrackedResources"
        assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_top_level_list_by_subscription(client):
    response = client.top_level.list_by_subscription()
    result = [r async for r in response]
    for result in result:
        assert result.location == "eastus"
        assert result.properties.description == "valid"
        assert result.properties.provisioning_state == "Succeeded"
        assert result.name == "top"
        assert result.type == "Azure.ResourceManager.Resources/topLevelTrackedResources"
        assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_nested_get(client):
    result = await client.nested.get(
        resource_group_name=RESOURCE_GROUP_NAME,
        top_level_tracked_resource_name="top",
        nexted_proxy_resource_name="nested",
    )
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.name == "nested"
    assert result.type == "Azure.ResourceManager.Resources/topLevelTrackedResources/top/nestedProxyResources"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_nested_begin_create_or_replace(client):
    result = await (
        await client.nested.begin_create_or_replace(
            resource_group_name=RESOURCE_GROUP_NAME,
            top_level_tracked_resource_name="top",
            nexted_proxy_resource_name="nested",
            resource=models.TopLevelTrackedResource(
                properties=models.TopLevelTrackedResourceProperties(
                    models.TopLevelTrackedResourceProperties(description="valid")
                ),
            ),
            polling_interval=0,  # set polling_interval to 0 s to make the test faster since default is 30s
        )
    ).result()
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.name == "nested"
    assert result.type == "Azure.ResourceManager.Resources/topLevelTrackedResources/top/nestedProxyResources"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_nested_begin_update(client):
    result = await (
        await client.nested.begin_update(
            resource_group_name=RESOURCE_GROUP_NAME,
            top_level_tracked_resource_name="top",
            nexted_proxy_resource_name="nested",
            properties=models.TopLevelTrackedResource(
                properties=models.TopLevelTrackedResourceProperties(
                    models.TopLevelTrackedResourceProperties(description="valid2")
                ),
            ),
            polling_interval=0,  # set polling_interval to 0 s to make the test faster since default is 30s
        )
    ).result()
    assert result.properties.description == "valid2"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.name == "nested"
    assert result.type == "Azure.ResourceManager.Resources/topLevelTrackedResources/top/nestedProxyResources"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_nested_begin_delete(client):
    await (
        await client.nested.begin_delete(
            resource_group_name=RESOURCE_GROUP_NAME,
            top_level_tracked_resource_name="top",
            nexted_proxy_resource_name="nested",
            polling_interval=0,  # set polling_interval to 0 s to make the test faster since default is 30s
        )
    ).result()


@pytest.mark.asyncio
async def test_nested_list_by_top_level_tracked_resource(client):
    response = client.nested.list_by_top_level_tracked_resource(
        resource_group_name=RESOURCE_GROUP_NAME,
        top_level_tracked_resource_name="top",
    )
    result = [r async for r in response]
    for result in result:
        assert result.properties.description == "valid"
        assert result.properties.provisioning_state == "Succeeded"
        assert result.name == "nested"
        assert result.type == "Azure.ResourceManager.Resources/topLevelTrackedResources/top/nestedProxyResources"
        assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_top_level_action_sync(client):
    await client.top_level.action_sync(
        resource_group_name=RESOURCE_GROUP_NAME,
        top_level_tracked_resource_name="top",
        body={"message": "Resource action at top level.", "urgent": True},
    )


@pytest.mark.asyncio
async def test_singleton_get_by_resource_group(client):
    result = await client.singleton.get_by_resource_group(
        resource_group_name=RESOURCE_GROUP_NAME,
    )
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.name == "default"
    assert result.type == "Azure.ResourceManager.Resources/singletonTrackedResources"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_singleton_begin_create_or_replace(client):
    result = await (
        await client.singleton.begin_create_or_update(
            resource_group_name=RESOURCE_GROUP_NAME,
            resource=models.SingletonTrackedResource(
                location="eastus",
                properties=models.SingletonTrackedResourceProperties(
                    models.SingletonTrackedResourceProperties(description="valid")
                ),
            ),
        )
    ).result()
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.name == "default"
    assert result.type == "Azure.ResourceManager.Resources/singletonTrackedResources"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_singleton_update(client):
    result = await client.singleton.update(
        resource_group_name=RESOURCE_GROUP_NAME,
        properties=models.SingletonTrackedResource(
            location="eastus2",
            properties=models.SingletonTrackedResourceProperties(
                models.SingletonTrackedResourceProperties(description="valid2")
            ),
        ),
    )
    assert result.properties.description == "valid2"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.name == "default"
    assert result.type == "Azure.ResourceManager.Resources/singletonTrackedResources"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_singleton_list_by_resource_group(client):
    response = client.singleton.list_by_resource_group(
        resource_group_name=RESOURCE_GROUP_NAME,
    )
    result = [r async for r in response]
    for result in result:
        assert result.properties.description == "valid"
        assert result.properties.provisioning_state == "Succeeded"
        assert result.name == "default"
        assert result.type == "Azure.ResourceManager.Resources/singletonTrackedResources"
        assert result.system_data.created_by == "AzureSDK"
