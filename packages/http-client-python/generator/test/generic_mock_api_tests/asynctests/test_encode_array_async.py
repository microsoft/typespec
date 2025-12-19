# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

import pytest
from encode.array.aio import ArrayClient
from encode.array import models


@pytest.fixture
async def client():
    async with ArrayClient() as client:
        yield client


@pytest.mark.asyncio
async def test_comma_delimited(client: ArrayClient):
    body = models.CommaDelimitedArrayProperty(value=["blue", "red", "green"])
    result = await client.property.comma_delimited(body)
    assert result.value == ["blue", "red", "green"]


@pytest.mark.asyncio
async def test_space_delimited(client: ArrayClient):
    body = models.SpaceDelimitedArrayProperty(value=["blue", "red", "green"])
    result = await client.property.space_delimited(body)
    assert result.value == ["blue", "red", "green"]


@pytest.mark.asyncio
async def test_pipe_delimited(client: ArrayClient):
    body = models.PipeDelimitedArrayProperty(value=["blue", "red", "green"])
    result = await client.property.pipe_delimited(body)
    assert result.value == ["blue", "red", "green"]


@pytest.mark.asyncio
async def test_newline_delimited(client: ArrayClient):
    body = models.NewlineDelimitedArrayProperty(value=["blue", "red", "green"])
    result = await client.property.newline_delimited(body)
    assert result.value == ["blue", "red", "green"]
