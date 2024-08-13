# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.collectionformat.aio import CollectionFormatClient


@pytest.fixture
async def client():
    async with CollectionFormatClient() as client:
        yield client


@pytest.mark.asyncio
async def test_query_multi(client: CollectionFormatClient):
    await client.query.multi(colors=["blue", "red", "green"])


@pytest.mark.asyncio
async def test_query_csv(client: CollectionFormatClient):
    await client.query.csv(colors=["blue", "red", "green"])


@pytest.mark.asyncio
async def test_query_pipes(client: CollectionFormatClient):
    await client.query.pipes(colors=["blue", "red", "green"])


@pytest.mark.asyncio
async def test_query_ssv(client: CollectionFormatClient):
    await client.query.ssv(colors=["blue", "red", "green"])


@pytest.mark.asyncio
@pytest.mark.skip(reason="https://github.com/aio-libs/aiohttp/issues/5904")
async def test_query_tsv(client: CollectionFormatClient):
    await client.query.tsv(colors=["blue", "red", "green"])


@pytest.mark.asyncio
async def test_csv_header(client: CollectionFormatClient):
    await client.header.csv(colors=["blue", "red", "green"])
