# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from payload.xml.aio import XmlClient
from payload.xml.models import (
    SimpleModel,
    ModelWithSimpleArrays,
    ModelWithArrayOfModel,
    ModelWithAttributes,
    ModelWithUnwrappedArray,
    ModelWithRenamedFields,
    ModelWithEmptyArray,
    ModelWithText,
    ModelWithDictionary,
    ModelWithEncodedNames,
)


@pytest.fixture
async def client():
    async with XmlClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_simple_model(client: XmlClient):
    model = SimpleModel(name="foo", age=123)
    assert await client.simple_model_value.get() == model
    await client.simple_model_value.put(model)


@pytest.mark.asyncio
async def test_model_with_simple_arrays(client: XmlClient):
    model = ModelWithSimpleArrays(colors=["red", "green", "blue"], counts=[1, 2])
    assert await client.model_with_simple_arrays_value.get() == model
    await client.model_with_simple_arrays_value.put(model)


@pytest.mark.asyncio
async def test_model_with_array_of_model(client: XmlClient):
    model = ModelWithArrayOfModel(
        items_property=[
            SimpleModel(name="foo", age=123),
            SimpleModel(name="bar", age=456),
        ]
    )
    assert await client.model_with_array_of_model_value.get() == model
    await client.model_with_array_of_model_value.put(model)


@pytest.mark.asyncio
async def test_model_with_attributes(client: XmlClient):
    model = ModelWithAttributes(id1=123, id2="foo", enabled=True)
    assert await client.model_with_attributes_value.get() == model
    await client.model_with_attributes_value.put(model)


@pytest.mark.asyncio
async def test_model_with_unwrapped_array(client: XmlClient):
    model = ModelWithUnwrappedArray(colors=["red", "green", "blue"], counts=[1, 2])
    assert await client.model_with_unwrapped_array_value.get() == model
    await client.model_with_unwrapped_array_value.put(model)


@pytest.mark.asyncio
async def test_model_with_renamed_fields(client: XmlClient):
    model = ModelWithRenamedFields(
        input_data=SimpleModel(name="foo", age=123),
        output_data=SimpleModel(name="bar", age=456),
    )
    assert await client.model_with_renamed_fields_value.get() == model
    await client.model_with_renamed_fields_value.put(model)


@pytest.mark.asyncio
async def test_model_with_empty_array(client: XmlClient):
    model = ModelWithEmptyArray(items_property=[])
    assert await client.model_with_empty_array_value.get() == model
    await client.model_with_empty_array_value.put(model)


@pytest.mark.asyncio
async def test_model_with_text(client: XmlClient):
    model = ModelWithText(language="foo", content="\n  This is some text.\n")
    assert await client.model_with_text_value.get() == model
    await client.model_with_text_value.put(model)


@pytest.mark.asyncio
async def test_model_with_dictionary(client: XmlClient):
    model = ModelWithDictionary(metadata={"Color": "blue", "Count": "123", "Enabled": "false"})
    assert await client.model_with_dictionary_value.get() == model
    await client.model_with_dictionary_value.put(model)


@pytest.mark.asyncio
async def test_model_with_encoded_names(client: XmlClient):
    model = ModelWithEncodedNames(model_data=SimpleModel(name="foo", age=123), colors=["red", "green", "blue"])
    assert await client.model_with_encoded_names_value.get() == model
    await client.model_with_encoded_names_value.put(model)
