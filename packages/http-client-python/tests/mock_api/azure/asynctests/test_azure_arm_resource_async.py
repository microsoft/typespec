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
        credential,
        SUBSCRIPTION_ID,
        "http://localhost:3000",
        authentication_policy=authentication_policy,
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_client_signature(credential, authentication_policy):
    # make sure signautre order is correct
    client1 = ResourcesClient(
        credential,
        SUBSCRIPTION_ID,
        "http://localhost:3000",
        authentication_policy=authentication_policy,
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
            resource_group_name=RESOURCE_GROUP_NAME,
            top_level_tracked_resource_name="top",
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


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scope",
    [
        "",
        "/subscriptions/00000000-0000-0000-0000-000000000000",
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg",
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top",
    ],
)
async def test_extensions_resources_begin_create_or_update(client, scope):
    result = await (
        await client.extensions_resources.begin_create_or_update(
            resource_uri=scope,
            extensions_resource_name="extension",
            resource=models.ExtensionsResource(properties=models.ExtensionsResourceProperties(description="valid")),
        )
    ).result()
    assert result.id == f"{scope}/providers/Azure.ResourceManager.Resources/extensionsResources/extension"
    assert result.name == "extension"
    assert result.type == "Azure.ResourceManager.Resources/extensionsResources"
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scope",
    [
        "",
        "/subscriptions/00000000-0000-0000-0000-000000000000",
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg",
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top",
    ],
)
async def test_extensions_resources_update(client, scope):
    result = await client.extensions_resources.update(
        resource_uri=scope,
        extensions_resource_name="extension",
        properties=models.ExtensionsResource(properties=models.ExtensionsResourceProperties(description="valid2")),
    )
    assert result.id == f"{scope}/providers/Azure.ResourceManager.Resources/extensionsResources/extension"
    assert result.name == "extension"
    assert result.type == "Azure.ResourceManager.Resources/extensionsResources"
    assert result.properties.description == "valid2"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scope",
    [
        "",
        "/subscriptions/00000000-0000-0000-0000-000000000000",
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg",
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top",
    ],
)
async def test_extensions_resources_get(client, scope):
    result = await client.extensions_resources.get(resource_uri=scope, extensions_resource_name="extension")
    assert result.id == f"{scope}/providers/Azure.ResourceManager.Resources/extensionsResources/extension"
    assert result.name == "extension"
    assert result.type == "Azure.ResourceManager.Resources/extensionsResources"
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scope",
    [
        "",
        "/subscriptions/00000000-0000-0000-0000-000000000000",
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg",
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top",
    ],
)
async def test_extensions_resources_list_by_scope(client, scope):
    response = client.extensions_resources.list_by_scope(
        resource_uri=scope,
    )
    result = [r async for r in response]
    for result in result:
        assert result.id == f"{scope}/providers/Azure.ResourceManager.Resources/extensionsResources/extension"
        assert result.name == "extension"
        assert result.type == "Azure.ResourceManager.Resources/extensionsResources"
        assert result.properties.description == "valid"
        assert result.properties.provisioning_state == "Succeeded"
        assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scope",
    [
        "",
        "/subscriptions/00000000-0000-0000-0000-000000000000",
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg",
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top",
    ],
)
async def test_extensions_resources_delete(client, scope):
    await client.extensions_resources.delete(resource_uri=scope, extensions_resource_name="extension")


@pytest.mark.asyncio
async def test_location_resources_create_or_update(client):
    result = await client.location_resources.create_or_update(
        location="eastus",
        location_resource_name="resource",
        resource=models.LocationResource(properties=models.LocationResourceProperties(description="valid")),
    )
    assert (
        result.id
        == "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/locations/eastus/locationResources/resource"
    )
    assert result.name == "resource"
    assert result.type == "Azure.ResourceManager.Resources/locationResources"
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_location_resources_update(client):
    result = await client.location_resources.update(
        location="eastus",
        location_resource_name="resource",
        properties=models.LocationResource(properties=models.LocationResourceProperties(description="valid2")),
    )
    assert (
        result.id
        == "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/locations/eastus/locationResources/resource"
    )
    assert result.name == "resource"
    assert result.type == "Azure.ResourceManager.Resources/locationResources"
    assert result.properties.description == "valid2"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_location_resources_get(client):
    result = await client.location_resources.get(
        location="eastus",
        location_resource_name="resource",
    )
    assert (
        result.id
        == "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/locations/eastus/locationResources/resource"
    )
    assert result.name == "resource"
    assert result.type == "Azure.ResourceManager.Resources/locationResources"
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.system_data.created_by == "AzureSDK"


@pytest.mark.asyncio
async def test_location_resources_delete(client):
    await client.location_resources.delete(
        location="eastus",
        location_resource_name="resource",
    )


@pytest.mark.asyncio
async def test_location_resources_list_by_location(client):
    response = client.location_resources.list_by_location(
        location="eastus",
    )
    result = [r async for r in response]
    for result in result:
        assert (
            result.id
            == "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/locations/eastus/locationResources/resource"
        )
        assert result.name == "resource"
        assert result.type == "Azure.ResourceManager.Resources/locationResources"
        assert result.properties.description == "valid"
        assert result.properties.provisioning_state == "Succeeded"
        assert result.system_data.created_by == "AzureSDK"
