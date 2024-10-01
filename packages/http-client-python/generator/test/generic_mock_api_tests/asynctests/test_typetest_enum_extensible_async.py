# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.enum.extensible import models, aio


@pytest.fixture
async def client():
    async with aio.ExtensibleClient() as client:
        yield client


@pytest.mark.asyncio
async def test_known_value(client):
    assert await client.string.get_known_value() == models.DaysOfWeekExtensibleEnum.MONDAY
    await client.string.put_known_value(models.DaysOfWeekExtensibleEnum.MONDAY)


@pytest.mark.asyncio
async def test_unknown_value(client):
    assert await client.string.get_unknown_value() == "Weekend"
    await client.string.put_unknown_value("Weekend")
