# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.exactname import ExactNameClient
from specs.azure.clientgenerator.core.exactname.model import models as model_models
from specs.azure.clientgenerator.core.exactname.property import models as property_models


@pytest.fixture
def client():
    with ExactNameClient() as client:
        yield client


def test_model_exact_name(client: ExactNameClient):
    assert hasattr(model_models, "my_model")
    assert not hasattr(model_models, "My_model")

    body = model_models.my_model(name="test")
    result = client.model.send(body)

    assert result == body


def test_property_exact_name(client: ExactNameClient):
    body = property_models.ScopedModel(_my_name="test")
    result = client.property.send(body)

    assert result == body
    assert result._my_name == "test"

    with pytest.raises(AttributeError):
        result.my_name
