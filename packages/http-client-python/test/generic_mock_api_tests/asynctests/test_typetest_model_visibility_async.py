# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.visibility.aio import VisibilityClient
from typetest.model.visibility import models


@pytest.fixture
async def client():
    async with VisibilityClient() as client:
        yield client


@pytest.mark.asyncio
async def test_get_model(client):
    result = await client.get_model(models.VisibilityModel(query_prop=123))
    assert result == models.VisibilityModel(read_prop="abc")


@pytest.mark.asyncio
async def test_put_model(client):
    await client.put_model(models.VisibilityModel(create_prop=["foo", "bar"], update_prop=[1, 2]))


@pytest.mark.asyncio
async def test_patch_model(client):
    await client.patch_model(models.VisibilityModel(update_prop=[1, 2]))


@pytest.mark.asyncio
async def test_post_model(client):
    await client.post_model(models.VisibilityModel(create_prop=["foo", "bar"]))


@pytest.mark.asyncio
async def test_delete_model(client):
    await client.delete_model(models.VisibilityModel(delete_prop=True))


@pytest.mark.asyncio
async def test_put_read_only_model(client):
    await client.put_read_only_model(
        models.ReadOnlyModel(optional_nullable_int_list=[1, 2], optional_string_record={"foo", "bar"})
    )
