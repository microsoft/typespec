# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.core.exceptions import HttpResponseError
from service.multipleservices import ServiceAClient
from service.multipleservices.models import VersionsA


@pytest.fixture
def client():
    """Fixture that creates a ServiceAClient for testing."""
    with ServiceAClient(endpoint="http://localhost:3000") as client:
        yield client


def test_service_multiple_services_operation_a(client):
    with ServiceAClient(endpoint="http://localhost:3000", api_version=VersionsA.AV1) as wrong_client:
        with pytest.raises(HttpResponseError):
            wrong_client.operations.op_a()

    client.operations.op_a()


def test_service_multiple_services_sub_namespace_operation_a(client):
    with ServiceAClient(endpoint="http://localhost:3000", api_version=VersionsA.AV1) as wrong_client:
        with pytest.raises(HttpResponseError):
            wrong_client.sub_namespace.sub_op_a()

    client.sub_namespace.sub_op_a()
