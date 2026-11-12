# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from specs.azure.core.apiversionoverride.aio import ApiVersionOverrideClient


@pytest_asyncio.fixture
async def client():
    async with ApiVersionOverrideClient() as client:
        yield client


@pytest.mark.asyncio
async def test_legacy_client_api_version_override(client: ApiVersionOverrideClient):
    await client.legacy_client.get()
