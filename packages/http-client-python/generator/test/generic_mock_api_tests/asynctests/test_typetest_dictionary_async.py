# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.dictionary import models
from typetest.dictionary.aio import DictionaryClient
import isodate


@pytest.fixture
async def client():
    async with DictionaryClient() as client:
        yield client


@pytest.mark.asyncio
async def test_boolean_value(client: DictionaryClient):
    value = {"k1": True, "k2": False}
    assert await client.boolean_value.get() == value
    await client.boolean_value.put(value)


@pytest.mark.asyncio
async def test_datetime_value(client: DictionaryClient):
    value = {"k1": isodate.parse_datetime("2022-08-26T18:38:00Z")}
    assert await client.datetime_value.get() == value
    await client.datetime_value.put(value)


@pytest.mark.asyncio
async def test_duration_value(client: DictionaryClient):
    value = {"k1": isodate.parse_duration("P123DT22H14M12.011S")}
    assert await client.duration_value.get() == value
    await client.duration_value.put(value)


@pytest.mark.asyncio
async def test_float32_value(client: DictionaryClient):
    value = {"k1": 43.125}
    assert await client.float32_value.get() == value
    await client.float32_value.put(value)


@pytest.mark.asyncio
async def test_int32_value(client: DictionaryClient):
    value = {"k1": 1, "k2": 2}
    assert await client.int32_value.get() == value
    await client.int32_value.put(value)


@pytest.mark.asyncio
async def test_int64_value(client: DictionaryClient):
    value = {"k1": 2**53 - 1, "k2": -(2**53 - 1)}
    assert await client.int64_value.get() == value
    await client.int64_value.put(value)


@pytest.mark.asyncio
async def test_model_value(client: DictionaryClient):
    value = {
        "k1": models.InnerModel(property="hello"),
        "k2": models.InnerModel(property="world"),
    }
    assert await client.model_value.get() == value
    await client.model_value.put(value)


@pytest.mark.asyncio
async def test_nullable_float_value(client: DictionaryClient):
    value = {"k1": 1.25, "k2": 0.5, "k3": None}
    assert await client.nullable_float_value.get() == value
    await client.nullable_float_value.put(value)


@pytest.mark.asyncio
async def test_recursive_model_value(client: DictionaryClient):
    value = {
        "k1": models.InnerModel(property="hello", children={}),
        "k2": models.InnerModel(property="world", children={"k2.1": models.InnerModel(property="inner world")}),
    }
    assert await client.recursive_model_value.get() == value
    await client.recursive_model_value.put(value)


@pytest.mark.asyncio
async def test_string_value(client: DictionaryClient):
    value = {"k1": "hello", "k2": ""}
    assert await client.string_value.get() == value
    await client.string_value.put(value)


@pytest.mark.asyncio
async def test_unknown_value(client: DictionaryClient):
    value = {"k1": 1, "k2": "hello", "k3": None}
    assert await client.unknown_value.get() == value
    await client.unknown_value.put(value)
