# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from versioning.typechangedfrom.aio import TypeChangedFromClient
from versioning.typechangedfrom.models import TestModel


@pytest.fixture
async def client():
    async with TypeChangedFromClient(endpoint="http://localhost:3000", version="v2") as client:
        yield client


@pytest.mark.asyncio
async def test(client: TypeChangedFromClient):
    assert await client.test(
        TestModel(prop="foo", changed_prop="bar"),
        param="baz",
    ) == TestModel(prop="foo", changed_prop="bar")
