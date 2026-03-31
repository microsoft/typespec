# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from encode.numeric.aio import NumericClient
from encode.numeric import models


@pytest.fixture
async def client():
    async with NumericClient() as client:
        yield client


@pytest.mark.asyncio
async def test_safeint_as_string(client: NumericClient):
    result = await client.property.safeint_as_string(models.SafeintAsStringProperty(value=10000000000))
    assert result.value == 10000000000
    assert result["value"] == "10000000000"


@pytest.mark.asyncio
async def test_uint32_as_string_optional(client: NumericClient):
    result = await client.property.uint32_as_string_optional(models.Uint32AsStringProperty(value=1))
    assert result.value == 1
    assert result["value"] == "1"


@pytest.mark.asyncio
async def test_uint8_as_string_optional(client: NumericClient):
    result = await client.property.uint8_as_string(models.Uint32AsStringProperty(value=255))
    assert result.value == 255
    assert result["value"] == "255"
