# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from specs.azure.clientgenerator.core.emptystring.aio import DeserializeEmptyStringAsNullClient
from specs.azure.clientgenerator.core.emptystring import models


@pytest_asyncio.fixture
async def client():
    async with DeserializeEmptyStringAsNullClient() as client:
        yield client


@pytest.mark.asyncio
async def test_get(client: DeserializeEmptyStringAsNullClient):
    result = await client.get()
    assert result == models.ResponseModel(sample_url="")
