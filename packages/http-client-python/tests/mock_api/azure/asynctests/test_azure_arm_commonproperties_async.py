# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from azure.resourcemanager.commonproperties.aio import CommonPropertiesClient
from azure.resourcemanager.commonproperties import models
from azure.core import exceptions

SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000"
RESOURCE_GROUP_NAME = "test-rg"

SIMPLE_ARM_ID = f"/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP_NAME}/providers/Microsoft.Network/virtualNetworks/myVnet"
ARM_ID_WITH_TYPE = SIMPLE_ARM_ID
ARM_ID_WITH_TYPE_AND_SCOPE = SIMPLE_ARM_ID
ARM_ID_WITH_ALL_SCOPES = f"/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP_NAME}/providers/Microsoft.Compute/virtualMachines/myVm"


@pytest_asyncio.fixture
async def client(credential, authentication_policy):
    async with CommonPropertiesClient(
        credential, SUBSCRIPTION_ID, "http://localhost:3000", authentication_policy=authentication_policy
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_managed_identity_get(client):
    result = await client.managed_identity.get(
        resource_group_name=RESOURCE_GROUP_NAME, managed_identity_tracked_resource_name="identity"
    )
    assert result.location == "eastus"
    assert result.identity.type == "SystemAssigned"
    assert result.properties.provisioning_state == "Succeeded"


@pytest.mark.asyncio
async def test_managed_identity_create_with_system_assigned(client):
    result = await client.managed_identity.create_with_system_assigned(
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
async def test_managed_identity_update_with_user_assigned_and_system_assigned(client):
    result = await client.managed_identity.update_with_user_assigned_and_system_assigned(
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


@pytest.mark.asyncio
async def test_error_get_for_predefined_error(client):
    try:
        await client.error.get_for_predefined_error(
            resource_group_name=RESOURCE_GROUP_NAME,
            confidential_resource_name="confidential",
        )
    except exceptions.ResourceNotFoundError as e:
        assert e.status_code == 404
        assert (
            e.error.message
            == "The Resource 'Azure.ResourceManager.CommonProperties/confidentialResources/confidential' under resource group 'test-rg' was not found."
        )


@pytest.mark.asyncio
async def test_error_create_for_user_defined_error(client):
    try:
        await client.error.create_for_user_defined_error(
            resource_group_name=RESOURCE_GROUP_NAME,
            confidential_resource_name="confidential",
            resource=models.ConfidentialResource(
                location="eastus", properties=models.ConfidentialResourceProperties(username="00")
            ),
        )
    except exceptions.HttpResponseError as e:
        assert e.status_code == 400
        assert e.error.message == "Username should not contain only numbers."


@pytest.mark.asyncio
async def test_arm_resource_identifiers_get(client):
    result = await client.arm_resource_identifiers.get(
        resource_group_name=RESOURCE_GROUP_NAME, arm_resource_identifier_resource_name="armId"
    )
    assert result.location == "eastus"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.properties.simple_arm_id == SIMPLE_ARM_ID
    assert result.properties.arm_id_with_type == ARM_ID_WITH_TYPE
    assert result.properties.arm_id_with_type_and_scope == ARM_ID_WITH_TYPE_AND_SCOPE
    assert result.properties.arm_id_with_all_scopes == ARM_ID_WITH_ALL_SCOPES


@pytest.mark.asyncio
async def test_arm_resource_identifiers_create_or_replace(client):
    result = await client.arm_resource_identifiers.create_or_replace(
        resource_group_name=RESOURCE_GROUP_NAME,
        arm_resource_identifier_resource_name="armId",
        resource=models.ArmResourceIdentifierResource(
            location="eastus",
            properties=models.ArmResourceIdentifierResourceProperties(
                simple_arm_id=SIMPLE_ARM_ID,
                arm_id_with_type=ARM_ID_WITH_TYPE,
                arm_id_with_type_and_scope=ARM_ID_WITH_TYPE_AND_SCOPE,
                arm_id_with_all_scopes=ARM_ID_WITH_ALL_SCOPES,
            ),
        ),
    )
    assert result.location == "eastus"
    assert result.properties.provisioning_state == "Succeeded"
    assert result.properties.simple_arm_id == SIMPLE_ARM_ID
    assert result.properties.arm_id_with_type == ARM_ID_WITH_TYPE
    assert result.properties.arm_id_with_type_and_scope == ARM_ID_WITH_TYPE_AND_SCOPE
    assert result.properties.arm_id_with_all_scopes == ARM_ID_WITH_ALL_SCOPES
