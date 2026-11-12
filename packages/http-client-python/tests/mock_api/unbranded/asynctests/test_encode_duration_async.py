# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import datetime

import pytest
import pytest_asyncio
from encode.duration.aio import DurationClient
from encode.duration.property.models import (
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
    Int32SecondsLargerUnitDurationProperty,
    FloatSecondsLargerUnitDurationProperty,
    Int32MillisecondsLargerUnitDurationProperty,
    FloatMillisecondsLargerUnitDurationProperty,
)


@pytest_asyncio.fixture
async def client():
    async with DurationClient() as client:
        yield client


@pytest.mark.asyncio
async def test_query(client: DurationClient):
    await client.query.default(input=datetime.timedelta(days=40))
    await client.query.iso8601(input=datetime.timedelta(days=40))
    await client.query.int32_seconds(input=datetime.timedelta(seconds=36))
    await client.query.int32_seconds_larger_unit(input=datetime.timedelta(seconds=120))
    await client.query.int32_seconds_array(input=[datetime.timedelta(seconds=36), datetime.timedelta(seconds=47)])
    await client.query.float_seconds(input=datetime.timedelta(seconds=35.625))
    await client.query.float_seconds_larger_unit(input=datetime.timedelta(seconds=150))
    await client.query.float64_seconds(input=datetime.timedelta(seconds=35.625))
    await client.query.int32_milliseconds(input=datetime.timedelta(milliseconds=36000))
    await client.query.int32_milliseconds_larger_unit(input=datetime.timedelta(milliseconds=180000))
    await client.query.int32_milliseconds_array(
        input=[datetime.timedelta(milliseconds=36000), datetime.timedelta(milliseconds=47000)]
    )
    await client.query.float_milliseconds(input=datetime.timedelta(milliseconds=35625))
    await client.query.float_milliseconds_larger_unit(input=datetime.timedelta(milliseconds=210000))
    await client.query.float64_milliseconds(input=datetime.timedelta(milliseconds=35625))


@pytest.mark.asyncio
async def test_property(client: DurationClient):
    result = await client.property.default(DefaultDurationProperty(value=datetime.timedelta(days=40)))
    assert result.value == datetime.timedelta(days=40)
    result = await client.property.default(DefaultDurationProperty(value="P40D"))
    assert result.value == datetime.timedelta(days=40)
    result = await client.property.iso8601(ISO8601DurationProperty(value=datetime.timedelta(days=40)))
    assert result.value == datetime.timedelta(days=40)
    result = await client.property.iso8601(ISO8601DurationProperty(value="P40D"))
    assert result.value == datetime.timedelta(days=40)
    result = await client.property.int32_seconds(Int32SecondsDurationProperty(value=datetime.timedelta(seconds=36)))
    assert result.value == datetime.timedelta(seconds=36)
    result = await client.property.float_seconds(FloatSecondsDurationProperty(value=datetime.timedelta(seconds=35.625)))
    assert result.value == datetime.timedelta(seconds=35.625)
    result = await client.property.float64_seconds(
        Float64SecondsDurationProperty(value=datetime.timedelta(seconds=35.625))
    )
    assert result.value == datetime.timedelta(seconds=35.625)
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
    result = await client.property.float_seconds_array(
        FloatSecondsDurationArrayProperty(value=[datetime.timedelta(seconds=35.625), datetime.timedelta(seconds=46.75)])
    )
    assert result.value == [datetime.timedelta(seconds=35.625), datetime.timedelta(seconds=46.75)]
    result = await client.property.float_milliseconds_array(
        FloatMillisecondsDurationArrayProperty(
            value=[datetime.timedelta(milliseconds=35625), datetime.timedelta(milliseconds=46750)]
        )
    )
    assert result.value == [datetime.timedelta(milliseconds=35625), datetime.timedelta(milliseconds=46750)]
    result = await client.property.int32_seconds_larger_unit(
        Int32SecondsLargerUnitDurationProperty(value=datetime.timedelta(seconds=120))
    )
    assert result.value == datetime.timedelta(seconds=120)
    result = await client.property.float_seconds_larger_unit(
        FloatSecondsLargerUnitDurationProperty(value=datetime.timedelta(seconds=150))
    )
    assert result.value == datetime.timedelta(seconds=150)
    result = await client.property.int32_milliseconds_larger_unit(
        Int32MillisecondsLargerUnitDurationProperty(value=datetime.timedelta(milliseconds=180000))
    )
    assert result.value == datetime.timedelta(milliseconds=180000)
    result = await client.property.float_milliseconds_larger_unit(
        FloatMillisecondsLargerUnitDurationProperty(value=datetime.timedelta(milliseconds=210000))
    )
    assert result.value == datetime.timedelta(milliseconds=210000)


@pytest.mark.asyncio
async def test_lossy(client: DurationClient):
    await client.lossy.int_seconds(input=datetime.timedelta(seconds=36.25))
    await client.lossy.int_milliseconds(input=datetime.timedelta(milliseconds=36250.25))


@pytest.mark.asyncio
async def test_header(client: DurationClient):
    await client.header.default(duration=datetime.timedelta(days=40))
    await client.header.iso8601(duration=datetime.timedelta(days=40))
    await client.header.iso8601_array(duration=[datetime.timedelta(days=40), datetime.timedelta(days=50)])
    await client.header.int32_seconds(duration=datetime.timedelta(seconds=36))
    await client.header.int32_seconds_larger_unit(duration=datetime.timedelta(seconds=120))
    await client.header.float_seconds(duration=datetime.timedelta(seconds=35.625))
    await client.header.float_seconds_larger_unit(duration=datetime.timedelta(seconds=150))
    await client.header.float64_seconds(duration=datetime.timedelta(seconds=35.625))
    await client.header.int32_milliseconds(duration=datetime.timedelta(milliseconds=36000))
    await client.header.int32_milliseconds_larger_unit(duration=datetime.timedelta(milliseconds=180000))
    await client.header.int32_milliseconds_array(
        duration=[datetime.timedelta(milliseconds=36000), datetime.timedelta(milliseconds=47000)]
    )
    await client.header.float_milliseconds(duration=datetime.timedelta(milliseconds=35625))
    await client.header.float_milliseconds_larger_unit(duration=datetime.timedelta(milliseconds=210000))
    await client.header.float64_milliseconds(duration=datetime.timedelta(milliseconds=35625))
