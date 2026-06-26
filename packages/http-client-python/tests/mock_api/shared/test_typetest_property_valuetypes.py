# cspell: ignore Hdvcmxk
# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from calendar import c
import decimal

import pytest
import datetime
from typetest.property.valuetypes import ValueTypesClient, models


@pytest.fixture
def client():
    with ValueTypesClient() as client:
        yield client


def test_boolean(client: ValueTypesClient):
    body = models.BooleanProperty(property=True)
    assert body.property == body["property"]
    client.boolean.put(body)

    resp = client.boolean.get()
    assert resp.property == resp["property"] == True


def test_boolean_literal(client: ValueTypesClient):
    body = models.BooleanLiteralProperty(property=True)
    assert body.property == body["property"]
    client.boolean_literal.put(body)

    resp = client.boolean_literal.get()
    assert resp.property == resp["property"] == True


def test_bytes(client: ValueTypesClient):
    body = models.BytesProperty(property=b"hello, world!")
    assert body.property == b"hello, world!"
    assert body["property"] == "aGVsbG8sIHdvcmxkIQ=="
    client.bytes.put(body)

    resp = client.bytes.get()
    assert resp.property == b"hello, world!"
    assert resp["property"] == "aGVsbG8sIHdvcmxkIQ=="


def test_collections_int(client: ValueTypesClient):
    body = models.CollectionsIntProperty(property=[1, 2])
    assert body.property == body["property"]
    client.collections_int.put(body)

    resp = client.collections_int.get()
    assert resp.property == resp["property"] == [1, 2]


def test_collections_model(client: ValueTypesClient):
    body = models.CollectionsModelProperty(property=[{"property": "hello"}, {"property": "world"}])
    assert body.property[0].property == body["property"][0]["property"]
    client.collections_model.put(body)

    resp = client.collections_model.get()
    assert resp.property[1].property == resp["property"][1]["property"]


def test_collections_string(client: ValueTypesClient):
    body = models.CollectionsStringProperty(property=["hello", "world"])
    assert body.property == body["property"]
    client.collections_string.put(body)

    resp = client.collections_string.get()
    assert resp.property == resp["property"] == ["hello", "world"]


def test_datetime(client):
    received_body = client.datetime.get()
    assert received_body == {"property": "2022-08-26T18:38:00Z"}
    assert received_body.property.year == 2022
    assert received_body.property.month == 8
    assert received_body.property.day == 26
    assert received_body.property.hour == 18
    assert received_body.property.minute == 38

    client.datetime.put(models.DatetimeProperty(property=datetime.datetime(2022, 8, 26, hour=18, minute=38)))


def test_decimal(client: ValueTypesClient):
    body = models.DecimalProperty(property=decimal.Decimal("0.33333"))
    assert body.property == decimal.Decimal("0.33333")
    assert body["property"] == 0.33333
    client.decimal.put(body)

    resp = client.decimal.get()
    assert resp.property == decimal.Decimal("0.33333")
    assert resp["property"] == 0.33333


def test_decimal128(client: ValueTypesClient):
    body = models.Decimal128Property(property=decimal.Decimal("0.33333"))
    assert body.property == decimal.Decimal("0.33333")
    assert body["property"] == 0.33333
    client.decimal128.put(body)

    resp = client.decimal128.get()
    assert resp.property == decimal.Decimal("0.33333")
    assert resp["property"] == 0.33333


def test_dictionary_string(client: ValueTypesClient):
    body = models.DictionaryStringProperty(property={"k1": "hello", "k2": "world"})
    assert body.property == body["property"]
    client.dictionary_string.put(body)

    resp = client.dictionary_string.get()
    assert resp.property == resp["property"] == {"k1": "hello", "k2": "world"}


def test_duration(client: ValueTypesClient):
    body = models.DurationProperty(property="P123DT22H14M12.011S")
    assert body.property == datetime.timedelta(days=123, seconds=80052, microseconds=11000)
    assert body["property"] == "P123DT22H14M12.011S"
    client.duration.put(body)

    resp = client.duration.get()
    assert resp.property == datetime.timedelta(days=123, seconds=80052, microseconds=11000)
    assert resp["property"] == "P123DT22H14M12.011S"


def test_enum(client: ValueTypesClient):
    body = models.EnumProperty(property=models.InnerEnum.VALUE_ONE)
    assert body.property == body["property"]
    client.enum.put(body)

    resp = client.enum.get()
    assert resp.property == resp["property"] == "ValueOne"


def test_extensible_enum(client: ValueTypesClient):
    body = models.ExtensibleEnumProperty(property="UnknownValue")
    assert body.property == body["property"]
    client.extensible_enum.put(body)

    resp = client.extensible_enum.get()
    assert resp.property == resp["property"] == "UnknownValue"


def test_float(client: ValueTypesClient):
    body = models.FloatProperty(property=43.125)
    assert body.property == body["property"]
    client.float.put(body)

    resp = client.float.get()
    assert resp.property == resp["property"] == 43.125


def test_float_literal(client: ValueTypesClient):
    body = models.FloatLiteralProperty(property=43.125)
    assert body.property == body["property"]
    client.float_literal.put(body)

    resp = client.float_literal.get()
    assert resp.property == resp["property"] == 43.125


def test_int(client: ValueTypesClient):
    body = models.IntProperty(property=42)
    assert body.property == body["property"]
    client.int_operations.put(body)

    resp = client.int_operations.get()
    assert resp.property == resp["property"] == 42


def test_int_literal(client: ValueTypesClient):
    body = models.IntLiteralProperty(property=42)
    assert body.property == body["property"]
    client.int_literal.put(body)

    resp = client.int_literal.get()
    assert resp.property == resp["property"] == 42


def test_model(client: ValueTypesClient):
    body = models.ModelProperty(property={"property": "hello"})
    assert body.property.property == body["property"]["property"]
    client.model.put(body)

    resp = client.model.get()
    assert resp.property.property == resp["property"]["property"]


def test_never(client: ValueTypesClient):
    assert client.never.get() == models.NeverProperty()
    client.never.put(models.NeverProperty())


def test_string(client: ValueTypesClient):
    body = models.StringProperty(property="hello")
    assert body.property == body["property"]
    client.string.put(body)

    resp = client.string.get()
    assert resp.property == resp["property"] == "hello"


def test_string_literal(client: ValueTypesClient):
    body = models.StringLiteralProperty(property="hello")
    assert body.property == body["property"]
    client.string_literal.put(body)

    resp = client.string_literal.get()
    assert resp.property == resp["property"] == "hello"


def test_union_enum_value(client: ValueTypesClient):
    body = models.UnionEnumValueProperty(property=models.ExtendedEnum.ENUM_VALUE2)
    assert body.property == body["property"]
    client.union_enum_value.put(body)

    resp = client.union_enum_value.get()
    assert resp.property == resp["property"] == "value2"


def test_union_float_literal(client: ValueTypesClient):
    body = models.UnionFloatLiteralProperty(property=46.875)
    assert body.property == body["property"]
    client.union_float_literal.put(body)

    resp = client.union_float_literal.get()
    assert resp.property == resp["property"] == 46.875


def test_union_int_literal(client: ValueTypesClient):
    body = models.UnionIntLiteralProperty(property=42)
    assert body.property == body["property"]
    client.union_int_literal.put(body)

    resp = client.union_int_literal.get()
    assert resp.property == resp["property"] == 42


def test_union_string_literal(client: ValueTypesClient):
    body = models.UnionStringLiteralProperty(property="world")
    assert body.property == body["property"]
    client.union_string_literal.put(body)

    resp = client.union_string_literal.get()
    assert resp.property == resp["property"] == "world"


def test_unknown_array(client: ValueTypesClient):
    body = models.UnknownArrayProperty(property=["hello", "world"])
    assert body.property == body["property"]
    client.unknown_array.put(body)

    resp = client.unknown_array.get()
    assert resp.property == resp["property"] == ["hello", "world"]


def test_unknown_dict(client: ValueTypesClient):
    body = models.UnknownDictProperty(property={"k1": "hello", "k2": 42})
    assert body.property == body["property"]
    client.unknown_dict.put(body)

    resp = client.unknown_dict.get()
    assert resp.property == resp["property"] == {"k1": "hello", "k2": 42}


def test_unknown_int(client: ValueTypesClient):
    body = models.UnknownIntProperty(property=42)
    assert body.property == body["property"]
    client.unknown_int.put(body)

    resp = client.unknown_int.get()
    assert resp.property == resp["property"] == 42


def test_unknown_string(client: ValueTypesClient):
    body = models.UnknownStringProperty(property="hello")
    assert body.property == body["property"]
    client.unknown_string.put(body)

    resp = client.unknown_string.get()
    assert resp.property == resp["property"] == "hello"
