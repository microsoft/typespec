# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from specialheaders.repeatability.aio import RepeatabilityClient


@pytest_asyncio.fixture
async def client():
    async with RepeatabilityClient() as client:
        yield client


@pytest.mark.asyncio
async def test_immediate_success(client: RepeatabilityClient):
    cls = lambda x, y, z: z
    assert (await client.immediate_success(cls=cls))["Repeatability-Result"] == "accepted"
