# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.clientdefaultvalue.aio import ClientDefaultValueClient
from specs.azure.clientgenerator.core.clientdefaultvalue.models import ModelWithDefaultValues


@pytest.fixture
async def client():
    async with ClientDefaultValueClient() as client:
        yield client


@pytest.mark.asyncio
async def test_put_model_property(client: ClientDefaultValueClient):
    """Test case 1: @clientDefaultValue for model property."""
    body = ModelWithDefaultValues(name="test")
    result = await client.put_model_property(body=body)
    assert result.name == "test"
    assert result.timeout == 30
    assert result.tier == "standard"
    assert result.retry is True


@pytest.mark.asyncio
async def test_get_operation_parameter(client: ClientDefaultValueClient):
    """Test case 2: @clientDefaultValue for operation parameter."""
    # Test with only required parameter (name), defaults should be applied
    await client.get_operation_parameter(name="test")


@pytest.mark.asyncio
async def test_get_path_parameter(client: ClientDefaultValueClient):
    """Test case 3: @clientDefaultValue for first path segment."""
    # Test with only required segment2, segment1 should use default
    await client.get_path_parameter(segment2="segment2")


@pytest.mark.asyncio
async def test_get_header_parameter(client: ClientDefaultValueClient):
    """Test case 4: @clientDefaultValue for header parameters."""
    # Test with default header values
    await client.get_header_parameter()
