# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from server.path.single import SingleClient


@pytest.fixture
def client():
    with SingleClient(endpoint="http://localhost:3000") as client:
        yield client


def test_my_op(client):
    assert client.my_op() is True
