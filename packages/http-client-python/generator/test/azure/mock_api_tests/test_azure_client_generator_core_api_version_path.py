# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.alternateapiversion.service.path import PathClient


@pytest.fixture
def client():
    with PathClient(endpoint="http://localhost:3000") as client:
        yield client


def test_path_api_version(client: PathClient):
    client.path_api_version()
