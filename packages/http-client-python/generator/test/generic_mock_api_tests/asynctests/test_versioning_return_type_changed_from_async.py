# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from versioning.returntypechangedfrom.aio import ReturnTypeChangedFromClient


@pytest.fixture
async def client():
    async with ReturnTypeChangedFromClient(endpoint="http://localhost:3000", version="v2") as client:
        yield client


@pytest.mark.asyncio
async def test(client: ReturnTypeChangedFromClient):
    assert await client.test("test") == "test"
