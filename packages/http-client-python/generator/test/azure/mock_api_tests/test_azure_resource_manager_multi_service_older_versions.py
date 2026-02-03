# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.multiserviceolderversions.combined import CombinedClient
from azure.resourcemanager.multiserviceolderversions.combined.models import (
    VirtualMachine,
    Disk,
    VirtualMachineProperties,
    DiskProperties,
)


@pytest.fixture
def client(credential, authentication_policy):
    """Create a Combined client for testing."""
    return CombinedClient(
        credential=credential,
        subscription_id="00000000-0000-0000-0000-000000000000",
        base_url="http://localhost:3000",
        authentication_policy=authentication_policy,
        polling_interval=0.1,
    )


def test_virtual_machines_get(client):
    """Test getting a virtual machine."""
    resource_group_name = "test-rg"
    vm_name = "vm-old1"

    result = client.virtual_machines.get(resource_group_name=resource_group_name, vm_name=vm_name)

    assert result is not None
    assert isinstance(result, VirtualMachine)
    assert result.name == vm_name
    assert result.location == "eastus"
    assert result.properties is not None
    assert result.properties.provisioning_state == "Succeeded"
    assert result.properties.size == "Standard_D2s_v3"


def test_virtual_machines_create_or_update(client):
    """Test creating or updating a virtual machine."""
    resource_group_name = "test-rg"
    vm_name = "vm-old1"

    vm_resource = VirtualMachine(
        location="eastus",
        properties=VirtualMachineProperties(size="Standard_D2s_v3"),
    )

    poller = client.virtual_machines.begin_create_or_update(
        resource_group_name=resource_group_name,
        vm_name=vm_name,
        resource=vm_resource,
    )

    result = poller.result()
    assert result is not None
    assert isinstance(result, VirtualMachine)
    assert result.location == "eastus"
    assert result.properties is not None
    assert result.properties.provisioning_state == "Succeeded"
    assert result.properties.size == "Standard_D2s_v3"


def test_disks_get(client):
    """Test getting a disk."""
    resource_group_name = "test-rg"
    disk_name = "disk-old1"

    result = client.disks.get(resource_group_name=resource_group_name, disk_name=disk_name)

    assert result is not None
    assert isinstance(result, Disk)
    assert result.name == disk_name
    assert result.location == "eastus"
    assert result.properties is not None
    assert result.properties.provisioning_state == "Succeeded"
    assert result.properties.disk_size_gb == 128


def test_disks_create_or_update(client):
    """Test creating or updating a disk."""
    resource_group_name = "test-rg"
    disk_name = "disk-old1"

    disk_resource = Disk(
        location="eastus",
        properties=DiskProperties(disk_size_gb=128),
    )

    poller = client.disks.begin_create_or_update(
        resource_group_name=resource_group_name,
        disk_name=disk_name,
        resource=disk_resource,
    )

    result = poller.result()
    assert result is not None
    assert isinstance(result, Disk)
    assert result.location == "eastus"
    assert result.properties is not None
    assert result.properties.provisioning_state == "Succeeded"
    assert result.properties.disk_size_gb == 128
