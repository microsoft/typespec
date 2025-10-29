# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import datetime
import pytest
from encode.duration.aio import DurationClient
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
async def client():
    async with DurationClient() as c:
        yield c


@pytest.mark.asyncio
async def test_header_async(client: DurationClient):
    await client.header.default(duration=datetime.timedelta(days=40))
    await client.header.iso8601(duration=datetime.timedelta(days=40))
    await client.header.iso8601_array(duration=[datetime.timedelta(days=40), datetime.timedelta(days=50)])
    await client.header.int32_seconds(duration=36)
    await client.header.float_seconds(duration=35.625)
    await client.header.float64_seconds(duration=35.625)
    await client.header.int32_milliseconds(duration=datetime.timedelta(milliseconds=36000))
    await client.header.float_milliseconds(duration=datetime.timedelta(milliseconds=35625))
    await client.header.float64_milliseconds(duration=datetime.timedelta(milliseconds=35625))
    await client.header.int32_milliseconds_array(
        duration=[
            datetime.timedelta(milliseconds=36000),
            datetime.timedelta(milliseconds=47000),
        ]
    )


@pytest.mark.asyncio
async def test_property_async(client: DurationClient):
    result = await client.property.default(DefaultDurationProperty(value=datetime.timedelta(days=40)))
    assert result.value == datetime.timedelta(days=40)

    result = await client.property.iso8601(ISO8601DurationProperty(value=datetime.timedelta(days=40)))
    assert result.value == datetime.timedelta(days=40)

    result = await client.property.int32_seconds(Int32SecondsDurationProperty(value=36))
    assert result.value == 36

    result = await client.property.float_seconds(FloatSecondsDurationProperty(value=35.625))
    assert result.value == 35.625

    result = await client.property.float64_seconds(Float64SecondsDurationProperty(value=35.625))
    assert result.value == 35.625

    result = await client.property.int32_milliseconds(
        Int32MillisecondsDurationProperty(value=datetime.timedelta(milliseconds=36000))
    )
    assert result.value == datetime.timedelta(milliseconds=36000)

    result = await client.property.float_milliseconds(
        FloatMillisecondsDurationProperty(value=datetime.timedelta(milliseconds=35625))
    )
    assert result.value == datetime.timedelta(milliseconds=35625)

    result = await client.property.float64_milliseconds(
        Float64MillisecondsDurationProperty(value=datetime.timedelta(milliseconds=35625))
    )
    assert result.value == datetime.timedelta(milliseconds=35625)

    result = await client.property.float_seconds_array(FloatSecondsDurationArrayProperty(value=[35.625, 46.75]))
    assert result.value == [35.625, 46.75]

    result = await client.property.float_milliseconds_array(
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


@pytest.mark.asyncio
async def test_query_async(client: DurationClient):
    await client.query.default(input=datetime.timedelta(days=40))
    await client.query.iso8601(input=datetime.timedelta(days=40))
    await client.query.int32_seconds(input=36)
    await client.query.float_seconds(input=35.625)
    await client.query.float64_seconds(input=35.625)
    await client.query.int32_milliseconds(input=datetime.timedelta(milliseconds=36000))
    await client.query.float_milliseconds(input=datetime.timedelta(milliseconds=35625))
    await client.query.float64_milliseconds(input=datetime.timedelta(milliseconds=35625))
    await client.query.int32_seconds_array(input=[36, 120])
    await client.query.int32_milliseconds_array(
        input=[
            datetime.timedelta(milliseconds=36000),
            datetime.timedelta(milliseconds=47000),
        ]
    )
