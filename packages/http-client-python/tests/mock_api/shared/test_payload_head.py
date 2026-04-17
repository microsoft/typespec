# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from payload.head import HeadClient


@pytest.fixture
def client():
    with HeadClient(endpoint="http://localhost:3000") as client:
        yield client


def test_content_type_header_in_response(client: HeadClient):
    assert client.content_type_header_in_response() is True
