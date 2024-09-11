# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import datetime
from specialheaders.conditionalrequest.aio import ConditionalRequestClient


@pytest.fixture
async def client():
    async with ConditionalRequestClient() as client:
        yield client


@pytest.mark.asyncio
async def test_post_if_match(core_library, client: ConditionalRequestClient):
    await client.post_if_match(etag="valid", match_condition=core_library.MatchConditions.IfNotModified)


@pytest.mark.asyncio
async def test_post_if_none_match(core_library, client: ConditionalRequestClient):
    await client.post_if_none_match(etag="invalid", match_condition=core_library.MatchConditions.IfModified)


@pytest.mark.asyncio
async def test_head_if_modified_since(client: ConditionalRequestClient):
    await client.head_if_modified_since(
        if_modified_since=datetime.datetime(2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc)
    )


@pytest.mark.asyncio
async def test_post_if_unmodified_since(client: ConditionalRequestClient):
    await client.post_if_unmodified_since(
        if_unmodified_since=datetime.datetime(2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc)
    )
