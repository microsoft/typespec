# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import datetime
import pytest
from payload.xml import XmlClient
from payload.xml.models import (
    SimpleModel,
    ModelWithSimpleArrays,
    ModelWithArrayOfModel,
    ModelWithAttributes,
    ModelWithUnwrappedArray,
    ModelWithRenamedArrays,
    ModelWithOptionalField,
    ModelWithRenamedFields,
    ModelWithEmptyArray,
    ModelWithText,
    ModelWithDictionary,
    ModelWithEncodedNames,
    ModelWithEnum,
    ModelWithDatetime,
)


@pytest.fixture
def client():
    with XmlClient(endpoint="http://localhost:3000") as client:
        yield client


def test_simple_model(client: XmlClient):
    model = SimpleModel(name="foo", age=123)
    assert client.simple_model_value.get() == model
    client.simple_model_value.put(model)


def test_model_with_simple_arrays(client: XmlClient):
    model = ModelWithSimpleArrays(colors=["red", "green", "blue"], counts=[1, 2])
    assert client.model_with_simple_arrays_value.get() == model
    client.model_with_simple_arrays_value.put(model)


def test_model_with_array_of_model(client: XmlClient):
    model = ModelWithArrayOfModel(
        items_property=[
            SimpleModel(name="foo", age=123),
            SimpleModel(name="bar", age=456),
        ]
    )
    assert client.model_with_array_of_model_value.get() == model
    client.model_with_array_of_model_value.put(model)


def test_model_with_attributes(client: XmlClient):
    model = ModelWithAttributes(id1=123, id2="foo", enabled=True)
    assert client.model_with_attributes_value.get() == model
    client.model_with_attributes_value.put(model)


def test_model_with_unwrapped_array(client: XmlClient):
    model = ModelWithUnwrappedArray(colors=["red", "green", "blue"], counts=[1, 2])
    assert client.model_with_unwrapped_array_value.get() == model
    client.model_with_unwrapped_array_value.put(model)


def test_model_with_renamed_arrays(client: XmlClient):
    model = ModelWithRenamedArrays(colors=["red", "green", "blue"], counts=[1, 2])
    assert client.model_with_renamed_arrays_value.get() == model
    client.model_with_renamed_arrays_value.put(model)


def test_model_with_optional_field(client: XmlClient):
    model = ModelWithOptionalField(item="widget")
    assert client.model_with_optional_field_value.get() == model
    client.model_with_optional_field_value.put(model)


def test_model_with_renamed_fields(client: XmlClient):
    model = ModelWithRenamedFields(
        input_data=SimpleModel(name="foo", age=123),
        output_data=SimpleModel(name="bar", age=456),
    )
    assert client.model_with_renamed_fields_value.get() == model
    client.model_with_renamed_fields_value.put(model)


def test_model_with_empty_array(client: XmlClient):
    model = ModelWithEmptyArray(items_property=[])
    assert client.model_with_empty_array_value.get() == model
    client.model_with_empty_array_value.put(model)


def test_model_with_text(client: XmlClient):
    model = ModelWithText(language="foo", content="\n  This is some text.\n")
    assert client.model_with_text_value.get() == model
    client.model_with_text_value.put(model)


def test_model_with_dictionary(client: XmlClient):
    model = ModelWithDictionary(metadata={"Color": "blue", "Count": "123", "Enabled": "false"})
    assert client.model_with_dictionary_value.get() == model
    client.model_with_dictionary_value.put(model)


def test_model_with_encoded_names(client: XmlClient):
    model = ModelWithEncodedNames(model_data=SimpleModel(name="foo", age=123), colors=["red", "green", "blue"])
    assert client.model_with_encoded_names_value.get() == model
    client.model_with_encoded_names_value.put(model)


def test_model_with_enum(client: XmlClient):
    model = ModelWithEnum(status="success")
    assert client.model_with_enum_value.get() == model
    client.model_with_enum_value.put(model)


def test_model_with_datetime(client: XmlClient):
    model = ModelWithDatetime(
        rfc3339=datetime.datetime(2022, 8, 26, 18, 38, 0, tzinfo=datetime.timezone.utc),
        rfc7231=datetime.datetime(2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc),
    )
    result = client.model_with_datetime_value.get()
    assert result.rfc3339 == model.rfc3339
    assert result.rfc7231 == model.rfc7231


def test_xml_error_value(client: XmlClient, core_library):
    with pytest.raises(core_library.exceptions.HttpResponseError) as ex:
        client.xml_error_value.get()
    assert ex.value.status_code == 400
    assert ex.value.model.message == "Something went wrong"
    assert ex.value.model.code == 400
