# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.core.exceptions import HttpResponseError
from service.multipleservices.aio import ServiceAClient, ServiceBClient
from service.multipleservices.models import VersionsB


@pytest.fixture
def service_b_client():
    """Fixture that creates a ServiceBClient for testing."""
    return ServiceBClient(endpoint="http://localhost:3000")


@pytest.mark.asyncio
async def test_service_multiple_services_both_clients_exist():
    """Verify that multiple services without explicit @client create separate root clients."""
    async with ServiceAClient(endpoint="http://localhost:3000") as a_client:
        assert a_client is not None
    async with ServiceBClient(endpoint="http://localhost:3000") as b_client:
        assert b_client is not None


@pytest.mark.asyncio
async def test_service_multiple_services_operation_b(service_b_client):
    async with service_b_client:
        async with ServiceBClient(endpoint="http://localhost:3000", api_version=VersionsB.BV1) as wrong_client:
            with pytest.raises(HttpResponseError):
                await wrong_client.operations.op_b()

        await service_b_client.operations.op_b()


@pytest.mark.asyncio
async def test_service_multiple_services_sub_namespace_operation_b(service_b_client):
    async with service_b_client:
        async with ServiceBClient(endpoint="http://localhost:3000", api_version=VersionsB.BV1) as wrong_client:
            with pytest.raises(HttpResponseError):
                await wrong_client.sub_namespace.sub_op_b()

        await service_b_client.sub_namespace.sub_op_b()
