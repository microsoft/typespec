# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.dictionary import DictionaryClient, models
import isodate


@pytest.fixture
def client():
    with DictionaryClient() as client:
        yield client


def test_boolean_value(client: DictionaryClient):
    value = {"k1": True, "k2": False}
    assert client.boolean_value.get() == value
    client.boolean_value.put(value)


def test_datetime_value(client: DictionaryClient):
    value = {"k1": isodate.parse_datetime("2022-08-26T18:38:00Z")}
    assert client.datetime_value.get() == value
    client.datetime_value.put(value)


def test_duration_value(client: DictionaryClient):
    value = {"k1": isodate.parse_duration("P123DT22H14M12.011S")}
    assert client.duration_value.get() == value
    client.duration_value.put(value)


def test_float32_value(client: DictionaryClient):
    value = {"k1": 43.125}
    assert client.float32_value.get() == value
    client.float32_value.put(value)


def test_int32_value(client: DictionaryClient):
    value = {"k1": 1, "k2": 2}
    assert client.int32_value.get() == value
    client.int32_value.put(value)


def test_int64_value(client: DictionaryClient):
    value = {"k1": 2**53 - 1, "k2": -(2**53 - 1)}
    assert client.int64_value.get() == value
    client.int64_value.put(value)


def test_model_value(client: DictionaryClient):
    value = {
        "k1": models.InnerModel(property="hello"),
        "k2": models.InnerModel(property="world"),
    }
    assert client.model_value.get() == value
    client.model_value.put(value)


def test_nullable_float_value(client: DictionaryClient):
    value = {"k1": 1.25, "k2": 0.5, "k3": None}
    assert client.nullable_float_value.get() == value
    client.nullable_float_value.put(value)


def test_recursive_model_value(client: DictionaryClient):
    value = {
        "k1": models.InnerModel(property="hello", children={}),
        "k2": models.InnerModel(property="world", children={"k2.1": models.InnerModel(property="inner world")}),
    }
    assert client.recursive_model_value.get() == value
    client.recursive_model_value.put(value)


def test_string_value(client: DictionaryClient):
    value = {"k1": "hello", "k2": ""}
    assert client.string_value.get() == value
    client.string_value.put(value)


def test_unknown_value(client: DictionaryClient):
    value = {"k1": 1, "k2": "hello", "k3": None}
    assert client.unknown_value.get() == value
    client.unknown_value.put(value)
