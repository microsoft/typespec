# cspell: ignore Hdvcmxk
# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Any
import pytest
from typetest.property.optional import OptionalClient, models


@pytest.fixture
def client():
    with OptionalClient() as client:
        yield client


def test_boolean_literal(client):
    body = models.BooleanLiteralProperty(property=True)
    assert client.boolean_literal.get_all() == body
    assert client.boolean_literal.get_default() == models.BooleanLiteralProperty()
    client.boolean_literal.put_all(body)
    client.boolean_literal.put_default(models.BooleanLiteralProperty())


def test_bytes(client):
    body = models.BytesProperty(property="aGVsbG8sIHdvcmxkIQ==")
    assert client.bytes.get_all() == body
    assert client.bytes.get_default() == models.BytesProperty()
    client.bytes.put_all(body)
    client.bytes.put_default(models.BytesProperty())


def test_collections_byte(client):
    body = models.CollectionsByteProperty(property=["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="])
    assert client.collections_byte.get_all() == body
    assert client.collections_byte.get_default() == models.CollectionsByteProperty()
    client.collections_byte.put_all(body)
    client.collections_byte.put_default(models.CollectionsByteProperty())


def test_collections_model(client):
    body = models.CollectionsModelProperty(
        property=[
            models.StringProperty(property="hello"),
            models.StringProperty(property="world"),
        ]
    )
    assert client.collections_model.get_all() == body
    assert client.collections_model.get_default() == models.CollectionsModelProperty()
    client.collections_model.put_all(body)
    client.collections_model.put_default(models.CollectionsModelProperty())


def test_datetime(client):
    body = models.DatetimeProperty(property="2022-08-26T18:38:00Z")
    assert client.datetime.get_all() == body
    assert client.datetime.get_default() == models.DatetimeProperty()
    client.datetime.put_all(body)
    client.datetime.put_default(models.DatetimeProperty())


def test_duration(client):
    body = models.DurationProperty(property="P123DT22H14M12.011S")
    assert client.duration.get_all() == body
    assert client.duration.get_default() == models.DurationProperty()
    client.duration.put_all(body)
    client.duration.put_default(models.DurationProperty())


def test_float_literal(client):
    body = models.FloatLiteralProperty(property=1.25)
    assert client.float_literal.get_all() == body
    assert client.float_literal.get_default() == models.FloatLiteralProperty()
    client.float_literal.put_all(body)
    client.float_literal.put_default(models.FloatLiteralProperty())


def test_int_literal(client):
    body = models.IntLiteralProperty(property=1)
    assert client.int_literal.get_all() == body
    assert client.int_literal.get_default() == models.IntLiteralProperty()
    client.int_literal.put_all(body)
    client.int_literal.put_default(models.IntLiteralProperty())


def test_plaindate_get_all(client):
    body = models.PlainDateProperty(property="2022-12-12")
    assert client.plain_date.get_all() == body


def test_plaindate_get_default(client):
    assert client.plain_date.get_default() == models.PlainDateProperty()


def test_plaindate_put_all(client):
    body = models.PlainDateProperty(property="2022-12-12")
    client.plain_date.put_all(body)


def test_plaindate_put_default(client):
    client.plain_date.put_default(models.PlainDateProperty())


def test_plaintime_get_all(client):
    body = models.PlainTimeProperty(property="13:06:12")
    assert client.plain_time.get_all() == body


def test_plaintime_get_default(client):
    assert client.plain_time.get_default() == models.PlainTimeProperty()


def test_plaintime_put_all(client):
    body = models.PlainTimeProperty(property="13:06:12")
    client.plain_time.put_all(body)


def test_plaintime_put_default(client):
    client.plain_time.put_default(models.PlainTimeProperty())


def test_required_and_optional(client):
    all_body = {
        "optionalProperty": "hello",
        "requiredProperty": 42,
    }
    required_only_body = {
        "requiredProperty": 42,
    }
    assert client.required_and_optional.get_all() == all_body
    assert client.required_and_optional.get_required_only() == required_only_body
    client.required_and_optional.put_all(all_body)
    client.required_and_optional.put_required_only(required_only_body)


def test_string(client):
    body = models.StringProperty(property="hello")
    assert client.string.get_all() == body
    assert client.string.get_default() == models.StringProperty()
    client.string.put_all(body)
    client.string.put_default(models.StringProperty())


def test_string_literal(client):
    body = models.StringLiteralProperty(property="hello")
    assert client.string_literal.get_all() == body
    assert client.string_literal.get_default() == models.StringLiteralProperty()
    client.string_literal.put_all(body)
    client.string_literal.put_default(models.StringLiteralProperty())


def test_union_float_literal(client):
    body = models.UnionFloatLiteralProperty(property=2.375)
    assert client.union_float_literal.get_all() == body
    assert client.union_float_literal.get_default() == models.UnionFloatLiteralProperty()
    client.union_float_literal.put_all(body)
    client.union_float_literal.put_default(models.UnionFloatLiteralProperty())


def test_union_int_literal(client):
    body = models.UnionIntLiteralProperty(property=2)
    assert client.union_int_literal.get_all() == body
    assert client.union_int_literal.get_default() == models.UnionIntLiteralProperty()
    client.union_int_literal.put_all(body)
    client.union_int_literal.put_default(models.UnionIntLiteralProperty())


def test_union_string_literal(client):
    body = models.UnionStringLiteralProperty(property="world")
    assert client.union_string_literal.get_all() == body
    assert client.union_string_literal.get_default() == models.UnionStringLiteralProperty()
    client.union_string_literal.put_all(body)
    client.union_string_literal.put_default(models.UnionStringLiteralProperty())
