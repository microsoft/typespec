# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.query import QueryClient


@pytest.fixture
def client():
    with QueryClient() as client:
        yield client


def test_constant(client: QueryClient):
    client.constant.post()
