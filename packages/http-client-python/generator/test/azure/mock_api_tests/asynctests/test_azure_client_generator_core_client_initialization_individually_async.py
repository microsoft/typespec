# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.clientinitialization.individually.aio import (
    IndividuallyNestedWithHeaderClient,
    IndividuallyNestedWithMixedClient,
    IndividuallyNestedWithMultipleClient,
    IndividuallyNestedWithParamAliasClient,
    IndividuallyNestedWithPathClient,
    IndividuallyNestedWithQueryClient,
)


@pytest.mark.asyncio
async def test_individually_nested_with_path_client():
    async with IndividuallyNestedWithPathClient("test-blob") as client:
        await client.with_query(format="text")
        await client.get_standalone()
        await client.delete_standalone()


@pytest.mark.asyncio
async def test_individually_nested_with_query_client():
    async with IndividuallyNestedWithQueryClient("test-blob") as client:
        await client.with_query(format="text")
        await client.get_standalone()
        await client.delete_standalone()


@pytest.mark.asyncio
async def test_individually_nested_with_header_client():
    async with IndividuallyNestedWithHeaderClient("test-name-value") as client:
        await client.with_query(format="text")
        await client.get_standalone()
        await client.delete_standalone()


@pytest.mark.asyncio
async def test_individually_nested_with_multiple_client():
    async with IndividuallyNestedWithMultipleClient("test-name-value", "us-west") as client:
        await client.with_query(format="text")
        await client.get_standalone()
        await client.delete_standalone()


@pytest.mark.asyncio
async def test_individually_nested_with_mixed_client():
    async with IndividuallyNestedWithMixedClient("test-name-value") as client:
        await client.with_query(region="us-west", format="text")
        await client.get_standalone(region="us-west")
        await client.delete_standalone(region="us-west")


@pytest.mark.asyncio
async def test_individually_nested_with_param_alias_client():
    async with IndividuallyNestedWithParamAliasClient("sample-blob") as client:
        await client.with_aliased_name()
        await client.with_original_name()
