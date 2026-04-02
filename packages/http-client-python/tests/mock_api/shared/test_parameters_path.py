# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.path import PathClient


@pytest.fixture
def client():
    with PathClient() as client:
        yield client


def test_normal(client: PathClient):
    client.normal("foo")


def test_optional(client: PathClient):
    client.optional()
    client.optional(name="foo")
