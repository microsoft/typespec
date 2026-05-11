# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.core.exceptions import HttpResponseError
from service.multiservice import CombinedClient
from service.multiservice.models import VersionsA, VersionsB


@pytest.fixture
def client():
    """Fixture that creates a CombinedClient for testing."""
    return CombinedClient(endpoint="http://localhost:3000")


def test_service_multi_service_foo(client):
    with pytest.raises(HttpResponseError):
        client.foo.test(api_version=VersionsA.AV1)

    client.foo.test()


def test_service_multi_service_bar(client):
    with pytest.raises(HttpResponseError):
        client.bar.test(api_version=VersionsB.BV1)

    client.bar.test()
