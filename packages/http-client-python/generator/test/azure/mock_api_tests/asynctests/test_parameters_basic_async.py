# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.basic.aio import BasicClient
from parameters.basic.models import User


@pytest.fixture
async def client():
    async with BasicClient() as client:
        yield client


@pytest.mark.asyncio
async def test_explicit_simple(client: BasicClient):
    await client.explicit_body.simple(User(name="foo"))


@pytest.mark.asyncio
async def test_implicit_simple(client: BasicClient):
    await client.implicit_body.simple(name="foo")
