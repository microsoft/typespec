# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from payload.pageable.aio import PageableClient


@pytest.fixture
async def client():
    async with PageableClient(endpoint="http://localhost:3000") as client:
        yield client


def assert_result(result):
    assert len(result) == 4
    assert result[0].id == "1"
    assert result[1].id == "2"
    assert result[2].id == "3"
    assert result[3].id == "4"
    assert result[0].name == "dog"
    assert result[1].name == "cat"
    assert result[2].name == "bird"
    assert result[3].name == "fish"


@pytest.mark.asyncio
async def test_link(client: PageableClient):
    result = [p async for p in client.server_driven_pagination.link()]
    assert_result(result)


@pytest.mark.asyncio
async def test_request_query_response_body(client: PageableClient):
    result = [
        p
        async for p in client.server_driven_pagination.continuation_token.request_query_response_body(
            foo="foo", bar="bar"
        )
    ]
    assert_result(result)


@pytest.mark.asyncio
async def test_request_header_response_body(client: PageableClient):
    result = [
        p
        async for p in client.server_driven_pagination.continuation_token.request_header_response_body(
            foo="foo", bar="bar"
        )
    ]
    assert_result(result)


@pytest.mark.asyncio
async def test_request_query_response_header(client: PageableClient):
    result = [
        p
        async for p in client.server_driven_pagination.continuation_token.request_query_response_header(
            foo="foo", bar="bar"
        )
    ]
    assert_result(result)


@pytest.mark.asyncio
async def test_request_header_response_header(client: PageableClient):
    result = [
        p
        async for p in client.server_driven_pagination.continuation_token.request_query_response_header(
            foo="foo", bar="bar"
        )
    ]
    assert_result(result)
