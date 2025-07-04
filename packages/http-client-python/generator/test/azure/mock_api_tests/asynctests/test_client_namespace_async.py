# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.clientnamespace.aio import ClientNamespaceFirstClient
from client.clientnamespace.first.models import FirstClientResult

from client.clientnamespace.second.aio import ClientNamespaceSecondClient
from client.clientnamespace.second.models import SecondClientResult
from client.clientnamespace.second.sub.models import SecondClientEnumType


@pytest.fixture
async def first_client():
    async with ClientNamespaceFirstClient() as client:
        yield client


@pytest.fixture
async def second_client():
    async with ClientNamespaceSecondClient() as client:
        yield client


@pytest.mark.asyncio
async def test_get_first(first_client: ClientNamespaceFirstClient):
    assert await first_client.get_first() == FirstClientResult(name="first")


@pytest.mark.asyncio
async def test_get_second(second_client: ClientNamespaceSecondClient):
    assert await second_client.get_second() == SecondClientResult(type=SecondClientEnumType.SECOND)
