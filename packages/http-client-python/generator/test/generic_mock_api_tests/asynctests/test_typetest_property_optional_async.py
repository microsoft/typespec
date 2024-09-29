# cspell: ignore Hdvcmxk
# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Any
import pytest
from typetest.property.optional import models
from typetest.property.optional.aio import OptionalClient


@pytest.fixture
async def client():
    async with OptionalClient() as client:
        yield client


@pytest.mark.asyncio
async def test_boolean_literal(client):
    body = models.BooleanLiteralProperty(property=True)
    assert await client.boolean_literal.get_all() == body
    assert await client.boolean_literal.get_default() == models.BooleanLiteralProperty()
    await client.boolean_literal.put_all(body)
    await client.boolean_literal.put_default(models.BooleanLiteralProperty())


@pytest.mark.asyncio
async def test_bytes(client):
    body = models.BytesProperty(property="aGVsbG8sIHdvcmxkIQ==")
    assert await client.bytes.get_all() == body
    assert await client.bytes.get_default() == models.BytesProperty()
    await client.bytes.put_all(body)
    await client.bytes.put_default(models.BytesProperty())


@pytest.mark.asyncio
async def test_collections_byte(client):
    body = models.CollectionsByteProperty(property=["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="])
    assert await client.collections_byte.get_all() == body
    assert await client.collections_byte.get_default() == models.CollectionsByteProperty()
    await client.collections_byte.put_all(body)
    await client.collections_byte.put_default(models.CollectionsByteProperty())


@pytest.mark.asyncio
async def test_collections_model(client):
    body = models.CollectionsModelProperty(
        property=[
            models.StringProperty(property="hello"),
            models.StringProperty(property="world"),
        ]
    )
    assert await client.collections_model.get_all() == body
    assert await client.collections_model.get_default() == models.CollectionsModelProperty()
    await client.collections_model.put_all(body)
    await client.collections_model.put_default(models.CollectionsModelProperty())


@pytest.mark.asyncio
async def test_datetime(client):
    body = models.DatetimeProperty(property="2022-08-26T18:38:00Z")
    assert await client.datetime.get_all() == body
    assert await client.datetime.get_default() == models.DatetimeProperty()
    await client.datetime.put_all(body)
    await client.datetime.put_default(models.DatetimeProperty())


@pytest.mark.asyncio
async def test_duration(client):
    body = models.DurationProperty(property="P123DT22H14M12.011S")
    assert await client.duration.get_all() == body
    assert await client.duration.get_default() == models.DurationProperty()
    await client.duration.put_all(body)
    await client.duration.put_default(models.DurationProperty())


@pytest.mark.asyncio
async def test_float_literal(client):
    body = models.FloatLiteralProperty(property=1.25)
    assert await client.float_literal.get_all() == body
    assert await client.float_literal.get_default() == models.FloatLiteralProperty()
    await client.float_literal.put_all(body)
    await client.float_literal.put_default(models.FloatLiteralProperty())


@pytest.mark.asyncio
async def test_int_literal(client):
    body = models.IntLiteralProperty(property=1)
    assert await client.int_literal.get_all() == body
    assert await client.int_literal.get_default() == models.IntLiteralProperty()
    await client.int_literal.put_all(body)
    await client.int_literal.put_default(models.IntLiteralProperty())


@pytest.mark.asyncio
async def test_plaindate(client):
    body = models.PlainDateProperty(property="2022-12-12")
    assert await client.plain_date.get_all() == body


@pytest.mark.asyncio
async def test_plaindate(client):
    assert await client.plain_date.get_default() == models.PlainDateProperty()


@pytest.mark.asyncio
async def test_plaindate(client):
    body = models.PlainDateProperty(property="2022-12-12")
    await client.plain_date.put_all(body)


@pytest.mark.asyncio
async def test_plaindate(client):
    await client.plain_date.put_default(models.PlainDateProperty())


@pytest.mark.asyncio
async def test_plaintime(client):
    body = models.PlainTimeProperty(property="13:06:12")
    assert await client.plain_time.get_all() == body


@pytest.mark.asyncio
async def test_plaintime(client):
    assert await client.plain_time.get_default() == models.PlainTimeProperty()


@pytest.mark.asyncio
async def test_plaintime(client):
    body = models.PlainTimeProperty(property="13:06:12")
    await client.plain_time.put_all(body)


@pytest.mark.asyncio
async def test_plaintime(client):
    await client.plain_time.put_default(models.PlainTimeProperty())


@pytest.mark.asyncio
async def test_required_and_optional(client):
    all_body = {
        "optionalProperty": "hello",
        "requiredProperty": 42,
    }
    required_only_body = {
        "requiredProperty": 42,
    }
    assert await client.required_and_optional.get_all() == all_body
    assert await client.required_and_optional.get_required_only() == required_only_body
    await client.required_and_optional.put_all(all_body)
    await client.required_and_optional.put_required_only(required_only_body)


@pytest.mark.asyncio
async def test_string(client):
    body = models.StringProperty(property="hello")
    assert await client.string.get_all() == body
    assert await client.string.get_default() == models.StringProperty()
    await client.string.put_all(body)
    await client.string.put_default(models.StringProperty())


@pytest.mark.asyncio
async def test_string_literal(client):
    body = models.StringLiteralProperty(property="hello")
    assert await client.string_literal.get_all() == body
    assert await client.string_literal.get_default() == models.StringLiteralProperty()
    await client.string_literal.put_all(body)
    await client.string_literal.put_default(models.StringLiteralProperty())


@pytest.mark.asyncio
async def test_union_float_literal(client):
    body = models.UnionFloatLiteralProperty(property=2.375)
    assert await client.union_float_literal.get_all() == body
    assert await client.union_float_literal.get_default() == models.UnionFloatLiteralProperty()
    await client.union_float_literal.put_all(body)
    await client.union_float_literal.put_default(models.UnionFloatLiteralProperty())


@pytest.mark.asyncio
async def test_union_int_literal(client):
    body = models.UnionIntLiteralProperty(property=2)
    assert await client.union_int_literal.get_all() == body
    assert await client.union_int_literal.get_default() == models.UnionIntLiteralProperty()
    await client.union_int_literal.put_all(body)
    await client.union_int_literal.put_default(models.UnionIntLiteralProperty())


@pytest.mark.asyncio
async def test_union_string_literal(client):
    body = models.UnionStringLiteralProperty(property="world")
    assert await client.union_string_literal.get_all() == body
    assert await client.union_string_literal.get_default() == models.UnionStringLiteralProperty()
    await client.union_string_literal.put_all(body)
    await client.union_string_literal.put_default(models.UnionStringLiteralProperty())
