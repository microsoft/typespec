# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from versioning.madeoptional import MadeOptionalClient
from versioning.madeoptional.models import TestModel


@pytest.fixture
def client():
    with MadeOptionalClient(endpoint="http://localhost:3000", version="v2") as client:
        yield client


def test(client: MadeOptionalClient):
    assert client.test(
        TestModel(prop="foo"),
    ) == TestModel(prop="foo")
