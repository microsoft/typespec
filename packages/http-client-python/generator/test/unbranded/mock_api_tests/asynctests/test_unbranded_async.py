# ------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------
import traceback
import pytest
from typetest.scalar.aio import ScalarClient
from corehttp.exceptions import HttpResponseError


@pytest.fixture
async def client():
    async with ScalarClient() as client:
        yield client


@pytest.mark.asyncio
async def test_track_back(client: ScalarClient):
    try:
        await client.string.put("to raise exception")
    except HttpResponseError:
        track_back = traceback.format_exc().lower()
        assert "azure" not in track_back
        assert "microsoft" not in track_back
