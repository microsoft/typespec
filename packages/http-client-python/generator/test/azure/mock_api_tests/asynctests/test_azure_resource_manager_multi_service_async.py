# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.core.exceptions import HttpResponseError
from azure.resourcemanager.multiservice.combined.aio import CombinedClient
from azure.resourcemanager.multiservice.combined.models import VirtualMachine, Disk


@pytest.fixture
async def client(credential, authentication_policy):
    """Create a Combined async client for testing."""
    return CombinedClient(
        credential=credential,
        subscription_id="00000000-0000-0000-0000-000000000000",
        base_url="http://localhost:3000",
        authentication_policy=authentication_policy,
        polling_interval=0.1,  # Speed up tests by reducing polling interval
    )


@pytest.mark.asyncio
async def test_virtual_machines_get(client):
    resource_group_name = "test-rg"
    vm_name = "vm1"

    with pytest.raises(HttpResponseError):
        await client.virtual_machines.get(
            resource_group_name=resource_group_name,
            vm_name=vm_name,
            api_version="av1",  # invalid api version shall raise error
        )

    result = await client.virtual_machines.get(resource_group_name=resource_group_name, vm_name=vm_name)

    assert result is not None
    assert isinstance(result, VirtualMachine)
    assert result.name == vm_name


@pytest.mark.asyncio
async def test_virtual_machines_create_or_update(client):
    resource_group_name = "test-rg"
    vm_name = "vm1"

    vm_resource = VirtualMachine(location="eastus", properties={})

    with pytest.raises(HttpResponseError):
        poller = await client.virtual_machines.begin_create_or_update(
            resource_group_name=resource_group_name,
            vm_name=vm_name,
            resource=vm_resource,
            api_version="av1",  # invalid api version shall raise error
        )
        await poller.result()

    poller = await client.virtual_machines.begin_create_or_update(
        resource_group_name=resource_group_name, vm_name=vm_name, resource=vm_resource
    )

    result = await poller.result()
    assert result is not None
    assert isinstance(result, VirtualMachine)
    assert result.location == "eastus"


@pytest.mark.asyncio
async def test_disks_get(client):
    resource_group_name = "test-rg"
    disk_name = "disk1"
    with pytest.raises(HttpResponseError):
        await client.disks.get(
            resource_group_name=resource_group_name,
            disk_name=disk_name,
            api_version="av1",  # invalid api version shall raise error
        )

    result = await client.disks.get(resource_group_name=resource_group_name, disk_name=disk_name)

    assert result is not None
    assert isinstance(result, Disk)
    assert result.name == disk_name


@pytest.mark.asyncio
async def test_disks_create_or_update(client):
    resource_group_name = "test-rg"
    disk_name = "disk1"

    disk_resource = Disk(location="eastus", properties={})

    with pytest.raises(HttpResponseError):
        poller = await client.disks.begin_create_or_update(
            resource_group_name=resource_group_name,
            disk_name=disk_name,
            resource=disk_resource,
            api_version="av1",  # invalid api version shall raise error
        )
        await poller.result()

    poller = await client.disks.begin_create_or_update(
        resource_group_name=resource_group_name, disk_name=disk_name, resource=disk_resource
    )

    result = await poller.result()
    assert result is not None
    assert isinstance(result, Disk)
    assert result.location == "eastus"
