# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from server.path.multiple.aio import MultipleClient


@pytest_asyncio.fixture
async def client():
    async with MultipleClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_no_operation_params(client: MultipleClient):
    # await client.no_operation_params()
    pass


@pytest.mark.asyncio
async def test_with_operation_path_param(client: MultipleClient):
    # await client.with_operation_path_param(keyword="test")
    pass
