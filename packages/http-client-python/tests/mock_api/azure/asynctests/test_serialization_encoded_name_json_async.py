# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from serialization.encodedname.json.aio import JsonClient
from serialization.encodedname.json import models


@pytest.fixture
async def client():
    async with JsonClient() as client:
        yield client


@pytest.mark.asyncio
async def test_property_send(client: JsonClient):
    await client.property.send(models.JsonEncodedNameModel(default_name=True))


@pytest.mark.asyncio
async def test_property_get(client: JsonClient):
    assert (await client.property.get()).default_name
