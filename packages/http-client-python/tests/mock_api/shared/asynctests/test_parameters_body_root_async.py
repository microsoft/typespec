# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from parameters.bodyroot.aio import BodyRootClient
from parameters.bodyroot.models import BodyRootModel


@pytest_asyncio.fixture
async def client():
    async with BodyRootClient() as client:
        yield client


@pytest.mark.asyncio
async def test_nested(client: BodyRootClient):
    await client.nested(BodyRootModel(category="widget", link_type="hard", was_successful=True))
