# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from generation.subdir._generated.aio import RecursiveClient
from generation.subdir._generated.models import Extension


@pytest_asyncio.fixture
async def client():
    async with RecursiveClient() as client:
        yield client


@pytest.mark.asyncio
async def test_custom_method(client: RecursiveClient):
    assert await client.get() == Extension(
        {
            "level": 0,
            "extension": [{"level": 1, "extension": [{"level": 2}]}, {"level": 1}],
        }
    )
