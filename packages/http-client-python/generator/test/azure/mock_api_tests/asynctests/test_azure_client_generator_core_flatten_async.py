# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.flattenproperty.aio import FlattenPropertyClient
from specs.azure.clientgenerator.core.flattenproperty.models import (
    FlattenModel,
    ChildModel,
    NestedFlattenModel,
    ChildFlattenModel,
)


@pytest.fixture
async def client():
    async with FlattenPropertyClient() as client:
        yield client


# ========== test for cadl-ranch ==========


@pytest.mark.asyncio
async def test_put_flatten_model(client: FlattenPropertyClient):
    resp = FlattenModel(name="test", properties=ChildModel(age=1, description="test"))
    assert (
        await client.put_flatten_model(FlattenModel(name="foo", properties=ChildModel(age=10, description="bar")))
        == resp
    )
    assert await client.put_flatten_model(FlattenModel(name="foo", age=10, description="bar")) == resp


@pytest.mark.asyncio
async def test_put_nested_flatten_model(client: FlattenPropertyClient):
    # python doesn't support nested flatten model
    assert await client.put_nested_flatten_model(
        NestedFlattenModel(
            name="foo",
            properties=ChildFlattenModel(summary="bar", properties=ChildModel(age=10, description="test")),
        )
    ) == NestedFlattenModel(
        name="test",
        properties=ChildFlattenModel(summary="test", properties=ChildModel(age=1, description="foo")),
    )


@pytest.mark.asyncio  # ============test for compatibility ============
async def test_dpg_model_common():
    flatten_model = FlattenModel(name="hello", properties=ChildModel(age=0, description="test"))
    assert flatten_model.name == "hello"
    assert flatten_model.properties.age == 0
    assert flatten_model.properties.description == "test"


@pytest.mark.asyncio
async def test_dpg_model_none():
    flatten_model = FlattenModel()
    assert flatten_model.name is None
    assert flatten_model.properties is None
    assert flatten_model.age is None
    assert flatten_model.description is None


@pytest.mark.asyncio
async def test_dpg_model_compatibility():
    flatten_model = FlattenModel(description="test", age=0)
    assert flatten_model.description == "test"
    assert flatten_model.age == 0
    assert flatten_model.properties.description == "test"
    assert flatten_model.properties.age == 0


@pytest.mark.asyncio
async def test_dpg_model_setattr():
    flatten_model = FlattenModel()

    flatten_model.age = 0
    assert flatten_model.properties.age == 0
    flatten_model.description = "test"
    assert flatten_model.properties.description == "test"

    flatten_model.properties.age = 1
    assert flatten_model.age == 1
    flatten_model.properties.description = "test2"
    assert flatten_model.description == "test2"


@pytest.mark.asyncio
async def test_dpg_model_exception():
    with pytest.raises(AttributeError):
        FlattenModel().no_prop
