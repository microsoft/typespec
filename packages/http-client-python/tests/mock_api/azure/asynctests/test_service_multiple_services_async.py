# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.core.exceptions import HttpResponseError
from service.multipleservices.aio import ServiceAClient, ServiceBClient
from service.multipleservices.models import VersionsA, VersionsB


@pytest.fixture
def client_a():
    return ServiceAClient(endpoint="http://localhost:3000")


@pytest.fixture
def client_b():
    return ServiceBClient(endpoint="http://localhost:3000")


@pytest.mark.asyncio
async def test_service_multiple_services_service_a_operations(client_a):
    with pytest.raises(HttpResponseError):
        async with ServiceAClient(endpoint="http://localhost:3000", api_version=VersionsA.AV1) as wrong_client:
            await wrong_client.operations.op_a()

    await client_a.operations.op_a()


@pytest.mark.asyncio
async def test_service_multiple_services_service_a_sub_namespace(client_a):
    with pytest.raises(HttpResponseError):
        async with ServiceAClient(endpoint="http://localhost:3000", api_version=VersionsA.AV1) as wrong_client:
            await wrong_client.sub_namespace.sub_op_a()

    await client_a.sub_namespace.sub_op_a()


@pytest.mark.asyncio
async def test_service_multiple_services_service_b_operations(client_b):
    with pytest.raises(HttpResponseError):
        async with ServiceBClient(endpoint="http://localhost:3000", api_version=VersionsB.BV1) as wrong_client:
            await wrong_client.operations.op_b()

    await client_b.operations.op_b()


@pytest.mark.asyncio
async def test_service_multiple_services_service_b_sub_namespace(client_b):
    with pytest.raises(HttpResponseError):
        async with ServiceBClient(endpoint="http://localhost:3000", api_version=VersionsB.BV1) as wrong_client:
            await wrong_client.sub_namespace.sub_op_b()

    await client_b.sub_namespace.sub_op_b()
