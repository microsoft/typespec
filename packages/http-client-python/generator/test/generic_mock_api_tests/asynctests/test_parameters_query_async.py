# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.query.aio import QueryClient


@pytest.fixture
async def client():
    async with QueryClient() as client:
        yield client


@pytest.mark.asyncio
async def test_constant(client: QueryClient):
    await client.constant.post()
