# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.singlediscriminator.typeddict import SingleDiscriminatorClient
from typetest.model.singlediscriminator.typeddict.models import Sparrow, Eagle


@pytest.fixture
def client():
    with SingleDiscriminatorClient() as client:
        yield client


@pytest.fixture
def valid_body():
    return Sparrow(wingspan=1, kind="sparrow")


def test_get_model(client):
    result = client.get_model()
    assert result["wingspan"] == 1
    assert result["kind"] == "sparrow"


def test_put_model(client, valid_body):
    client.put_model(valid_body)


@pytest.fixture
def recursive_body():
    return Eagle(
        wingspan=5,
        kind="eagle",
        partner={"wingspan": 2, "kind": "goose"},
        friends=[{"wingspan": 2, "kind": "seagull"}],
        hate={"key3": {"wingspan": 1, "kind": "sparrow"}},
    )


def test_get_recursive_model(client):
    result = client.get_recursive_model()
    assert result["wingspan"] == 5
    assert result["kind"] == "eagle"
    assert result["partner"]["kind"] == "goose"
    assert result["friends"][0]["kind"] == "seagull"
    assert result["hate"]["key3"]["kind"] == "sparrow"


def test_put_recursive_model(client, recursive_body):
    client.put_recursive_model(recursive_body)


def test_get_missing_discriminator(client):
    result = client.get_missing_discriminator()
    assert result["wingspan"] == 1


def test_get_wrong_discriminator(client):
    result = client.get_wrong_discriminator()
    assert result["wingspan"] == 1
    assert result["kind"] == "wrongKind"


def test_get_legacy_model(client):
    result = client.get_legacy_model()
    assert result["size"] == 20
    assert result["kind"] == "t-rex"
