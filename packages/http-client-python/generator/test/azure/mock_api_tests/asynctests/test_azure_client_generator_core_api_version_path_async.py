# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.alternateapiversion.service.path.aio import PathClient


@pytest.fixture
async def client():
    async with PathClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_path_api_version(client: PathClient):
    await client.path_api_version()
