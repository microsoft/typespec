# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.override.aio import OverrideClient


@pytest.fixture
async def client():
    async with OverrideClient() as client:
        yield client


@pytest.mark.asyncio
async def test_reorder_parameters(client: OverrideClient):
    await client.reorder_parameters.reorder("param1", "param2")


@pytest.mark.asyncio
async def test_group_parameters(client: OverrideClient):
    await client.group_parameters.group(param1="param1", param2="param2")
