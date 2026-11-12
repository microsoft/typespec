# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from typetest.model.usage.typeddictonly.aio import UsageClient
from typetest.model.usage.typeddictonly.types import InputRecord, OutputRecord, InputOutputRecord


@pytest_asyncio.fixture
async def client():
    async with UsageClient() as client:
        yield client


@pytest.mark.asyncio
async def test_input(client: UsageClient):
    # TypedDict-only: pass a plain dict matching the TypedDict schema
    result = await client.input({"requiredProp": "example-value"})
    assert result is None


@pytest.mark.asyncio
async def test_output(client: UsageClient):
    # TypedDict-only: output should be a plain dict (no model deserialization)
    output = await client.output()
    assert isinstance(output, dict)
    assert output["requiredProp"] == "example-value"


@pytest.mark.asyncio
async def test_input_and_output(client: UsageClient):
    # TypedDict-only: input a dict, get a dict back
    result = await client.input_and_output({"requiredProp": "example-value"})
    assert isinstance(result, dict)
    assert result["requiredProp"] == "example-value"
