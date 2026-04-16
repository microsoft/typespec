# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.clientdoc import ClientDocClient
from specs.azure.clientgenerator.core.clientdoc.documentation import models


@pytest.fixture
def client():
    with ClientDocClient() as client:
        yield client


def test_harvest(client: ClientDocClient):
    plant = models.Plant(name="Rose", species="Rosa")
    result = client.documentation.harvest(plant)
    assert result == models.Plant(name="Rose", species="Rosa")
