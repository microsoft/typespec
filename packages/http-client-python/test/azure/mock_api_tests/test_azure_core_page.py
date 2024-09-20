# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typing import Iterable
from specs.azure.core.page import PageClient, models

VALID_USER = models.User(id=1, name="Madge", etag="11bdc430-65e8-45ad-81d9-8ffa60d55b59")


@pytest.fixture
def client():
    with PageClient() as client:
        yield client


def _list_with_page_tests(pager: Iterable[models.User]):
    result = list(pager)
    assert len(result) == 1
    assert result[0].id == 1
    assert result[0].name == "Madge"
    assert result[0].etag == "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
    assert result[0].orders is None


def test_list_with_page(client: PageClient):
    _list_with_page_tests(client.list_with_page())


def test_list_with_custom_page_model(client: PageClient):
    _list_with_page_tests(client.list_with_custom_page_model())
    with pytest.raises(AttributeError):
        models.CustomPageModel


def test_list_with_parameters(client: PageClient):
    result = list(client.list_with_parameters(models.ListItemInputBody(input_name="Madge"), another="Second"))
    assert len(result) == 1
    assert result[0] == VALID_USER


def test_two_models_as_page_item(client: PageClient):
    result = list(client.two_models_as_page_item.list_first_item())
    assert len(result) == 1
    assert result[0].id == 1

    result = list(client.two_models_as_page_item.list_second_item())
    assert len(result) == 1
    assert result[0].name == "Madge"
