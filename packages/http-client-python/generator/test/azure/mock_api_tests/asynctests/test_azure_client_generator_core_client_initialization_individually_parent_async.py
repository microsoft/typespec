# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.clientinitialization.individuallyparent.aio import IndividuallyParentClient


@pytest.mark.asyncio
async def test_individually_parent_nested_with_path_client():
    async with IndividuallyParentClient("test-blob", "test-name-value", "us-west") as client:
        await client.individually_parent_nested_with_path_client.with_query(format="text")
        await client.individually_parent_nested_with_path_client.get_standalone()
        await client.individually_parent_nested_with_path_client.delete_standalone()


@pytest.mark.asyncio
async def test_individually_parent_nested_with_query_client():
    async with IndividuallyParentClient("test-blob", "test-name-value", "us-west") as client:
        await client.individually_parent_nested_with_query_client.with_query(format="text")
        await client.individually_parent_nested_with_query_client.get_standalone()
        await client.individually_parent_nested_with_query_client.delete_standalone()


@pytest.mark.asyncio
async def test_individually_parent_nested_with_header_client():
    async with IndividuallyParentClient("test-blob", "test-name-value", "us-west") as client:
        await client.individually_parent_nested_with_header_client.with_query(format="text")
        await client.individually_parent_nested_with_header_client.get_standalone()
        await client.individually_parent_nested_with_header_client.delete_standalone()


@pytest.mark.asyncio
async def test_individually_parent_nested_with_multiple_client():
    async with IndividuallyParentClient("test-blob", "test-name-value", "us-west") as client:
        await client.individually_parent_nested_with_multiple_client.with_query(format="text")
        await client.individually_parent_nested_with_multiple_client.get_standalone()
        await client.individually_parent_nested_with_multiple_client.delete_standalone()


@pytest.mark.asyncio
async def test_individually_parent_nested_with_mixed_client():
    async with IndividuallyParentClient("test-blob", "test-name-value", "us-west") as client:
        await client.individually_parent_nested_with_mixed_client.with_query(region="us-west", format="text")
        await client.individually_parent_nested_with_mixed_client.get_standalone(region="us-west")
        await client.individually_parent_nested_with_mixed_client.delete_standalone(region="us-west")


@pytest.mark.asyncio
async def test_individually_parent_nested_with_param_alias_client():
    async with IndividuallyParentClient("sample-blob", "test-name-value", "us-west") as client:
        await client.individually_parent_nested_with_param_alias_client.with_aliased_name()
        await client.individually_parent_nested_with_param_alias_client.with_original_name()
