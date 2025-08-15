# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.operationtemplates import OperationTemplatesClient
from azure.resourcemanager.operationtemplates import models

SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000"
RESOURCE_GROUP_NAME = "test-rg"


@pytest.fixture
def client(credential, authentication_policy):
    with OperationTemplatesClient(
        credential,
        SUBSCRIPTION_ID,
        "http://localhost:3000",
        authentication_policy=authentication_policy,
        polling_interval=0,
    ) as client:
        yield client


def test_check_name_availability_check_global(client):
    result = client.check_name_availability.check_global(
        body=models.CheckNameAvailabilityRequest(name="checkName", type="Microsoft.Web/site")
    )
    assert result.name_available == False
    assert result.reason == models.CheckNameAvailabilityReason.ALREADY_EXISTS
    assert result.message == "Hostname 'checkName' already exists. Please select a different name."


def test_check_name_availability_check_local(client):
    result = client.check_name_availability.check_local(
        location="westus",
        body=models.CheckNameAvailabilityRequest(name="checkName", type="Microsoft.Web/site"),
    )
    assert result.name_available == False
    assert result.reason == models.CheckNameAvailabilityReason.ALREADY_EXISTS
    assert result.message == "Hostname 'checkName' already exists. Please select a different name."


def test_operations_list(client):
    result = client.operations.list().next()
    assert result.name == "Microsoft.Compute/virtualMachines/write"
    assert result.display.operation == "Create or Update Virtual Machine."
    assert result.origin == "user,system"
    assert result.action_type == "Internal"


def test_lro_begin_create_or_replace(client):
    result = client.lro.begin_create_or_replace(
        resource_group_name=RESOURCE_GROUP_NAME,
        order_name="order1",
        resource=models.Order(
            location="eastus",
            properties=models.OrderProperties(product_id="product1", amount=1),
        ),
    ).result()
    assert result.name == "order1"
    assert (
        result.id
        == "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.OperationTemplates/orders/order1"
    )
    assert result.type == "Azure.ResourceManager.Resources/orders"
    assert result.location == "eastus"
    assert result.system_data.created_by == "AzureSDK"


def test_lro_begin_export(client):
    client.lro.begin_export(
        resource_group_name=RESOURCE_GROUP_NAME,
        order_name="order1",
        body=models.ExportRequest(format="csv"),
    ).result()


def test_lro_begin_delete(client):
    client.lro.begin_delete(
        resource_group_name=RESOURCE_GROUP_NAME,
        order_name="order1",
    ).result()


def test_optional_body_get(client):
    result = client.optional_body.get(
        resource_group_name=RESOURCE_GROUP_NAME,
        widget_name="widget1",
    )
    assert result.name == "widget1"
    assert (
        result.id
        == "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.OperationTemplates/widgets/widget1"
    )
    assert result.type == "Azure.ResourceManager.OperationTemplates/widgets"
    assert result.location == "eastus"
    assert result.properties.name == "widget1"
    assert result.properties.description == "A test widget"
    assert result.properties.provisioning_state == "Succeeded"


def test_optional_body_patch_without_body(client):
    result = client.optional_body.patch(
        resource_group_name=RESOURCE_GROUP_NAME,
        widget_name="widget1",
    )
    assert result.name == "widget1"
    assert result.properties.name == "widget1"
    assert result.properties.description == "A test widget"


def test_optional_body_patch_with_body(client):
    result = client.optional_body.patch(
        resource_group_name=RESOURCE_GROUP_NAME,
        widget_name="widget1",
        properties=models.Widget(
            location="eastus",
            properties=models.WidgetProperties(name="updated-widget", description="Updated description"),
        ),
    )
    assert result.name == "widget1"
    assert result.properties.name == "updated-widget"
    assert result.properties.description == "Updated description"


def test_optional_body_post_without_body(client):
    result = client.optional_body.post(
        resource_group_name=RESOURCE_GROUP_NAME,
        widget_name="widget1",
    )
    assert result.result == "Action completed successfully"


def test_optional_body_post_with_body(client):
    result = client.optional_body.post(
        resource_group_name=RESOURCE_GROUP_NAME,
        widget_name="widget1",
        body=models.ActionRequest(action_type="perform", parameters="test-parameters"),
    )
    assert result.result == "Action completed successfully with parameters"


def test_optional_body_provider_post_without_body(client):
    result = client.optional_body.provider_post()
    assert result.total_allowed == 50
    assert result.status == "Changed to default allowance"


def test_optional_body_provider_post_with_body(client):
    result = client.optional_body.provider_post(
        body=models.ChangeAllowanceRequest(total_allowed=100, reason="Increased demand"),
    )
    assert result.total_allowed == 100
    assert result.status == "Changed to requested allowance"
