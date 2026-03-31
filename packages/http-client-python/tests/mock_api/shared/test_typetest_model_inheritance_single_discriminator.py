# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.singlediscriminator import SingleDiscriminatorClient
from typetest.model.singlediscriminator.models import Sparrow, Eagle, Bird, Dinosaur


@pytest.fixture
def client():
    with SingleDiscriminatorClient() as client:
        yield client


@pytest.fixture
def valid_body():
    return Sparrow(wingspan=1)


def test_get_model(client, valid_body):
    assert client.get_model() == valid_body


def test_put_model(client, valid_body):
    client.put_model(valid_body)


@pytest.fixture
def recursive_body():
    return Eagle(
        {
            "wingspan": 5,
            "kind": "eagle",
            "partner": {"wingspan": 2, "kind": "goose"},
            "friends": [{"wingspan": 2, "kind": "seagull"}],
            "hate": {"key3": {"wingspan": 1, "kind": "sparrow"}},
        }
    )


def test_get_recursive_model(client, recursive_body):
    assert client.get_recursive_model() == recursive_body


def test_put_recursive_model(client, recursive_body):
    client.put_recursive_model(recursive_body)


def test_get_missing_discriminator(client):
    assert client.get_missing_discriminator() == Bird(wingspan=1)


def test_get_wrong_discriminator(client):
    assert client.get_wrong_discriminator() == Bird(wingspan=1, kind="wrongKind")


def test_get_legacy_model(client):
    assert client.get_legacy_model() == Dinosaur(size=20, kind="t-rex")
