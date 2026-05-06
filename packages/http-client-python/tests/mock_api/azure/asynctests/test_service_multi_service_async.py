# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.core.exceptions import HttpResponseError
from service.multiservice.aio import CombinedClient
from service.multiservice.models import VersionsA, VersionsB


@pytest.fixture
def client():
    """Fixture that creates a CombinedClient for testing."""
    return CombinedClient(endpoint="http://localhost:3000")


@pytest.mark.asyncio
async def test_service_multi_service_foo(client):
    with pytest.raises(HttpResponseError):
        await client.foo.test(api_version=VersionsA.AV1)

    await client.foo.test()


@pytest.mark.asyncio
async def test_service_multi_service_bar(client):
    with pytest.raises(HttpResponseError):
        await client.bar.test(api_version=VersionsB.BV1)

    await client.bar.test()
