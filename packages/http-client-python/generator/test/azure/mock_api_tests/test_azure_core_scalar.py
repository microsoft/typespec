# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.core.scalar import ScalarClient, models


@pytest.fixture
def client():
    with ScalarClient() as client:
        yield client


def test_azure_location_scalar_get(client: ScalarClient):
    result = client.azure_location_scalar.get()
    assert result == "eastus"


def test_azure_location_scalar_put(client: ScalarClient):
    client.azure_location_scalar.put("eastus")


def test_azure_location_scalar_post(client: ScalarClient):
    result = client.azure_location_scalar.post(models.AzureLocationModel(location="eastus"))
    assert result == models.AzureLocationModel(location="eastus")


def test_azure_location_scalar_header(client: ScalarClient):
    client.azure_location_scalar.header(region="eastus")


def test_azure_location_scalar_query(client: ScalarClient):
    client.azure_location_scalar.query(region="eastus")
