# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.path.aio import PathClient


@pytest.fixture
async def client():
    async with PathClient() as client:
        yield client


@pytest.mark.asyncio
async def test_normal(client: PathClient):
    await client.normal("foo")


@pytest.mark.asyncio
async def test_optional(client: PathClient):
    await client.optional()
    await client.optional(name="foo")
