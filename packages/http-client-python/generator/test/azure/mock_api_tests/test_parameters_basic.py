# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.basic import BasicClient
from parameters.basic.models import User


@pytest.fixture
def client():
    with BasicClient() as client:
        yield client


def test_explicit_simple(client: BasicClient):
    client.explicit_body.simple(User(name="foo"))


def test_implicit_simple(client: BasicClient):
    client.implicit_body.simple(name="foo")
