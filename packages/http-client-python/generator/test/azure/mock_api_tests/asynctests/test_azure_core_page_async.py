# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typing import AsyncIterable
from specs.azure.core.page import models, aio

VALID_USER = models.User(id=1, name="Madge", etag="11bdc430-65e8-45ad-81d9-8ffa60d55b59")


@pytest.fixture
async def client():
    async with aio.PageClient() as client:
        yield client


async def _list_with_page_tests(pager: AsyncIterable[models.User]):
    result = [p async for p in pager]
    assert len(result) == 1
    assert result[0].id == 1
    assert result[0].name == "Madge"
    assert result[0].etag == "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
    assert result[0].orders is None


@pytest.mark.asyncio
async def test_list_with_page(client: aio.PageClient):
    await _list_with_page_tests(client.list_with_page())


@pytest.mark.asyncio
async def test_list_with_custom_page_model(client: aio.PageClient):
    await _list_with_page_tests(client.list_with_custom_page_model())
    with pytest.raises(AttributeError):
        models.CustomPageModel


@pytest.mark.asyncio
async def test_list_with_parameters(client: aio.PageClient):
    result = [
        item
        async for item in client.list_with_parameters(models.ListItemInputBody(input_name="Madge"), another="Second")
    ]
    assert len(result) == 1
    assert result[0] == VALID_USER


@pytest.mark.asyncio
async def test_two_models_as_page_item(client: aio.PageClient):
    result = [item async for item in client.two_models_as_page_item.list_first_item()]
    assert len(result) == 1
    assert result[0].id == 1

    result = [item async for item in client.two_models_as_page_item.list_second_item()]
    assert len(result) == 1
    assert result[0].name == "Madge"
