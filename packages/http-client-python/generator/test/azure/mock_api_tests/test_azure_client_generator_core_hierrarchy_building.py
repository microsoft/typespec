# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.hierarchybuilding import HierarchyBuildingClient
from specs.azure.clientgenerator.core.hierarchybuilding.models import (
    Pet,
    Dog,
)


@pytest.fixture
def client():
    with HierarchyBuildingClient() as client:
        yield client


# ========== test for spector ==========


def test_update_pet(client: HierarchyBuildingClient):
    resp = Pet(name="Buddy", trained=True)
    assert client.update_pet(Pet(name="Buddy", trained=True)) == resp


def test_update_dog(client: HierarchyBuildingClient):
  resp = Dog(name="Rex", trained=True, breed="German Shepherd")
  assert client.update_pet(Dog(name="Rex", trained=True, breed="German Shepherd")) == resp
