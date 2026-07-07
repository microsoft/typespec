# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.notdiscriminated.typeddict import NotDiscriminatedClient
from typetest.model.notdiscriminated.typeddict.models import Siamese


@pytest.fixture
def client():
    with NotDiscriminatedClient() as client:
        yield client


@pytest.fixture
def valid_body():
    return Siamese(name="abc", age=32, smart=True)


def test_get_valid(client, valid_body):
    result = client.get_valid()
    assert result["name"] == "abc"
    assert result["age"] == 32
    assert result["smart"] is True


def test_post_valid(client, valid_body):
    client.post_valid(valid_body)


def test_put_valid(client, valid_body):
    result = client.put_valid(valid_body)
    assert result["name"] == "abc"
    assert result["age"] == 32
    assert result["smart"] is True
