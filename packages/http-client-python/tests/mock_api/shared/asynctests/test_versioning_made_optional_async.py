# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from versioning.madeoptional.aio import MadeOptionalClient
from versioning.madeoptional.models import TestModel


@pytest.fixture
async def client():
    async with MadeOptionalClient(endpoint="http://localhost:3000", version="v2") as client:
        yield client


@pytest.mark.asyncio
async def test(client: MadeOptionalClient):
    assert await client.test(
        TestModel(prop="foo"),
    ) == TestModel(prop="foo")
