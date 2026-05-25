# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from specs.azure.clientgenerator.core.exactname.aio import ExactNameClient
from specs.azure.clientgenerator.core.exactname.model import models as model_models
from specs.azure.clientgenerator.core.exactname.property import models as property_models


@pytest_asyncio.fixture
async def client():
    async with ExactNameClient() as client:
        yield client


@pytest.mark.asyncio
async def test_model_exact_name(client: ExactNameClient):
    assert hasattr(model_models, "my_model")
    assert not hasattr(model_models, "My_model")

    body = model_models.my_model(name="test")
    result = await client.model.send(body)

    assert result == body


@pytest.mark.asyncio
async def test_property_exact_name(client: ExactNameClient):
    body = property_models.ScopedModel(_my_name="test")
    result = await client.property.send(body)

    assert result == body
    assert result._my_name == "test"

    with pytest.raises(AttributeError):
        result.my_name
