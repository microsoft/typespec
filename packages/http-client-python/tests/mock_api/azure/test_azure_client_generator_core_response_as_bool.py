# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.responseasbool import ResponseAsBoolClient


@pytest.fixture
def client():
    with ResponseAsBoolClient() as client:
        yield client


def test_exists(client: ResponseAsBoolClient):
    assert client.head_as_boolean.exists() is True


def test_not_exists(client: ResponseAsBoolClient):
    assert client.head_as_boolean.not_exists() is False
