# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.servicegroupextension import ServiceGroupExtensionClient
from azure.resourcemanager.servicegroupextension import models

SERVICE_GROUP_ID = "test-sg"
RESOURCE_NAME = "resource"


@pytest.fixture
def client(credential, authentication_policy):
    with ServiceGroupExtensionClient(
        credential, "http://localhost:3000", authentication_policy=authentication_policy
    ) as client:
        yield client


def test_service_group_extension_resources_get(client):
    result = client.service_group_extension_resources.get(
        service_group_id=SERVICE_GROUP_ID, service_group_extension_resource_name=RESOURCE_NAME
    )
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"


def test_service_group_extension_resources_create_or_update(client):
    result = client.service_group_extension_resources.begin_create_or_update(
        service_group_id=SERVICE_GROUP_ID,
        service_group_extension_resource_name=RESOURCE_NAME,
        resource=models.ServiceGroupExtensionResource(
            properties=models.ServiceGroupExtensionResourceProperties(description="valid")
        ),
        polling_interval=0,
    ).result()
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid"
    assert result.properties.provisioning_state == "Succeeded"


def test_service_group_extension_resources_update(client):
    result = client.service_group_extension_resources.update(
        service_group_id=SERVICE_GROUP_ID,
        service_group_extension_resource_name=RESOURCE_NAME,
        properties=models.ServiceGroupExtensionResource(
            properties=models.ServiceGroupExtensionResourceProperties(description="valid2")
        ),
    )
    assert result.name == RESOURCE_NAME
    assert result.properties.description == "valid2"
    assert result.properties.provisioning_state == "Succeeded"


def test_service_group_extension_resources_delete(client):
    client.service_group_extension_resources.delete(
        service_group_id=SERVICE_GROUP_ID, service_group_extension_resource_name=RESOURCE_NAME
    )


def test_service_group_extension_resources_list_by_service_group(client):
    result = list(client.service_group_extension_resources.list_by_service_group(service_group_id=SERVICE_GROUP_ID))
    assert len(result) == 1
    assert result[0].name == RESOURCE_NAME
    assert result[0].properties.description == "valid"
    assert result[0].properties.provisioning_state == "Succeeded"
