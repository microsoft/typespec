# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import datetime
import pytest
from encode.duration import DurationClient
from encode.duration.models import (
    DefaultDurationProperty,
    ISO8601DurationProperty,
    Int32SecondsDurationProperty,
    FloatSecondsDurationProperty,
    Float64SecondsDurationProperty,
    Int32MillisecondsDurationProperty,
    FloatMillisecondsDurationProperty,
    Float64MillisecondsDurationProperty,
    FloatSecondsDurationArrayProperty,
    FloatMillisecondsDurationArrayProperty,
)


@pytest.fixture
def client():
    with DurationClient() as client:
        yield client


def test_header(client: DurationClient):
    client.header.default(
        duration=datetime.timedelta(days=40),
    )
    client.header.iso8601(
        duration=datetime.timedelta(days=40),
    )
    client.header.iso8601_array(
        duration=[datetime.timedelta(days=40), datetime.timedelta(days=50)],
    )
    client.header.int32_seconds(
        duration=36,
    )
    client.header.float_seconds(
        duration=35.625,
    )
    client.header.float64_seconds(
        duration=35.625,
    )
    client.header.int32_milliseconds(
        duration=datetime.timedelta(milliseconds=36000),
    )
    client.header.float_milliseconds(
        duration=datetime.timedelta(milliseconds=35625),
    )
    client.header.float64_milliseconds(
        duration=datetime.timedelta(milliseconds=35625),
    )
    client.header.int32_milliseconds_array(
        duration=[
            datetime.timedelta(milliseconds=36000),
            datetime.timedelta(milliseconds=47000),
        ],
    )


def test_property(client: DurationClient):
    result = client.property.default(
        DefaultDurationProperty(
            value=datetime.timedelta(days=40),
        )
    )
    assert result.value == datetime.timedelta(days=40)

    result = client.property.iso8601(
        ISO8601DurationProperty(
            value=datetime.timedelta(days=40),
        )
    )
    assert result.value == datetime.timedelta(days=40)

    result = client.property.int32_seconds(
        Int32SecondsDurationProperty(
            value=36,
        )
    )
    assert result.value == 36

    result = client.property.float_seconds(
        FloatSecondsDurationProperty(
            value=35.625,
        )
    )
    assert result.value == 35.625

    result = client.property.float64_seconds(
        Float64SecondsDurationProperty(
            value=35.625,
        )
    )
    assert result.value == 35.625

    result = client.property.int32_milliseconds(
        Int32MillisecondsDurationProperty(
            value=datetime.timedelta(milliseconds=36000),
        )
    )
    assert result.value == datetime.timedelta(milliseconds=36000)

    result = client.property.float_milliseconds(
        FloatMillisecondsDurationProperty(
            value=datetime.timedelta(milliseconds=35625),
        )
    )
    assert result.value == datetime.timedelta(milliseconds=35625)

    result = client.property.float64_milliseconds(
        Float64MillisecondsDurationProperty(
            value=datetime.timedelta(milliseconds=35625),
        )
    )
    assert result.value == datetime.timedelta(milliseconds=35625)

    result = client.property.float_seconds_array(
        FloatSecondsDurationArrayProperty(
            value=[35.625, 46.75],
        )
    )
    assert result.value == [35.625, 46.75]

    result = client.property.float_milliseconds_array(
        FloatMillisecondsDurationArrayProperty(
            value=[
                datetime.timedelta(milliseconds=35625),
                datetime.timedelta(milliseconds=46750),
            ]
        )
    )
    assert result.value == [
        datetime.timedelta(milliseconds=35625),
        datetime.timedelta(milliseconds=46750),
    ]


def test_query(client: DurationClient):
    client.query.default(
        input=datetime.timedelta(days=40),
    )
    client.query.iso8601(
        input=datetime.timedelta(days=40),
    )
    client.query.int32_seconds(
        input=36,
    )
    client.query.float_seconds(
        input=35.625,
    )
    client.query.float64_seconds(
        input=35.625,
    )
    client.query.int32_milliseconds(
        input=datetime.timedelta(milliseconds=36000),
    )
    client.query.float_milliseconds(
        input=datetime.timedelta(milliseconds=35625),
    )
    client.query.float64_milliseconds(
        input=datetime.timedelta(milliseconds=35625),
    )
    client.query.int32_seconds_array(
        input=[36, 120],
    )
    client.query.int32_milliseconds_array(
        input=[
            datetime.timedelta(milliseconds=36000),
            datetime.timedelta(milliseconds=47000),
        ],
    )
