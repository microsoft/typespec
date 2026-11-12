# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.managementgroup import ManagementGroupClient
from azure.resourcemanager.managementgroup import models

MANAGEMENT_GROUP_ID = "test-mg"
RESOURCE_NAME = "resource"


@pytest.fixture
def client(credential, authentication_policy):
    with ManagementGroupClient(
        credential, "http://localhost:3000", authentication_policy=authentication_policy
    ) as client:
        yield client


def test_management_group_child_resources_get(client):
    result = client.management_group_child_resources.get(
        management_group_id=MANAGEMENT_GROUP_ID, management_group_child_resource_name=RESOURCE_NAME
    )
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"


def test_management_group_child_resources_create_or_update(client):
    result = client.management_group_child_resources.begin_create_or_update(
        management_group_id=MANAGEMENT_GROUP_ID,
        management_group_child_resource_name=RESOURCE_NAME,
        resource=models.ManagementGroupChildResource(
            properties=models.ManagementGroupChildResourceProperties(description="valid")
        ),
        polling_interval=0,
    ).result()
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"


def test_management_group_child_resources_update(client):
    result = client.management_group_child_resources.update(
        management_group_id=MANAGEMENT_GROUP_ID,
        management_group_child_resource_name=RESOURCE_NAME,
        properties=models.ManagementGroupChildResource(
            properties=models.ManagementGroupChildResourceProperties(description="valid2")
        ),
    )
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid2"
    assert result.properties.provisioning_state == "Succeeded"


def test_management_group_child_resources_delete(client):
    client.management_group_child_resources.delete(
        management_group_id=MANAGEMENT_GROUP_ID, management_group_child_resource_name=RESOURCE_NAME
    )


def test_management_group_child_resources_list_by_management_group(client):
    result = list(
        client.management_group_child_resources.list_by_management_group(management_group_id=MANAGEMENT_GROUP_ID)
    )
    assert len(result) == 1
    assert result[0].name == RESOURCE_NAME
    assert result[0].properties.description == "valid"
    assert result[0].properties.provisioning_state == "Succeeded"
