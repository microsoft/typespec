# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from azure.resourcemanager.managementgroup.aio import ManagementGroupClient
from azure.resourcemanager.managementgroup import models

MANAGEMENT_GROUP_ID = "test-mg"
RESOURCE_NAME = "resource"


@pytest_asyncio.fixture
async def client(credential, authentication_policy):
    async with ManagementGroupClient(
        credential, "http://localhost:3000", authentication_policy=authentication_policy
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_management_group_child_resources_get(client):
    result = await client.management_group_child_resources.get(
        management_group_id=MANAGEMENT_GROUP_ID, management_group_child_resource_name=RESOURCE_NAME
    )
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"


@pytest.mark.asyncio
async def test_management_group_child_resources_create_or_update(client):
    result = await (
        await client.management_group_child_resources.begin_create_or_update(
            management_group_id=MANAGEMENT_GROUP_ID,
            management_group_child_resource_name=RESOURCE_NAME,
            resource=models.ManagementGroupChildResource(
                properties=models.ManagementGroupChildResourceProperties(description="valid")
            ),
            polling_interval=0,
        )
    ).result()
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"


@pytest.mark.asyncio
async def test_management_group_child_resources_update(client):
    result = await client.management_group_child_resources.update(
        management_group_id=MANAGEMENT_GROUP_ID,
        management_group_child_resource_name=RESOURCE_NAME,
        properties=models.ManagementGroupChildResource(
            properties=models.ManagementGroupChildResourceProperties(description="valid2")
        ),
    )
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid2"
    assert result.properties.provisioning_state == "Succeeded"


@pytest.mark.asyncio
async def test_management_group_child_resources_delete(client):
    await client.management_group_child_resources.delete(
        management_group_id=MANAGEMENT_GROUP_ID, management_group_child_resource_name=RESOURCE_NAME
    )


@pytest.mark.asyncio
async def test_management_group_child_resources_list_by_management_group(client):
    result = [
        item
        async for item in client.management_group_child_resources.list_by_management_group(
            management_group_id=MANAGEMENT_GROUP_ID
        )
    ]
    assert len(result) == 1
    assert result[0].name == RESOURCE_NAME
    assert result[0].properties.description == "valid"
    assert result[0].properties.provisioning_state == "Succeeded"
