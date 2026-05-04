# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.clientlocation.parameter import MoveMethodParameterToClient
from specs.azure.clientgenerator.core.clientlocation.subclient import MoveToExistingSubClient
from specs.azure.clientgenerator.core.clientlocation.newsubclient import MoveToNewSubClient
from specs.azure.clientgenerator.core.clientlocation.rootclient import MoveToRootClient


@pytest.fixture
def move_method_parameter_to_client():
    with MoveMethodParameterToClient(storage_account="testaccount") as client:
        yield client


@pytest.fixture
def move_to_existing_sub_client():
    with MoveToExistingSubClient() as client:
        yield client


@pytest.fixture
def move_to_new_sub_client():
    with MoveToNewSubClient() as client:
        yield client


@pytest.fixture
def move_to_root_client():
    with MoveToRootClient() as client:
        yield client


def test_move_method_parameter_to_client_blob_operations_get_blob(
    move_method_parameter_to_client: MoveMethodParameterToClient,
):
    move_method_parameter_to_client.blob_operations.get_blob(container="testcontainer", blob="testblob.txt")


def test_move_to_existing_sub_client_user_operations_get_user(move_to_existing_sub_client: MoveToExistingSubClient):
    move_to_existing_sub_client.user_operations.get_user()


def test_move_to_existing_sub_client_admin_operations_delete_user(move_to_existing_sub_client: MoveToExistingSubClient):
    move_to_existing_sub_client.admin_operations.delete_user()


def test_move_to_existing_sub_client_admin_operations_get_admin_info(
    move_to_existing_sub_client: MoveToExistingSubClient,
):
    move_to_existing_sub_client.admin_operations.get_admin_info()


def test_move_to_new_sub_client_product_operations_list_products(move_to_new_sub_client: MoveToNewSubClient):
    move_to_new_sub_client.product_operations.list_products()


def test_move_to_new_sub_client_archive_operations_archive_product(move_to_new_sub_client: MoveToNewSubClient):
    move_to_new_sub_client.archive_operations.archive_product()


def test_move_to_root_client_resource_operations_get_resource(move_to_root_client: MoveToRootClient):
    move_to_root_client.resource_operations.get_resource()


def test_move_to_root_client_get_health_status(move_to_root_client: MoveToRootClient):
    move_to_root_client.get_health_status()
