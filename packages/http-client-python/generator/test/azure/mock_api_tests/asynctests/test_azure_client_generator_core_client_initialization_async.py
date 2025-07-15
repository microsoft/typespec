# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.clientinitialization.aio import (
    HeaderParamClient,
    MultipleParamsClient,
    MixedParamsClient,
    PathParamClient,
    ParamAliasClient,
    ParentClient,
)
from specs.azure.clientgenerator.core.clientinitialization.models import Input


@pytest.mark.asyncio
async def test_header_param_client():
    async with HeaderParamClient("test-name-value") as client:
        await client.with_query(id="test-id")
        await client.with_body(Input(name="test-name"))


@pytest.mark.asyncio
async def test_multiple_params_client():
    async with MultipleParamsClient("test-name-value", "us-west") as client:
        await client.with_query(id="test-id")
        await client.with_body(Input(name="test-name"))


@pytest.mark.asyncio
async def test_mixed_params_client():
    async with MixedParamsClient("test-name-value") as client:
        await client.with_query(region="us-west", id="test-id")
        await client.with_body(Input(name="test-name"), region="us-west")


@pytest.mark.asyncio
async def test_path_param_client():
    async with PathParamClient("sample-blob") as client:
        await client.with_query(format="text")
        await client.get_standalone()
        await client.delete_standalone()


@pytest.mark.asyncio
async def test_param_alias_client():
    async with ParamAliasClient("sample-blob") as client:
        await client.with_aliased_name()
        await client.with_original_name()


# @pytest.mark.asyncio
# async def test_parent_child_client():
#     async with ParentClient() as client:
#         await client.child_client.with_query()
#         await client.child_client.get_standalone()
#         await client.child_client.delete_standalone()
