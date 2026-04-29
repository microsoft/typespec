# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.flattenproperty import FlattenPropertyClient
from specs.azure.clientgenerator.core.flattenproperty.models import (
    ChildFlattenModel,
    ChildModel,
    FlattenModel,
    FlattenUnknownModel,
    NestedFlattenModel,
    Solution,
    SolutionProperties,
)


@pytest.fixture
def client():
    with FlattenPropertyClient() as client:
        yield client


# ========== test for spector ==========


def test_put_flatten_model(client: FlattenPropertyClient):
    resp = FlattenModel(name="test", properties=ChildModel(age=1, description="test"))
    assert client.put_flatten_model(FlattenModel(name="foo", properties=ChildModel(age=10, description="bar"))) == resp
    assert client.put_flatten_model(FlattenModel(name="foo", age=10, description="bar")) == resp


def test_put_nested_flatten_model(client: FlattenPropertyClient):
    # python doesn't support nested flatten model
    assert client.put_nested_flatten_model(
        NestedFlattenModel(
            name="foo",
            properties=ChildFlattenModel(summary="bar", properties=ChildModel(age=10, description="test")),
        )
    ) == NestedFlattenModel(
        name="test",
        properties=ChildFlattenModel(summary="test", properties=ChildModel(age=1, description="foo")),
    )


def test_put_flatten_unknown_model(client: FlattenPropertyClient):
    result = client.put_flatten_unknown_model(FlattenUnknownModel(name="foo"))
    assert result.name == "test"
    assert result.properties == {"key1": "value1", "key2": "value2"}


def test_put_flatten_read_only_model(client: FlattenPropertyClient):
    result = client.put_flatten_read_only_model(Solution(name="foo"))
    assert result == Solution(
        name="foo",
        properties=SolutionProperties(solution_id="solution1", title="Solution Title", content="Solution Content"),
    )
    assert result.solution_id == "solution1"
    assert result.title == "Solution Title"
    assert result.content == "Solution Content"


# ============test for compatibility ============
def test_dpg_model_common():
    flatten_model = FlattenModel(name="hello", properties=ChildModel(age=0, description="test"))
    assert flatten_model.name == "hello"
    assert flatten_model.properties.age == 0
    assert flatten_model.properties.description == "test"


def test_dpg_model_none():
    flatten_model = FlattenModel()
    assert flatten_model.name is None
    assert flatten_model.properties is None
    assert flatten_model.age is None
    assert flatten_model.description is None


def test_dpg_model_compatibility():
    flatten_model = FlattenModel(description="test", age=0)
    assert flatten_model.description == "test"
    assert flatten_model.age == 0
    assert flatten_model.properties.description == "test"
    assert flatten_model.properties.age == 0


def test_dpg_model_setattr():
    flatten_model = FlattenModel()

    flatten_model.age = 0
    assert flatten_model.properties.age == 0
    flatten_model.description = "test"
    assert flatten_model.properties.description == "test"

    flatten_model.properties.age = 1
    assert flatten_model.age == 1
    flatten_model.properties.description = "test2"
    assert flatten_model.description == "test2"


def test_dpg_model_exception():
    with pytest.raises(AttributeError):
        FlattenModel().no_prop
