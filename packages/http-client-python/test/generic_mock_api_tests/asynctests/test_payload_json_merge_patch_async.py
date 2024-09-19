# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from payload.jsonmergepatch.aio import JsonMergePatchClient
from payload.jsonmergepatch.models import InnerModel, Resource, ResourcePatch

try:
    from azure.core.serialization import NULL
except ImportError:
    from corehttp.serialization import NULL


@pytest.fixture
async def client():
    async with JsonMergePatchClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_create_resource(client: JsonMergePatchClient):
    inner_madge = InnerModel(name="InnerMadge", description="innerDesc")
    create_resource = Resource(
        name="Madge",
        description="desc",
        map={"key": inner_madge},
        array=[inner_madge],
        int_value=1,
        float_value=1.1,
        inner_model=inner_madge,
        int_array=[1, 2, 3],
    )
    response = await client.create_resource(create_resource)
    assert response == create_resource


@pytest.mark.asyncio
async def test_update_resource_model_input(client: JsonMergePatchClient):
    update_resource = ResourcePatch(
        description=NULL,
        map={"key": InnerModel(description=NULL), "key2": NULL},
        array=NULL,
        int_value=NULL,
        float_value=NULL,
        inner_model=NULL,
        int_array=NULL,
    )
    response = await client.update_resource(update_resource)
    assert response == Resource(name="Madge", map={"key": InnerModel(name="InnerMadge")})


@pytest.mark.asyncio
async def test_update_resource_raw_input(client: JsonMergePatchClient):
    response = await client.update_resource(
        {
            "description": None,
            "map": {"key": {"description": None}, "key2": None},
            "array": None,
            "intValue": None,
            "floatValue": None,
            "innerModel": None,
            "intArray": None,
        }
    )
    assert response == Resource(name="Madge", map={"key": InnerModel(name="InnerMadge")})


@pytest.mark.asyncio
async def test_update_optional_resource_model_input(client: JsonMergePatchClient):
    update_resource = ResourcePatch(
        description=NULL,
        map={"key": InnerModel(description=NULL), "key2": NULL},
        array=NULL,
        int_value=NULL,
        float_value=NULL,
        inner_model=NULL,
        int_array=NULL,
    )
    response = await client.update_optional_resource(update_resource)
    assert response == Resource(name="Madge", map={"key": InnerModel(name="InnerMadge")})


@pytest.mark.asyncio
async def test_update_optional_resource_raw_input(client: JsonMergePatchClient):
    response = await client.update_optional_resource(
        {
            "description": None,
            "map": {"key": {"description": None}, "key2": None},
            "array": None,
            "intValue": None,
            "floatValue": None,
            "innerModel": None,
            "intArray": None,
        }
    )
    assert response == Resource(name="Madge", map={"key": InnerModel(name="InnerMadge")})
