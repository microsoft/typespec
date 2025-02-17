# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.empty import EmptyClient
from typetest.model.empty.models import EmptyInput, EmptyOutput, EmptyInputOutput


@pytest.fixture
def client():
    with EmptyClient() as client:
        yield client


def test_put(client: EmptyClient):
    client.put_empty(EmptyInput())
    client.put_empty({})


def test_get(client: EmptyClient):
    assert client.get_empty() == EmptyOutput()
    assert client.get_empty() == {}


def test_post_round(client: EmptyClient):
    assert client.post_round_trip_empty(EmptyInputOutput()) == EmptyInputOutput()
    assert client.post_round_trip_empty({}) == {}
