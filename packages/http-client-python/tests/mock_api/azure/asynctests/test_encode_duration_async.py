# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import datetime

import pytest
import pytest_asyncio
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
    await client.query.int32_seconds(input=36)
    await client.query.int32_seconds_larger_unit(input=120)
    await client.query.int32_seconds_array(input=[36, 47])
    await client.query.float_seconds(input=35.625)
    await client.query.float_seconds_larger_unit(input=150.0)
    await client.query.float64_seconds(input=35.625)
    await client.query.int32_milliseconds(input=36000)
    await client.query.int32_milliseconds_larger_unit(input=180000)
    await client.query.int32_milliseconds_array(input=[36000, 47000])
    await client.query.float_milliseconds(input=35625)
    await client.query.float_milliseconds_larger_unit(input=210000.0)
    await client.query.float64_milliseconds(input=35625)


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
    result = await client.property.int32_seconds(Int32SecondsDurationProperty(value=36))
    assert result.value == 36
    result = await client.property.float_seconds(FloatSecondsDurationProperty(value=35.625))
    assert abs(result.value - 35.625) < 0.0001
    result = await client.property.float64_seconds(Float64SecondsDurationProperty(value=35.625))
    assert abs(result.value - 35.625) < 0.0001
    result = await client.property.int32_milliseconds(Int32MillisecondsDurationProperty(value=36000))
    assert result.value == 36000
    result = await client.property.float_milliseconds(FloatMillisecondsDurationProperty(value=35625))
    assert abs(result.value - 35625) < 0.0001
    result = await client.property.float64_milliseconds(Float64MillisecondsDurationProperty(value=35625))
    assert abs(result.value - 35625) < 0.0001
    result = await client.property.float_seconds_array(FloatSecondsDurationArrayProperty(value=[35.625, 46.75]))
    assert abs(result.value[0] - 35.625) < 0.0001
    assert abs(result.value[1] - 46.75) < 0.0001
    result = await client.property.float_milliseconds_array(
        FloatMillisecondsDurationArrayProperty(value=[35625, 46750])
    )
    assert abs(result.value[0] - 35625) < 0.0001
    assert abs(result.value[1] - 46750) < 0.0001
    result = await client.property.int32_seconds_larger_unit(Int32SecondsLargerUnitDurationProperty(value=120))
    assert result.value == 120
    result = await client.property.float_seconds_larger_unit(FloatSecondsLargerUnitDurationProperty(value=150.0))
    assert abs(result.value - 150.0) < 0.0001
    result = await client.property.int32_milliseconds_larger_unit(
        Int32MillisecondsLargerUnitDurationProperty(value=180000)
    )
    assert result.value == 180000
    result = await client.property.float_milliseconds_larger_unit(
        FloatMillisecondsLargerUnitDurationProperty(value=210000.0)
    )
    assert abs(result.value - 210000.0) < 0.0001


@pytest.mark.asyncio
async def test_header(client: DurationClient):
    await client.header.default(duration=datetime.timedelta(days=40))
    await client.header.iso8601(duration=datetime.timedelta(days=40))
    await client.header.iso8601_array(duration=[datetime.timedelta(days=40), datetime.timedelta(days=50)])
    await client.header.int32_seconds(duration=36)
    await client.header.int32_seconds_larger_unit(duration=120)
    await client.header.float_seconds(duration=35.625)
    await client.header.float_seconds_larger_unit(duration=150.0)
    await client.header.float64_seconds(duration=35.625)
    await client.header.int32_milliseconds(duration=36000)
    await client.header.int32_milliseconds_larger_unit(duration=180000)
    await client.header.int32_milliseconds_array(duration=[36000, 47000])
    await client.header.float_milliseconds(duration=35625)
    await client.header.float_milliseconds_larger_unit(duration=210000.0)
    await client.header.float64_milliseconds(duration=35625)
