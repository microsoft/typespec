# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from encode.boolean.aio import BooleanClient
from encode.boolean.property import models


@pytest_asyncio.fixture
async def client():
    async with BooleanClient() as client:
        yield client


@pytest.mark.asyncio
async def test_property_true_lower(client: BooleanClient):
    result = await client.property.true_lower(models.BoolAsStringProperty(value=True))
    assert result.value == True
    assert result["value"] == "true"


@pytest.mark.asyncio
async def test_property_false_lower(client: BooleanClient):
    result = await client.property.false_lower(models.BoolAsStringProperty(value=False))
    assert result.value == False
    assert result["value"] == "false"


@pytest.mark.asyncio
async def test_property_true_upper(client: BooleanClient):
    result = await client.property.true_upper(models.BoolAsStringProperty(value=True))
    assert result.value == True
    assert result["value"] == "TRUE"


@pytest.mark.asyncio
async def test_property_false_mixed(client: BooleanClient):
    result = await client.property.false_mixed(models.BoolAsStringProperty(value=False))
    assert result.value == False
    assert result["value"] == "FaLsE"
