# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.exactname import ExactNameClient
from specs.azure.clientgenerator.core.exactname.model.models import My_model
from specs.azure.clientgenerator.core.exactname.property.models import ScopedModel


@pytest.fixture
def client():
    with ExactNameClient() as client:
        yield client


def test_model(client: ExactNameClient):
    body = My_model(name="test")
    response = client.model.send(body=body)
    assert response.name == "test"


def test_property(client: ExactNameClient):
    body = ScopedModel({"name": "test"})
    response = client.property.send(body=body)
    assert response._my_name == "test"


def test_model_class_name_preserved():
    # exact("my_model") should preserve the name as-is without casing transformation,
    # so the generated class is `My_model` (only the first letter capitalized for class naming),
    # not `MyModel`.
    assert My_model.__name__ == "My_model"


def test_property_name_preserved():
    # exact("_my_name") scoped to python should preserve the property name exactly,
    # including the leading underscore, instead of being stripped/recased.
    assert "_my_name" in ScopedModel.__annotations__
