# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from azure.resourcemanager.servicegroupextension.aio import ServiceGroupExtensionClient
from azure.resourcemanager.servicegroupextension import models

SERVICE_GROUP_ID = "test-sg"
RESOURCE_NAME = "resource"


@pytest_asyncio.fixture
async def client(credential, authentication_policy):
    async with ServiceGroupExtensionClient(
        credential, "http://localhost:3000", authentication_policy=authentication_policy
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_service_group_extension_resources_get(client):
    result = await client.service_group_extension_resources.get(
        service_group_id=SERVICE_GROUP_ID, service_group_extension_resource_name=RESOURCE_NAME
    )
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"


@pytest.mark.asyncio
async def test_service_group_extension_resources_create_or_update(client):
    result = await (
        await client.service_group_extension_resources.begin_create_or_update(
            service_group_id=SERVICE_GROUP_ID,
            service_group_extension_resource_name=RESOURCE_NAME,
            resource=models.ServiceGroupExtensionResource(
                properties=models.ServiceGroupExtensionResourceProperties(description="valid")
            ),
            polling_interval=0,
        )
    ).result()
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"


@pytest.mark.asyncio
async def test_service_group_extension_resources_update(client):
    result = await client.service_group_extension_resources.update(
        service_group_id=SERVICE_GROUP_ID,
        service_group_extension_resource_name=RESOURCE_NAME,
        properties=models.ServiceGroupExtensionResource(
            properties=models.ServiceGroupExtensionResourceProperties(description="valid2")
        ),
    )
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid2"
    assert result.properties.provisioning_state == "Succeeded"


@pytest.mark.asyncio
async def test_service_group_extension_resources_delete(client):
    await client.service_group_extension_resources.delete(
        service_group_id=SERVICE_GROUP_ID, service_group_extension_resource_name=RESOURCE_NAME
    )


@pytest.mark.asyncio
async def test_service_group_extension_resources_list_by_service_group(client):
    result = [
        item
        async for item in client.service_group_extension_resources.list_by_service_group(
            service_group_id=SERVICE_GROUP_ID
        )
    ]
    assert len(result) == 1
    assert result[0].name == RESOURCE_NAME
    assert result[0].properties.description == "valid"
    assert result[0].properties.provisioning_state == "Succeeded"
