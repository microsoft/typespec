# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.models.commontypes.managedidentity.aio import ManagedIdentityClient
from azure.resourcemanager.models.commontypes.managedidentity import models

SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000"
RESOURCE_GROUP_NAME = "test-rg"


@pytest.fixture
async def client(credential, authentication_policy):
    async with ManagedIdentityClient(
        credential, SUBSCRIPTION_ID, "http://localhost:3000", authentication_policy=authentication_policy
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_managed_identity_tracked_resources_get(client):
    result = await client.managed_identity_tracked_resources.get(
        resource_group_name=RESOURCE_GROUP_NAME, managed_identity_tracked_resource_name="identity"
    )
    assert result.location == "eastus"
    assert result.identity.type == "SystemAssigned"
    assert result.properties.provisioning_state == "Succeeded"


@pytest.mark.asyncio
async def test_managed_identity_tracked_resources_create_with_system_assigned(client):
    result = await client.managed_identity_tracked_resources.create_with_system_assigned(
        resource_group_name=RESOURCE_GROUP_NAME,
        managed_identity_tracked_resource_name="identity",
        resource=models.ManagedIdentityTrackedResource(
            location="eastus", identity=models.ManagedServiceIdentity(type="SystemAssigned")
        ),
    )
    assert result.location == "eastus"
    assert result.identity.type == "SystemAssigned"
    assert result.properties.provisioning_state == "Succeeded"


@pytest.mark.asyncio
async def test_managed_identity_tracked_resources_update_with_user_assigned_and_system_assigned(client):
    result = await client.managed_identity_tracked_resources.update_with_user_assigned_and_system_assigned(
        resource_group_name=RESOURCE_GROUP_NAME,
        managed_identity_tracked_resource_name="identity",
        properties=models.ManagedIdentityTrackedResource(
            location="eastus",
            identity=models.ManagedServiceIdentity(
                type="SystemAssigned,UserAssigned",
                user_assigned_identities={
                    "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id1": models.UserAssignedIdentity()
                },
            ),
        ),
    )
    assert result.location == "eastus"
    assert result.identity.type == "SystemAssigned,UserAssigned"
    assert result.properties.provisioning_state == "Succeeded"
