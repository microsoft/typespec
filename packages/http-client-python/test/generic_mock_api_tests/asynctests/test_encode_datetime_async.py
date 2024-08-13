# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import datetime

import pytest
from encode.datetime.aio import DatetimeClient
from encode.datetime.models import (
    DefaultDatetimeProperty,
    Rfc3339DatetimeProperty,
    Rfc7231DatetimeProperty,
    UnixTimestampDatetimeProperty,
    UnixTimestampArrayDatetimeProperty,
)


@pytest.fixture
async def client():
    async with DatetimeClient() as client:
        yield client


@pytest.mark.asyncio
async def test_query(client: DatetimeClient):
    await client.query.default(
        value=datetime.datetime(2022, 8, 26, 18, 38, 0, tzinfo=datetime.timezone.utc),
    )
    await client.query.rfc3339(
        value=datetime.datetime(2022, 8, 26, 18, 38, 0, tzinfo=datetime.timezone.utc),
    )
    await client.query.rfc7231(
        value=datetime.datetime(2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc),
    )
    await client.query.unix_timestamp(
        value=datetime.datetime(2023, 6, 12, 10, 47, 44, tzinfo=datetime.timezone.utc),
    )
    await client.query.unix_timestamp_array(
        value=[
            datetime.datetime(2023, 6, 12, 10, 47, 44, tzinfo=datetime.timezone.utc),
            datetime.datetime(2023, 6, 14, 9, 17, 36, tzinfo=datetime.timezone.utc),
        ],
    )


@pytest.mark.asyncio
async def test_property(client: DatetimeClient):
    result = await client.property.default(
        DefaultDatetimeProperty(
            value=datetime.datetime(2022, 8, 26, 18, 38, 0, tzinfo=datetime.timezone.utc),
        )
    )
    assert result.value == datetime.datetime(2022, 8, 26, 18, 38, 0, tzinfo=datetime.timezone.utc)

    result = await client.property.rfc3339(
        Rfc3339DatetimeProperty(
            value=datetime.datetime(2022, 8, 26, 18, 38, 0, tzinfo=datetime.timezone.utc),
        )
    )
    assert result.value == datetime.datetime(2022, 8, 26, 18, 38, 0, tzinfo=datetime.timezone.utc)

    result = await client.property.rfc7231(
        Rfc7231DatetimeProperty(
            value=datetime.datetime(2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc),
        )
    )
    assert result.value == datetime.datetime(2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc)

    result = await client.property.unix_timestamp(
        UnixTimestampDatetimeProperty(
            value=datetime.datetime(2023, 6, 12, 10, 47, 44, tzinfo=datetime.timezone.utc),
        )
    )
    assert result.value == datetime.datetime(2023, 6, 12, 10, 47, 44, tzinfo=datetime.timezone.utc)

    result = await client.property.unix_timestamp_array(
        UnixTimestampArrayDatetimeProperty(
            value=[
                datetime.datetime(2023, 6, 12, 10, 47, 44, tzinfo=datetime.timezone.utc),
                datetime.datetime(2023, 6, 14, 9, 17, 36, tzinfo=datetime.timezone.utc),
            ],
        )
    )
    assert result.value == [
        datetime.datetime(2023, 6, 12, 10, 47, 44, tzinfo=datetime.timezone.utc),
        datetime.datetime(2023, 6, 14, 9, 17, 36, tzinfo=datetime.timezone.utc),
    ]


@pytest.mark.asyncio
async def test_header(client: DatetimeClient):
    await client.header.default(
        value=datetime.datetime(2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc),
    )
    await client.header.rfc3339(
        value=datetime.datetime(2022, 8, 26, 18, 38, 0, tzinfo=datetime.timezone.utc),
    )
    await client.header.rfc7231(
        value=datetime.datetime(2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc),
    )
    await client.header.unix_timestamp(
        value=datetime.datetime(2023, 6, 12, 10, 47, 44, tzinfo=datetime.timezone.utc),
    )
    await client.header.unix_timestamp_array(
        value=[
            datetime.datetime(2023, 6, 12, 10, 47, 44, tzinfo=datetime.timezone.utc),
            datetime.datetime(2023, 6, 14, 9, 17, 36, tzinfo=datetime.timezone.utc),
        ]
    )


@pytest.mark.asyncio
async def test_response_header(client: DatetimeClient):
    cls = lambda x, y, z: z
    assert (await client.response_header.default(cls=cls))["value"] == datetime.datetime(
        2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc
    )
    assert (await client.response_header.rfc3339(cls=cls))["value"] == datetime.datetime(
        2022, 8, 26, 18, 38, 0, tzinfo=datetime.timezone.utc
    )
    assert (await client.response_header.rfc7231(cls=cls))["value"] == datetime.datetime(
        2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc
    )
    assert (await client.response_header.unix_timestamp(cls=cls))["value"] == datetime.datetime(
        2023, 6, 12, 10, 47, 44, tzinfo=datetime.timezone.utc
    )
