# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.clientlocation.aio import ClientLocationClient


@pytest.fixture
async def client():
    async with ClientLocationClient() as client:
        yield client


@pytest.mark.asyncio
async def test_get_health_status(client: ClientLocationClient):
    await client.get_health_status()


@pytest.mark.asyncio
async def test_archive_operations_archive_product(client: ClientLocationClient):
    await client.archive_operations.archive_product()


@pytest.mark.asyncio
async def test_move_to_existing_sub_client_admin_operations_get_admin_info(client: ClientLocationClient):
    await client.move_to_existing_sub_client.admin_operations.get_admin_info()


@pytest.mark.asyncio
async def test_move_to_existing_sub_client_admin_operations_delete_user(client: ClientLocationClient):
    await client.move_to_existing_sub_client.admin_operations.delete_user()


@pytest.mark.asyncio
async def test_move_to_existing_sub_client_user_operations_get_user(client: ClientLocationClient):
    await client.move_to_existing_sub_client.user_operations.get_user()


@pytest.mark.asyncio
async def test_move_to_new_sub_client_product_operations_list_products(client: ClientLocationClient):
    await client.move_to_new_sub_client.product_operations.list_products()


@pytest.mark.asyncio
async def test_move_to_root_client_resource_operations_get_resource(client: ClientLocationClient):
    await client.move_to_root_client.resource_operations.get_resource()
