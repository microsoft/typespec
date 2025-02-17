# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.usage import models
from typetest.model.usage.aio import UsageClient


@pytest.fixture
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
