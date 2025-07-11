# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.override import OverrideClient


@pytest.fixture
def client():
    with OverrideClient() as client:
        yield client


def test_reorder_parameters(client: OverrideClient):
    client.reorder_parameters.reorder("param1", "param2")


def test_group_parameters(client: OverrideClient):
    client.group_parameters.group(param1="param1", param2="param2")
