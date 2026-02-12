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
async def test_link_string(client: PageableClient):
    result = [p async for p in client.server_driven_pagination.link_string()]
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


@pytest.mark.asyncio
async def test_nested_link(client: PageableClient):
    result = [p async for p in client.server_driven_pagination.nested_link()]
    assert_result(result)


@pytest.mark.asyncio
async def test_request_query_nested_response_body(client: PageableClient):
    result = [
        p
        async for p in client.server_driven_pagination.continuation_token.request_query_nested_response_body(
            foo="foo", bar="bar"
        )
    ]
    assert_result(result)


@pytest.mark.asyncio
async def test_request_header_nested_response_body(client: PageableClient):
    result = [
        p
        async for p in client.server_driven_pagination.continuation_token.request_header_nested_response_body(
            foo="foo", bar="bar"
        )
    ]
    assert_result(result)


@pytest.mark.asyncio
async def test_list_without_continuation(client: PageableClient):
    result = [p async for p in client.page_size.list_without_continuation()]
    assert_result(result)


@pytest.mark.asyncio
async def test_xml_pagination_list_with_continuation(client: PageableClient):
    result = [p async for p in client.xml_pagination.list_with_continuation()]
    assert_result(result)


@pytest.mark.asyncio
async def test_xml_pagination_list_with_next_link(client: PageableClient):
    result = [p async for p in client.xml_pagination.list_with_next_link()]
    assert_result(result)
