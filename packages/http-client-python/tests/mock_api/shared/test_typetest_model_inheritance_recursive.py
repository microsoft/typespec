# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.recursive import RecursiveClient
from typetest.model.recursive.models import Extension


@pytest.fixture
def client():
    with RecursiveClient() as client:
        yield client


@pytest.fixture
def expected():
    return Extension(
        {
            "level": 0,
            "extension": [{"level": 1, "extension": [{"level": 2}]}, {"level": 1}],
        }
    )


def test_put(client: RecursiveClient, expected: Extension):
    client.put(expected)


def test_get(client: RecursiveClient, expected: Extension):
    assert client.get() == expected
