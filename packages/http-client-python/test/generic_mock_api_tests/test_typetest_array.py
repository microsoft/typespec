# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

import pytest
import isodate
from typetest.array import ArrayClient, models


@pytest.fixture
def client():
    with ArrayClient() as client:
        yield client


def test_boolean_value(client: ArrayClient):
    assert client.boolean_value.get() == [True, False]
    client.boolean_value.put([True, False])


def test_datetime_value(client: ArrayClient):
    assert client.datetime_value.get() == [isodate.parse_datetime("2022-08-26T18:38:00Z")]
    client.datetime_value.put([isodate.parse_datetime("2022-08-26T18:38:00Z")])


def test_duration_value(client: ArrayClient):
    assert client.duration_value.get() == [isodate.parse_duration("P123DT22H14M12.011S")]
    client.duration_value.put([isodate.parse_duration("P123DT22H14M12.011S")])


def test_float32_value(client: ArrayClient):
    assert client.float32_value.get() == [43.125]
    client.float32_value.put([43.125])


def test_int32_value(client: ArrayClient):
    assert client.int32_value.get() == [1, 2]
    client.int32_value.put([1, 2])


def test_int64_value(client: ArrayClient):
    assert client.int64_value.get() == [2**53 - 1, -(2**53 - 1)]
    client.int64_value.put([2**53 - 1, -(2**53 - 1)])


def test_model_value(client: ArrayClient):
    assert client.model_value.get() == [
        models.InnerModel(property="hello"),
        models.InnerModel(property="world"),
    ]
    client.model_value.put(
        [
            models.InnerModel(property="hello"),
            models.InnerModel(property="world"),
        ]
    )


def test_nullable_boolean_value(client: ArrayClient):
    assert client.nullable_boolean_value.get() == [True, None, False]
    client.nullable_boolean_value.put([True, None, False])


def test_nullable_float_value(client: ArrayClient):
    assert client.nullable_float_value.get() == [1.25, None, 3.0]
    client.nullable_float_value.put([1.25, None, 3.0])


def test_nullable_int32_value(client: ArrayClient):
    assert client.nullable_int32_value.get() == [1, None, 3]
    client.nullable_int32_value.put([1, None, 3])


def test_nullable_model_value(client: ArrayClient):
    assert client.nullable_model_value.get() == [
        models.InnerModel(property="hello"),
        None,
        models.InnerModel(property="world"),
    ]
    client.nullable_model_value.put(
        [
            models.InnerModel(property="hello"),
            None,
            models.InnerModel(property="world"),
        ]
    )


def test_nullable_string_value(client: ArrayClient):
    assert client.nullable_string_value.get() == ["hello", None, "world"]
    client.nullable_string_value.put(["hello", None, "world"])


def test_string_value(client: ArrayClient):
    assert client.string_value.get() == ["hello", ""]
    client.string_value.put(["hello", ""])


def test_unknown_value(client: ArrayClient):
    assert client.unknown_value.get() == [1, "hello", None]
    client.unknown_value.put([1, "hello", None])
