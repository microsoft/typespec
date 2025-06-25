# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.commonproperties import CommonPropertiesClient
from azure.resourcemanager.commonproperties import models
from azure.core import exceptions

SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000"
RESOURCE_GROUP_NAME = "test-rg"


@pytest.fixture
def client(credential, authentication_policy):
    with CommonPropertiesClient(
        credential, SUBSCRIPTION_ID, "http://localhost:3000", authentication_policy=authentication_policy
    ) as client:
        yield client


def test_managed_identity_get(client):
    result = client.managed_identity.get(
        resource_group_name=RESOURCE_GROUP_NAME, managed_identity_tracked_resource_name="identity"
    )
    assert result.location == "eastus"
    assert result.identity.type == "SystemAssigned"
    assert result.properties.provisioning_state == "Succeeded"


def test_managed_identity_create_with_system_assigned(client):
    result = client.managed_identity.create_with_system_assigned(
        resource_group_name=RESOURCE_GROUP_NAME,
        managed_identity_tracked_resource_name="identity",
        resource=models.ManagedIdentityTrackedResource(
            location="eastus", identity=models.ManagedServiceIdentity(type="SystemAssigned")
        ),
    )
    assert result.location == "eastus"
    assert result.identity.type == "SystemAssigned"
    assert result.properties.provisioning_state == "Succeeded"


def test_managed_identity_update_with_user_assigned_and_system_assigned(client):
    result = client.managed_identity.update_with_user_assigned_and_system_assigned(
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


def test_error_get_for_predefined_error(client):
    try:
        client.error.get_for_predefined_error(
            resource_group_name=RESOURCE_GROUP_NAME,
            confidential_resource_name="confidential",
        )
    except exceptions.ResourceNotFoundError as e:
        assert e.status_code == 404
        assert (
            e.error.message
            == "The Resource 'Azure.ResourceManager.CommonProperties/confidentialResources/confidential' under resource group 'test-rg' was not found."
        )


def test_error_create_for_user_defined_error(client):
    try:
        client.error.create_for_user_defined_error(
            resource_group_name=RESOURCE_GROUP_NAME,
            confidential_resource_name="confidential",
            resource=models.ConfidentialResource(
                location="eastus", properties=models.ConfidentialResourceProperties(username="00")
            ),
        )
    except exceptions.HttpResponseError as e:
        assert e.status_code == 400
        assert e.error.message == "Username should not contain only numbers."
