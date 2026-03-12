# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.multiservicesharedmodels.combined.aio import CombinedClient
from azure.resourcemanager.multiservicesharedmodels.combined.models import (
    VirtualMachine,
    VirtualMachineProperties,
    StorageAccount,
    StorageAccountProperties,
    SharedMetadata,
)


@pytest.fixture
async def client(credential, authentication_policy):
    """Create a Combined async client for testing."""
    return CombinedClient(
        credential=credential,
        subscription_id="00000000-0000-0000-0000-000000000000",
        base_url="http://localhost:3000",
        authentication_policy=authentication_policy,
        polling_interval=0.1,
    )


@pytest.mark.asyncio
async def test_virtual_machines_get(client):
    """Test getting a virtual machine with shared metadata."""
    resource_group_name = "test-rg"
    vm_name = "vm-shared1"

    result = await client.virtual_machines.get(resource_group_name=resource_group_name, vm_name=vm_name)

    assert result is not None
    assert isinstance(result, VirtualMachine)
    assert result.name == vm_name
    assert result.location == "eastus"
    assert result.type == "Microsoft.Compute/virtualMachinesShared"
    assert result.properties is not None
    assert result.properties.provisioning_state == "Succeeded"
    assert result.properties.metadata is not None
    assert result.properties.metadata.created_by == "user@example.com"
    assert result.properties.metadata.tags == {"environment": "production"}


@pytest.mark.asyncio
async def test_virtual_machines_create_or_update(client):
    """Test creating or updating a virtual machine with shared metadata."""
    resource_group_name = "test-rg"
    vm_name = "vm-shared1"

    vm_resource = VirtualMachine(
        location="eastus",
        properties=VirtualMachineProperties(
            metadata=SharedMetadata(
                created_by="user@example.com",
                tags={"environment": "production"},
            ),
        ),
    )

    poller = await client.virtual_machines.begin_create_or_update(
        resource_group_name=resource_group_name,
        vm_name=vm_name,
        resource=vm_resource,
    )

    result = await poller.result()
    assert result is not None
    assert isinstance(result, VirtualMachine)
    assert result.location == "eastus"
    assert result.properties is not None
    assert result.properties.provisioning_state == "Succeeded"
    assert result.properties.metadata is not None
    assert result.properties.metadata.created_by == "user@example.com"
    assert result.properties.metadata.tags == {"environment": "production"}


@pytest.mark.asyncio
async def test_storage_accounts_get(client):
    """Test getting a storage account with shared metadata."""
    resource_group_name = "test-rg"
    account_name = "account1"

    result = await client.storage_accounts.get(resource_group_name=resource_group_name, account_name=account_name)

    assert result is not None
    assert isinstance(result, StorageAccount)
    assert result.name == account_name
    assert result.location == "westus"
    assert result.type == "Microsoft.Storage/storageAccounts"
    assert result.properties is not None
    assert result.properties.provisioning_state == "Succeeded"
    assert result.properties.metadata is not None
    assert result.properties.metadata.created_by == "admin@example.com"
    assert result.properties.metadata.tags == {"department": "engineering"}


@pytest.mark.asyncio
async def test_storage_accounts_create_or_update(client):
    """Test creating or updating a storage account with shared metadata."""
    resource_group_name = "test-rg"
    account_name = "account1"

    storage_resource = StorageAccount(
        location="westus",
        properties=StorageAccountProperties(
            metadata=SharedMetadata(
                created_by="admin@example.com",
                tags={"department": "engineering"},
            ),
        ),
    )

    poller = await client.storage_accounts.begin_create_or_update(
        resource_group_name=resource_group_name,
        account_name=account_name,
        resource=storage_resource,
    )

    result = await poller.result()
    assert result is not None
    assert isinstance(result, StorageAccount)
    assert result.location == "westus"
    assert result.properties is not None
    assert result.properties.provisioning_state == "Succeeded"
    assert result.properties.metadata is not None
    assert result.properties.metadata.created_by == "admin@example.com"
    assert result.properties.metadata.tags == {"department": "engineering"}
