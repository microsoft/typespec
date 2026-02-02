# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from versioning.removed.aio import RemovedClient
from versioning.removed.models import ModelV2, EnumV2, ModelV3, EnumV3


@pytest.fixture
async def client():
    async with RemovedClient(endpoint="http://localhost:3000", version="v2") as client:
        yield client


@pytest.mark.asyncio
async def test_v2(client: RemovedClient):
    assert await client.v2(ModelV2(prop="foo", enum_prop=EnumV2.ENUM_MEMBER_V2, union_prop="bar")) == ModelV2(
        prop="foo", enum_prop=EnumV2.ENUM_MEMBER_V2, union_prop="bar"
    )


@pytest.mark.asyncio
async def test_model_v3():
    async with RemovedClient(endpoint="http://localhost:3000", version="v1") as client1:
        model1 = ModelV3(id="123", enum_prop=EnumV3.ENUM_MEMBER_V1)
        result = await client1.model_v3(model1)
        assert result == model1

    async with RemovedClient(endpoint="http://localhost:3000", version="v2preview") as client2:
        model2 = ModelV3(id="123")
        result = await client2.model_v3(model2)
        assert result == model2

    async with RemovedClient(endpoint="http://localhost:3000", version="v2") as client3:
        model3 = ModelV3(id="123", enum_prop=EnumV3.ENUM_MEMBER_V1)
        result = await client3.model_v3(model3)
        assert result == model3
