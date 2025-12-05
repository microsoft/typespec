# ------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------
import datetime
from typing import (
    Any,
    Mapping,
    Optional,
    overload,
)

from specs.azure.clientgenerator.core.flattenproperty._utils.model_base import (
    Model,
    rest_field,
)
from azure.core.serialization import attribute_list


class ModelProperty(Model):
    """This is a test model."""

    value: str = rest_field()
    """Required."""

    @overload
    def __init__(
        self,
        *,
        value: str,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ChildModel(Model):
    """This is the child model to be flattened.

    :ivar description: Required.
    :vartype description: str
    :ivar age: Required.
    :vartype age: int
    """

    description: str = rest_field()
    """Required."""
    age: int = rest_field()
    """Required."""
    model_property: "ModelProperty" = rest_field(name="modelProperty")
    """Required."""
    datetime_default: datetime.datetime = rest_field(name="datetimeDefault")
    datetime_rfc3339: datetime.datetime = rest_field(name="datetimeRfc3339", format="rfc3339")
    datetime_rfc7231: datetime.datetime = rest_field(name="datetimeRfc7231", format="rfc7231")
    datetime_unix_timestamp: datetime.datetime = rest_field(name="datetimeUnixTimestamp", format="unix-timestamp")

    @overload
    def __init__(
        self,
        *,
        description: str,
        age: int,
        model_property: "ModelProperty",
        datetime_default: datetime.datetime,
        datetime_rfc3339: datetime.datetime,
        datetime_rfc7231: datetime.datetime,
        datetime_unix_timestamp: datetime.datetime,
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class FlattenModel(Model):
    """This is the model with one level of flattening."""

    name: str = rest_field()
    """Required."""
    properties: "ChildModel" = rest_field()
    """Required."""

    __flattened_items = [
        "description",
        "age",
        "model_property",
        "datetime_default",
        "datetime_rfc3339",
        "datetime_rfc7231",
        "datetime_unix_timestamp",
    ]

    @overload
    def __init__(
        self,
        *,
        name: str,
        properties: "ChildModel",
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        _flattened_input = {k: kwargs.pop(k) for k in kwargs.keys() & self.__flattened_items}
        super().__init__(*args, **kwargs)
        for k, v in _flattened_input.items():
            setattr(self, k, v)

    def __getattr__(self, name: str) -> Any:
        if name in self.__flattened_items:
            if self.properties is None:
                return None
            return getattr(self.properties, name)
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

    def __setattr__(self, key: str, value: Any) -> None:
        if key in self.__flattened_items:
            if self.properties is None:
                self.properties = self._attr_to_rest_field["properties"]._class_type()
            setattr(self.properties, key, value)
        else:
            super().__setattr__(key, value)


def test_model_initialization():
    model = FlattenModel(
        name="test",
        description="a description",
        age=30,
        model_property=ModelProperty(value="test value"),
        datetime_default=datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc),
        datetime_rfc3339=datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc),
        datetime_rfc7231=datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc),
        datetime_unix_timestamp=datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc),
    )

    assert model.name == "test"

    assert model.description == "a description"
    assert model.properties.description == "a description"

    assert model.age == 30
    assert model.properties.age == 30

    assert model.model_property.value == "test value"
    assert model.properties.model_property == ModelProperty(value="test value")
    assert model.properties.model_property.value == "test value"

    assert model.datetime_default == datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc)
    assert model.properties.datetime_default == datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc)
    assert model.properties["datetimeDefault"] == "2023-01-12T00:00:00Z"

    assert model.datetime_rfc3339 == datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc)
    assert model.properties.datetime_rfc3339 == datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc)
    assert model.properties["datetimeRfc3339"] == "2023-01-12T00:00:00Z"

    assert model.datetime_rfc7231 == datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc)
    assert model.properties.datetime_rfc7231 == datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc)
    assert model.properties["datetimeRfc7231"] == "Thu, 12 Jan 2023 00:00:00 GMT"

    assert model.datetime_unix_timestamp == datetime.datetime(2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc)
    assert model.properties.datetime_unix_timestamp == datetime.datetime(
        2023, 1, 12, 0, 0, 0, tzinfo=datetime.timezone.utc
    )
    assert model.properties["datetimeUnixTimestamp"] == 1673481600


class FlattenModelWithOptionalProperties(Model):
    """This is the model with one level of flattening and optional properties."""

    name: str = rest_field()
    """Required."""
    properties: Optional["ModelProperty"] = rest_field()
    """Optional."""

    __flattened_items = ["value"]

    @overload
    def __init__(
        self,
        *,
        name: str,
        properties: Optional["ModelProperty"],
    ) -> None: ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]) -> None:
        """
        :param mapping: raw JSON to initialize the model.
        :type mapping: Mapping[str, Any]
        """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        _flattened_input = {k: kwargs.pop(k) for k in kwargs.keys() & self.__flattened_items}
        super().__init__(*args, **kwargs)
        for k, v in _flattened_input.items():
            setattr(self, k, v)

    def __getattr__(self, name: str) -> Any:
        if name in self.__flattened_items:
            if self.properties is None:
                return None
            return getattr(self.properties, name)
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

    def __setattr__(self, key: str, value: Any) -> None:
        if key in self.__flattened_items:
            if self.properties is None:
                self.properties = self._attr_to_rest_field["properties"]._class_type()
            setattr(self.properties, key, value)
        else:
            super().__setattr__(key, value)


def test_model_with_optional_properties_initialization():
    model = FlattenModelWithOptionalProperties(
        name="test",
        value="test value",
    )

    assert model.name == "test"

    assert model.value == "test value"
    assert model.properties.value == "test value"


def test_model_with_optional_properties_attribute_list():
    model = FlattenModelWithOptionalProperties(
        name="test",
    )

    attrs = attribute_list(model)
    assert sorted(attrs) == sorted(["name", "value"])
