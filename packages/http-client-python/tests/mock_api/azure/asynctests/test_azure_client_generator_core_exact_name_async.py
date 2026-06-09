# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from specs.azure.clientgenerator.core.exactname.aio import ExactNameClient
from specs.azure.clientgenerator.core.exactname.model.models import My_model
from specs.azure.clientgenerator.core.exactname.property.models import ScopedModel
from specs.azure.clientgenerator.core.exactname.enumvalue.models import AgentEndpointProtocol, EndpointConfig


@pytest_asyncio.fixture
async def client():
    async with ExactNameClient() as client:
        yield client


@pytest.mark.asyncio
async def test_model(client: ExactNameClient):
    body = My_model(name="test")
    response = await client.model.send(body=body)
    assert response.name == "test"


@pytest.mark.asyncio
async def test_property(client: ExactNameClient):
    body = ScopedModel({"name": "test"})
    response = await client.property.send(body=body)
    assert response._my_name == "test"


def test_model_class_name_preserved():
    # exact("my_model") should preserve the name as-is without casing transformation,
    # so the generated class is `My_model` (only the first letter capitalized for class naming),
    # not `MyModel`.
    assert My_model.__name__ == "My_model"


def test_property_name_preserved():
    # exact("_my_name") scoped to python should preserve the property name exactly,
    # including the leading underscore, instead of being stripped or having its case changed.
    assert "_my_name" in ScopedModel.__annotations__


@pytest.mark.asyncio
async def test_enum_value(client: ExactNameClient):
    body = EndpointConfig(protocol=AgentEndpointProtocol.A2A)
    response = await client.enum_value.send(body=body)
    assert response.protocol == "a2a"


def test_enum_value_member_name_preserved():
    # exact("A2A") should preserve the enum member name as-is, so Python should NOT
    # convert it to "A_2_A". The wire value stays "a2a".
    assert AgentEndpointProtocol.A2A.name == "A2A"
    assert AgentEndpointProtocol.A2A.value == "a2a"


@pytest.mark.asyncio
async def test_operation(client: ExactNameClient):
    await client.operation.myOp()


def test_operation_method_name_preserved():
    # exact("myOp") should preserve the operation method name as-is, so Python should NOT
    # convert it to "my_op".
    from specs.azure.clientgenerator.core.exactname.operation.aio.operations import OperationOperations

    assert hasattr(OperationOperations, "myOp")
    assert not hasattr(OperationOperations, "my_op")


@pytest.mark.asyncio
async def test_parameter(client: ExactNameClient):
    await client.parameter.send(myParam="hello")
