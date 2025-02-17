# cspell: ignore Hdvcmxk
# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import decimal

import pytest
import datetime
from typetest.property.valuetypes import models
from typetest.property.valuetypes.aio import ValueTypesClient


@pytest.fixture
async def client():
    async with ValueTypesClient() as client:
        yield client


@pytest.mark.asyncio
async def test_boolean(client: ValueTypesClient):
    body = models.BooleanProperty(property=True)
    assert body.property == body["property"]
    await client.boolean.put(body)

    resp = await client.boolean.get()
    assert resp.property == resp["property"] == True


@pytest.mark.asyncio
async def test_boolean_literal(client: ValueTypesClient):
    body = models.BooleanLiteralProperty(property=True)
    assert body.property == body["property"]
    await client.boolean_literal.put(body)

    resp = await client.boolean_literal.get()
    assert resp.property == resp["property"] == True


@pytest.mark.asyncio
async def test_bytes(client: ValueTypesClient):
    body = models.BytesProperty(property=b"hello, world!")
    assert body.property == b"hello, world!"
    assert body["property"] == "aGVsbG8sIHdvcmxkIQ=="
    await client.bytes.put(body)

    resp = await client.bytes.get()
    assert resp.property == b"hello, world!"
    assert resp["property"] == "aGVsbG8sIHdvcmxkIQ=="


@pytest.mark.asyncio
async def test_collections_int(client: ValueTypesClient):
    body = models.CollectionsIntProperty(property=[1, 2])
    assert body.property == body["property"]
    await client.collections_int.put(body)

    resp = await client.collections_int.get()
    assert resp.property == resp["property"] == [1, 2]


@pytest.mark.asyncio
async def test_collections_model(client: ValueTypesClient):
    body = models.CollectionsModelProperty(property=[{"property": "hello"}, {"property": "world"}])
    assert body.property[0].property == body["property"][0]["property"]
    await client.collections_model.put(body)

    resp = await client.collections_model.get()
    assert resp.property[1].property == resp["property"][1]["property"]


@pytest.mark.asyncio
async def test_collections_string(client: ValueTypesClient):
    body = models.CollectionsStringProperty(property=["hello", "world"])
    assert body.property == body["property"]
    await client.collections_string.put(body)

    resp = await client.collections_string.get()
    assert resp.property == resp["property"] == ["hello", "world"]


@pytest.mark.asyncio
async def test_datetime(client):
    received_body = await client.datetime.get()
    assert received_body == {"property": "2022-08-26T18:38:00Z"}
    assert received_body.property.year == 2022
    assert received_body.property.month == 8
    assert received_body.property.day == 26
    assert received_body.property.hour == 18
    assert received_body.property.minute == 38

    await client.datetime.put(models.DatetimeProperty(property=datetime.datetime(2022, 8, 26, hour=18, minute=38)))


@pytest.mark.asyncio
async def test_decimal(client: ValueTypesClient):
    body = models.DecimalProperty(property=decimal.Decimal("0.33333"))
    assert body.property == decimal.Decimal("0.33333")
    assert body["property"] == 0.33333
    await client.decimal.put(body)

    resp = await client.decimal.get()
    assert resp.property == decimal.Decimal("0.33333")
    assert resp["property"] == 0.33333


@pytest.mark.asyncio
async def test_decimal128(client: ValueTypesClient):
    body = models.Decimal128Property(property=decimal.Decimal("0.33333"))
    assert body.property == decimal.Decimal("0.33333")
    assert body["property"] == 0.33333
    await client.decimal128.put(body)

    resp = await client.decimal128.get()
    assert resp.property == decimal.Decimal("0.33333")
    assert resp["property"] == 0.33333


@pytest.mark.asyncio
async def test_dictionary_string(client: ValueTypesClient):
    body = models.DictionaryStringProperty(property={"k1": "hello", "k2": "world"})
    assert body.property == body["property"]
    await client.dictionary_string.put(body)

    resp = await client.dictionary_string.get()
    assert resp.property == resp["property"] == {"k1": "hello", "k2": "world"}


@pytest.mark.asyncio
async def test_duration(client: ValueTypesClient):
    body = models.DurationProperty(property="P123DT22H14M12.011S")
    assert body.property == datetime.timedelta(days=123, seconds=80052, microseconds=11000)
    assert body["property"] == "P123DT22H14M12.011S"
    await client.duration.put(body)

    resp = await client.duration.get()
    assert resp.property == datetime.timedelta(days=123, seconds=80052, microseconds=11000)
    assert resp["property"] == "P123DT22H14M12.011S"


@pytest.mark.asyncio
async def test_enum(client: ValueTypesClient):
    body = models.EnumProperty(property=models.InnerEnum.VALUE_ONE)
    assert body.property == body["property"]
    await client.enum.put(body)

    resp = await client.enum.get()
    assert resp.property == resp["property"] == "ValueOne"


@pytest.mark.asyncio
async def test_extensible_enum(client: ValueTypesClient):
    body = models.ExtensibleEnumProperty(property="UnknownValue")
    assert body.property == body["property"]
    await client.extensible_enum.put(body)

    resp = await client.extensible_enum.get()
    assert resp.property == resp["property"] == "UnknownValue"


@pytest.mark.asyncio
async def test_float(client: ValueTypesClient):
    body = models.FloatProperty(property=43.125)
    assert body.property == body["property"]
    await client.float.put(body)

    resp = await client.float.get()
    assert resp.property == resp["property"] == 43.125


@pytest.mark.asyncio
async def test_float_literal(client: ValueTypesClient):
    body = models.FloatLiteralProperty(property=43.125)
    assert body.property == body["property"]
    await client.float_literal.put(body)

    resp = await client.float_literal.get()
    assert resp.property == resp["property"] == 43.125


@pytest.mark.asyncio
async def test_int(client: ValueTypesClient):
    body = models.IntProperty(property=42)
    assert body.property == body["property"]
    await client.int_operations.put(body)

    resp = await client.int_operations.get()
    assert resp.property == resp["property"] == 42


@pytest.mark.asyncio
async def test_int_literal(client: ValueTypesClient):
    body = models.IntLiteralProperty(property=42)
    assert body.property == body["property"]
    await client.int_literal.put(body)

    resp = await client.int_literal.get()
    assert resp.property == resp["property"] == 42


@pytest.mark.asyncio
async def test_model(client: ValueTypesClient):
    body = models.ModelProperty(property={"property": "hello"})
    assert body.property.property == body["property"]["property"]
    await client.model.put(body)

    resp = await client.model.get()
    assert resp.property.property == resp["property"]["property"]


@pytest.mark.asyncio
async def test_never(client: ValueTypesClient):
    assert await client.never.get() == models.NeverProperty()
    await client.never.put(models.NeverProperty())


@pytest.mark.asyncio
async def test_string(client: ValueTypesClient):
    body = models.StringProperty(property="hello")
    assert body.property == body["property"]
    await client.string.put(body)

    resp = await client.string.get()
    assert resp.property == resp["property"] == "hello"


@pytest.mark.asyncio
async def test_string_literal(client: ValueTypesClient):
    body = models.StringLiteralProperty(property="hello")
    assert body.property == body["property"]
    await client.string_literal.put(body)

    resp = await client.string_literal.get()
    assert resp.property == resp["property"] == "hello"


@pytest.mark.asyncio
async def test_union_enum_value(client: ValueTypesClient):
    body = models.UnionEnumValueProperty(property=models.ExtendedEnum.ENUM_VALUE2)
    assert body.property == body["property"]
    await client.union_enum_value.put(body)

    resp = await client.union_enum_value.get()
    assert resp.property == resp["property"] == "value2"


@pytest.mark.asyncio
async def test_union_float_literal(client: ValueTypesClient):
    body = models.UnionFloatLiteralProperty(property=46.875)
    assert body.property == body["property"]
    await client.union_float_literal.put(body)

    resp = await client.union_float_literal.get()
    assert resp.property == resp["property"] == 46.875


@pytest.mark.asyncio
async def test_union_int_literal(client: ValueTypesClient):
    body = models.UnionIntLiteralProperty(property=42)
    assert body.property == body["property"]
    await client.union_int_literal.put(body)

    resp = await client.union_int_literal.get()
    assert resp.property == resp["property"] == 42


@pytest.mark.asyncio
async def test_union_string_literal(client: ValueTypesClient):
    body = models.UnionStringLiteralProperty(property="world")
    assert body.property == body["property"]
    await client.union_string_literal.put(body)

    resp = await client.union_string_literal.get()
    assert resp.property == resp["property"] == "world"


@pytest.mark.asyncio
async def test_unknown_array(client: ValueTypesClient):
    body = models.UnknownArrayProperty(property=["hello", "world"])
    assert body.property == body["property"]
    await client.unknown_array.put(body)

    resp = await client.unknown_array.get()
    assert resp.property == resp["property"] == ["hello", "world"]


@pytest.mark.asyncio
async def test_unknown_dict(client: ValueTypesClient):
    body = models.UnknownDictProperty(property={"k1": "hello", "k2": 42})
    assert body.property == body["property"]
    await client.unknown_dict.put(body)

    resp = await client.unknown_dict.get()
    assert resp.property == resp["property"] == {"k1": "hello", "k2": 42}


@pytest.mark.asyncio
async def test_unknown_int(client: ValueTypesClient):
    body = models.UnknownIntProperty(property=42)
    assert body.property == body["property"]
    await client.unknown_int.put(body)

    resp = await client.unknown_int.get()
    assert resp.property == resp["property"] == 42


@pytest.mark.asyncio
async def test_unknown_string(client: ValueTypesClient):
    body = models.UnknownStringProperty(property="hello")
    assert body.property == body["property"]
    await client.unknown_string.put(body)

    resp = await client.unknown_string.get()
    assert resp.property == resp["property"] == "hello"
