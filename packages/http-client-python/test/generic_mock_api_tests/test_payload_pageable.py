# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from payload.pageable import PageableClient


@pytest.fixture
def client():
    with PageableClient(endpoint="http://localhost:3000") as client:
        yield client


def test_list(client: PageableClient):
    result = list(client.list(maxpagesize=3))
    assert len(result) == 4
