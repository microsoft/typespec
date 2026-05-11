# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.largeheader import LargeHeaderClient
from azure.resourcemanager.largeheader import models

SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000"
RESOURCE_GROUP_NAME = "test-rg"


@pytest.fixture
def client(credential, authentication_policy):
    with LargeHeaderClient(
        credential, SUBSCRIPTION_ID, "http://localhost:3000", authentication_policy=authentication_policy
    ) as client:
        yield client


def test_large_headers_begin_two6_k(client: LargeHeaderClient):
    result = client.large_headers.begin_two6_k(
        resource_group_name=RESOURCE_GROUP_NAME,
        large_header_name="header1",
    ).result()
    assert result == models.CancelResult(succeeded=True)
