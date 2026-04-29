# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from server.path.multiple import MultipleClient


@pytest.fixture
def client():
    with MultipleClient(endpoint="http://localhost:3000") as client:
        yield client


def test_no_operation_params(client: MultipleClient):
    client.no_operation_params()


def test_with_operation_path_param(client: MultipleClient):
    client.with_operation_path_param(keyword="test")
