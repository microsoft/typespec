# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from parameters.query.aio import QueryClient


@pytest_asyncio.fixture
async def client():
    async with QueryClient() as client:
        yield client


@pytest.mark.asyncio
async def test_constant(client: QueryClient):
    await client.constant.post()


@pytest.mark.asyncio
async def test_special_char_dollar_sign(client: QueryClient):
    await client.special_char.dollar_sign(filter="status eq 'active'")
