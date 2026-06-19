# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.clientdoc import ClientDocClient
from specs.azure.clientgenerator.core.clientdoc import models


@pytest.fixture
def client():
    with ClientDocClient() as client:
        yield client


def test_harvest(client: ClientDocClient):
    body = models.Plant(name="Rose", species="Rosa")
    assert client.documentation.harvest(body) == body


def test_model_doc_appended():
    # @clientDoc in append mode keeps the base @doc and appends the client-specific text.
    # Only the model description is compared, not the parameter docstrings.
    doc = models.Plant.__doc__.split(":ivar")[0].strip()
    assert doc == "A plant in the garden. This model is used to represent a plant in the client SDK."


def test_operation_doc_replaced(client: ClientDocClient):
    # @clientDoc in replace mode overrides the base @doc completely.
    # Only the operation description is compared, not the parameter docstrings.
    doc = client.documentation.harvest.__doc__.split(":param")[0].strip()
    assert doc == "Retrieves a plant from the garden by submitting its name."
