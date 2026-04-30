# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.responseasbool.aio import ResponseAsBoolClient


@pytest.mark.asyncio
async def test_exists():
    async with ResponseAsBoolClient() as client:
        result = await client.head_as_boolean.exists()
        assert result is True


@pytest.mark.asyncio
async def test_not_exists():
    async with ResponseAsBoolClient() as client:
        result = await client.head_as_boolean.not_exists()
        assert result is False
