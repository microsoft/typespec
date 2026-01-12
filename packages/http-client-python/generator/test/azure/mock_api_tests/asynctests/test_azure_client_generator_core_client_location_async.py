# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.clientlocation.parameter.aio import MoveMethodParameterToClient
from specs.azure.clientgenerator.core.clientlocation.subclient.aio import MoveToExistingSubClient
from specs.azure.clientgenerator.core.clientlocation.newsubclient.aio import MoveToNewSubClient
from specs.azure.clientgenerator.core.clientlocation.rootclient.aio import MoveToRootClient


@pytest.fixture
async def move_method_parameter_to_client():
    async with MoveMethodParameterToClient(storage_account="testaccount") as client:
        yield client


@pytest.fixture
async def move_to_existing_sub_client():
    async with MoveToExistingSubClient() as client:
        yield client


@pytest.fixture
async def move_to_new_sub_client():
    async with MoveToNewSubClient() as client:
        yield client


@pytest.fixture
async def move_to_root_client():
    async with MoveToRootClient() as client:
        yield client


@pytest.mark.asyncio
async def test_move_method_parameter_to_client_blob_operations_get_blob(
    move_method_parameter_to_client: MoveMethodParameterToClient,
):
    await move_method_parameter_to_client.blob_operations.get_blob(container="testcontainer", blob="testblob.txt")


@pytest.mark.asyncio
async def test_move_to_existing_sub_client_user_operations_get_user(
    move_to_existing_sub_client: MoveToExistingSubClient,
):
    await move_to_existing_sub_client.user_operations.get_user()


@pytest.mark.asyncio
async def test_move_to_existing_sub_client_admin_operations_delete_user(
    move_to_existing_sub_client: MoveToExistingSubClient,
):
    await move_to_existing_sub_client.admin_operations.delete_user()


@pytest.mark.asyncio
async def test_move_to_existing_sub_client_admin_operations_get_admin_info(
    move_to_existing_sub_client: MoveToExistingSubClient,
):
    await move_to_existing_sub_client.admin_operations.get_admin_info()


@pytest.mark.asyncio
async def test_move_to_new_sub_client_product_operations_list_products(move_to_new_sub_client: MoveToNewSubClient):
    await move_to_new_sub_client.product_operations.list_products()


@pytest.mark.asyncio
async def test_move_to_new_sub_client_archive_operations_archive_product(move_to_new_sub_client: MoveToNewSubClient):
    await move_to_new_sub_client.archive_operations.archive_product()


@pytest.mark.asyncio
async def test_move_to_root_client_resource_operations_get_resource(move_to_root_client: MoveToRootClient):
    await move_to_root_client.resource_operations.get_resource()


@pytest.mark.asyncio
async def test_move_to_root_client_get_health_status(move_to_root_client: MoveToRootClient):
    await move_to_root_client.get_health_status()
