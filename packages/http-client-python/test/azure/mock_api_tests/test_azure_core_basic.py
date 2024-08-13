# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typing import Iterable
from specs.azure.core.basic import BasicClient, models

VALID_USER = models.User(id=1, name="Madge", etag="11bdc430-65e8-45ad-81d9-8ffa60d55b59")


@pytest.fixture
def client():
    with BasicClient() as client:
        yield client


def test_create_or_update(client: BasicClient):
    result = client.create_or_update(id=1, resource={"name": "Madge"})
    assert result == VALID_USER


def test_create_or_replace(client: BasicClient):
    result = client.create_or_replace(id=1, resource={"name": "Madge"})
    assert result == VALID_USER


def test_get(client: BasicClient):
    result = client.get(id=1)
    assert result == VALID_USER


def test_list(client: BasicClient):
    result = list(
        client.list(
            top=5,
            skip=10,
            orderby=["id"],
            filter="id lt 10",
            select=["id", "orders", "etag"],
            expand=["orders"],
        )
    )
    assert len(result) == 2
    assert result[0].id == 1
    assert result[0].name == "Madge"
    assert result[0].etag == "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
    assert result[0].orders[0].id == 1
    assert result[0].orders[0].user_id == 1
    assert result[0].orders[0].detail == "a recorder"
    assert result[1].id == 2
    assert result[1].name == "John"
    assert result[1].etag == "11bdc430-65e8-45ad-81d9-8ffa60d55b5a"
    assert result[1].orders[0].id == 2
    assert result[1].orders[0].user_id == 2
    assert result[1].orders[0].detail == "a TV"


def _list_with_page_tests(pager: Iterable[models.User]):
    result = list(pager)
    assert len(result) == 1
    assert result[0].id == 1
    assert result[0].name == "Madge"
    assert result[0].etag == "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
    assert result[0].orders is None


def test_list_with_page(client: BasicClient):
    _list_with_page_tests(client.list_with_page())


def test_list_with_custom_page_model(client: BasicClient):
    _list_with_page_tests(client.list_with_custom_page_model())
    with pytest.raises(AttributeError):
        models.CustomPageModel


def test_delete(client: BasicClient):
    client.delete(id=1)


def test_export(client: BasicClient):
    result = client.export(id=1, format="json")
    assert result == VALID_USER


def test_list_with_parameters(client: BasicClient):
    result = list(client.list_with_parameters(models.ListItemInputBody(input_name="Madge"), another="Second"))
    assert len(result) == 1
    assert result[0] == VALID_USER


def test_two_models_as_page_item(client: BasicClient):
    result = list(client.two_models_as_page_item.list_first_item())
    assert len(result) == 1
    assert result[0].id == 1

    result = list(client.two_models_as_page_item.list_second_item())
    assert len(result) == 1
    assert result[0].name == "Madge"
