# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from server.path.single.aio import SingleClient


@pytest.fixture
async def client():
    async with SingleClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_my_op(client):
    assert await client.my_op() is True
