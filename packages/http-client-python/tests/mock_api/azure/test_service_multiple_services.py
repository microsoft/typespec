# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.core.exceptions import HttpResponseError
from service.multipleservices import ServiceAClient, ServiceBClient
from service.multipleservices.models import VersionsA, VersionsB


@pytest.fixture
def client_a():
    with ServiceAClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.fixture
def client_b():
    with ServiceBClient(endpoint="http://localhost:3000") as client:
        yield client


def test_service_multiple_services_service_a_operations(client_a):
    with pytest.raises(HttpResponseError):
        with ServiceAClient(endpoint="http://localhost:3000", api_version=VersionsA.AV1) as wrong_client:
            wrong_client.operations.op_a()

    client_a.operations.op_a()


def test_service_multiple_services_service_a_sub_namespace(client_a):
    with pytest.raises(HttpResponseError):
        with ServiceAClient(endpoint="http://localhost:3000", api_version=VersionsA.AV1) as wrong_client:
            wrong_client.sub_namespace.sub_op_a()

    client_a.sub_namespace.sub_op_a()


def test_service_multiple_services_service_b_operations(client_b):
    with pytest.raises(HttpResponseError):
        with ServiceBClient(endpoint="http://localhost:3000", api_version=VersionsB.BV1) as wrong_client:
            wrong_client.operations.op_b()

    client_b.operations.op_b()


def test_service_multiple_services_service_b_sub_namespace(client_b):
    with pytest.raises(HttpResponseError):
        with ServiceBClient(endpoint="http://localhost:3000", api_version=VersionsB.BV1) as wrong_client:
            wrong_client.sub_namespace.sub_op_b()

    client_b.sub_namespace.sub_op_b()
