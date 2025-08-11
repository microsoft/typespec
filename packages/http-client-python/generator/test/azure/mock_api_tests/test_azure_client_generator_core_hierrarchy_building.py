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


def test_update_pet_as_pet(client: HierarchyBuildingClient):
    resp = Pet(name="Buddy", trained=True)
    assert client.pet_operations.update_pet_as_pet(Pet(name="Buddy", trained=True)) == resp


def test_update_dog_as_pet(client: HierarchyBuildingClient):
    resp = Dog(name="Rex", trained=True, breed="German Shepherd")
    assert client.pet_operations.update_dog_as_pet(Dog(name="Rex", trained=True, breed="German Shepherd")) == resp


def test_update_pet_as_animal(client: HierarchyBuildingClient):
    resp = Pet(name="Buddy", trained=True)
    assert client.animal_operations.update_pet_as_animal(Pet(name="Buddy", trained=True)) == resp


def test_update_dog_as_animal(client: HierarchyBuildingClient):
    resp = Dog(name="Rex", trained=True, breed="German Shepherd")
    assert client.animal_operations.update_dog_as_animal(Dog(name="Rex", trained=True, breed="German Shepherd")) == resp


def test_update_dog_as_dog(client: HierarchyBuildingClient):
    resp = Dog(name="Rex", trained=True, breed="German Shepherd")
    assert client.dog_operations.update_dog_as_dog(Dog(name="Rex", trained=True, breed="German Shepherd")) == resp
