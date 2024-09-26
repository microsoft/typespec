# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specialheaders.repeatability import RepeatabilityClient


@pytest.fixture
def client():
    with RepeatabilityClient() as client:
        yield client


def test_immediate_success(client: RepeatabilityClient):
    cls = lambda x, y, z: z
    assert client.immediate_success(cls=cls)["Repeatability-Result"] == "accepted"
