# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.recursive.aio import RecursiveClient
from typetest.model.recursive.models import Extension


@pytest.fixture
async def client():
    async with RecursiveClient() as client:
        yield client


@pytest.fixture
async def expected():
    return Extension(
        {
            "level": 0,
            "extension": [{"level": 1, "extension": [{"level": 2}]}, {"level": 1}],
        }
    )


@pytest.mark.asyncio
async def test_put(client: RecursiveClient, expected: Extension):
    await client.put(expected)


@pytest.mark.asyncio
async def test_get(client: RecursiveClient, expected: Extension):
    assert await client.get() == expected
