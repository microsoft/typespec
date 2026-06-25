# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from typetest.model.usage import models
from typetest.model.usage.aio import UsageClient
from typetest.model.usage.types import InputRecord, InputOutputRecord


@pytest_asyncio.fixture
async def client():
    async with UsageClient() as client:
        yield client


@pytest.mark.asyncio
async def test_input(client: UsageClient):
    input = models.InputRecord(required_prop="example-value")
    assert await client.input(input) is None


@pytest.mark.asyncio
async def test_output(client: UsageClient):
    output = models.OutputRecord(required_prop="example-value")
    assert output == await client.output()


@pytest.mark.asyncio
async def test_input_and_output(client: UsageClient):
    input_output = models.InputOutputRecord(required_prop="example-value")
    assert input_output == await client.input_and_output(input_output)


@pytest.mark.asyncio
async def test_input_typeddict(client: UsageClient):
    # Pass a TypedDict (plain dict with wire names) instead of a model
    result = await client.input({"requiredProp": "example-value"})
    assert result is None


@pytest.mark.asyncio
async def test_input_and_output_typeddict(client: UsageClient):
    # Pass a TypedDict, get a model back
    result = await client.input_and_output({"requiredProp": "example-value"})
    assert isinstance(result, models.InputOutputRecord)
    assert result.required_prop == "example-value"
