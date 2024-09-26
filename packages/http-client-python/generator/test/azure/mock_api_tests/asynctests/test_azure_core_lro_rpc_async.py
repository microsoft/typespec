# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azurecore.lro.rpc.aio import RpcClient
from azurecore.lro.rpc import models


@pytest.fixture
async def client():
    async with RpcClient() as client:
        yield client


@pytest.mark.asyncio
async def test_long_running_rpc(client: RpcClient, async_polling_method):
    result = await client.begin_long_running_rpc(
        models.GenerationOptions(prompt="text"), polling_interval=0, polling=async_polling_method
    )
    assert (await result.result()) == models.GenerationResult(data="text data")
