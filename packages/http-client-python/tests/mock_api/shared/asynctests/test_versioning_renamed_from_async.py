# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from versioning.renamedfrom.aio import RenamedFromClient
from versioning.renamedfrom.models import NewModel, NewEnum


@pytest.fixture
async def client():
    async with RenamedFromClient(endpoint="http://localhost:3000", version="v2") as client:
        yield client


@pytest.mark.asyncio
async def test_new_op(client: RenamedFromClient):
    assert await client.new_op(
        NewModel(new_prop="foo", enum_prop=NewEnum.NEW_ENUM_MEMBER, union_prop=10),
        new_query="bar",
    ) == NewModel(new_prop="foo", enum_prop=NewEnum.NEW_ENUM_MEMBER, union_prop=10)


@pytest.mark.asyncio
async def test_new_interface_test(client: RenamedFromClient):
    assert await client.new_interface.new_op_in_new_interface(
        NewModel(new_prop="foo", enum_prop=NewEnum.NEW_ENUM_MEMBER, union_prop=10)
    ) == NewModel(new_prop="foo", enum_prop=NewEnum.NEW_ENUM_MEMBER, union_prop=10)
