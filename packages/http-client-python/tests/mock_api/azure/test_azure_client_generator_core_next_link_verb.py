# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest

from specs.azure.clientgenerator.core.nextlinkverb import NextLinkVerbClient


@pytest.fixture
def client():
    with NextLinkVerbClient(endpoint="http://localhost:3000") as client:
        yield client


def assert_items(items):
    items = list(items)
    assert len(items) == 2
    assert items[0].id == "test1"
    assert items[1].id == "test2"


def test_list_items_next_link_verb(client: NextLinkVerbClient):
    # The operation uses POST for nextLink per @nextLinkVerb
    pager = client.list_items()
    assert_items(pager)
