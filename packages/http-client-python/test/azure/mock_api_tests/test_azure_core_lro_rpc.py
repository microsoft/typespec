# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azurecore.lro.rpc import RpcClient, models


@pytest.fixture
def client():
    with RpcClient() as client:
        yield client


def test_long_running_rpc(client: RpcClient, polling_method):
    result = client.begin_long_running_rpc(
        models.GenerationOptions(prompt="text"), polling_interval=0, polling=polling_method
    ).result()
    assert result == models.GenerationResult(data="text data")
