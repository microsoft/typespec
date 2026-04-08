# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from specs.azure.payload.pageable.aio import PageableClient


@pytest_asyncio.fixture
async def client():
    async with PageableClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_list(client: PageableClient):
    result = [p async for p in client.list(maxpagesize=3)]
    assert len(result) == 4
