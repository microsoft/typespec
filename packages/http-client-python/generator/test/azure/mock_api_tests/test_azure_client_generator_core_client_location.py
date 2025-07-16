# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.clientlocation import ClientLocationClient


@pytest.fixture
def client():
    with ClientLocationClient() as client:
        yield client


def test_get_health_status(client: ClientLocationClient):
    client.get_health_status()


def test_archive_operations_archive_product(client: ClientLocationClient):
    client.archive_operations.archive_product()


def test_move_to_existing_sub_client_admin_operations_get_admin_info(client: ClientLocationClient):
    client.move_to_existing_sub_client.admin_operations.get_admin_info()


def test_move_to_existing_sub_client_admin_operations_delete_user(client: ClientLocationClient):
    client.move_to_existing_sub_client.admin_operations.delete_user()


def test_move_to_existing_sub_client_user_operations_get_user(client: ClientLocationClient):
    client.move_to_existing_sub_client.user_operations.get_user()


def test_move_to_new_sub_client_product_operations_list_products(client: ClientLocationClient):
    client.move_to_new_sub_client.product_operations.list_products()


def test_move_to_root_client_resource_operations_get_resource(client: ClientLocationClient):
    client.move_to_root_client.resource_operations.get_resource()
