# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.notdiscriminated import NotDiscriminatedClient
from typetest.model.notdiscriminated.models import Siamese


@pytest.fixture
def client():
    with NotDiscriminatedClient() as client:
        yield client


@pytest.fixture
def valid_body():
    return Siamese(name="abc", age=32, smart=True)


def test_get_valid(client, valid_body):
    assert client.get_valid() == valid_body


def test_post_valid(client, valid_body):
    client.post_valid(valid_body)


def test_put_valid(client, valid_body):
    assert valid_body == client.put_valid(valid_body)
