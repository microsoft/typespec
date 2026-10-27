# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from service.multipleservices.servicea.aio import ServiceAClient
from service.multipleservices.serviceb.aio import ServiceBClient


@pytest_asyncio.fixture
async def client_a():
    async with ServiceAClient() as client:
        yield client


@pytest_asyncio.fixture
async def client_b():
    async with ServiceBClient() as client:
        yield client


@pytest.mark.asyncio
async def test_service_a_op(client_a: ServiceAClient):
    await client_a.operations.op_a()


@pytest.mark.asyncio
async def test_service_a_sub_namespace_op(client_a: ServiceAClient):
    await client_a.sub_namespace.sub_op_a()


@pytest.mark.asyncio
async def test_service_b_op(client_b: ServiceBClient):
    await client_b.operations.op_b()


@pytest.mark.asyncio
async def test_service_b_sub_namespace_op(client_b: ServiceBClient):
    await client_b.sub_namespace.sub_op_b()
