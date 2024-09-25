# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.core.lro.standard.aio import StandardClient
from specs.azure.core.lro.standard.models import User, ExportedUser


@pytest.fixture
async def client():
    async with StandardClient() as client:
        yield client


@pytest.mark.asyncio
async def test_lro_core_put(client, async_polling_method):
    user = User({"name": "madge", "role": "contributor"})
    result = await (
        await client.begin_create_or_replace(
            name=user.name, resource=user, polling_interval=0, polling=async_polling_method
        )
    ).result()
    assert result == user


@pytest.mark.asyncio
async def test_lro_core_delete(client, async_polling_method):
    await (await client.begin_delete(name="madge", polling_interval=0, polling=async_polling_method)).result()


@pytest.mark.asyncio
async def test_lro_core_export(client, async_polling_method):
    export_user = ExportedUser({"name": "madge", "resourceUri": "/users/madge"})
    result = await (
        await client.begin_export(name="madge", format="json", polling_interval=0, polling=async_polling_method)
    ).result()
    assert result == export_user
