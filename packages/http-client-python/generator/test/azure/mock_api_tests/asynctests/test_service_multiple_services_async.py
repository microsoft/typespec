# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.core.exceptions import HttpResponseError
from service.multipleservices.aio import ServiceAClient
from service.multipleservices.models import VersionsA


@pytest.fixture
def client():
    """Fixture that creates a ServiceAClient for testing."""
    return ServiceAClient(endpoint="http://localhost:3000")


@pytest.mark.asyncio
async def test_service_multiple_services_operation_a(client):
    async with client:
        async with ServiceAClient(endpoint="http://localhost:3000", api_version=VersionsA.AV1) as wrong_client:
            with pytest.raises(HttpResponseError):
                await wrong_client.operations.op_a()

        await client.operations.op_a()


@pytest.mark.asyncio
async def test_service_multiple_services_sub_namespace_operation_a(client):
    async with client:
        async with ServiceAClient(endpoint="http://localhost:3000", api_version=VersionsA.AV1) as wrong_client:
            with pytest.raises(HttpResponseError):
                await wrong_client.sub_namespace.sub_op_a()

        await client.sub_namespace.sub_op_a()
