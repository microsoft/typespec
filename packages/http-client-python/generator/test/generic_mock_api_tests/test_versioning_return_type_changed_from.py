# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from versioning.returntypechangedfrom import ReturnTypeChangedFromClient


@pytest.fixture
def client():
    with ReturnTypeChangedFromClient(endpoint="http://localhost:3000", version="v2") as client:
        yield client


def test(client: ReturnTypeChangedFromClient):
    assert client.test("test") == "test"
