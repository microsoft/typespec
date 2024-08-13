# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from versioning.removed.aio import RemovedClient
from versioning.removed.models import ModelV2, EnumV2


@pytest.fixture
async def client():
    async with RemovedClient(endpoint="http://localhost:3000", version="v2") as client:
        yield client


@pytest.mark.asyncio
async def test_v2(client: RemovedClient):
    assert await client.v2(ModelV2(prop="foo", enum_prop=EnumV2.ENUM_MEMBER_V2, union_prop="bar")) == ModelV2(
        prop="foo", enum_prop=EnumV2.ENUM_MEMBER_V2, union_prop="bar"
    )
