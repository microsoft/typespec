# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Any, Dict, TYPE_CHECKING, List, Optional
from abc import ABC, abstractmethod
from .imports import FileImport


if TYPE_CHECKING:
    from .code_model import CodeModel
    from .model_type import ModelType


class BaseModel:
    """This is the base class for model representations that are based on some YAML data.

    :param yaml_data: the yaml data for this schema
    :type yaml_data: dict[str, Any]
    """

    def __init__(self, yaml_data: Dict[str, Any], code_model: "CodeModel") -> None:
        self.yaml_data = yaml_data
        self.code_model = code_model

    @property
    def id(self) -> int:
        return id(self.yaml_data)

    def __repr__(self):
        return f"<{self.__class__.__name__}>"


class BaseType(BaseModel, ABC):  # pylint: disable=too-many-public-methods
    """This is the base class for all types.

    :param yaml_data: the yaml data for this schema
    :type yaml_data: dict[str, Any]
    """

    def __init__(self, yaml_data: Dict[str, Any], code_model: "CodeModel") -> None:
        super().__init__(yaml_data, code_model)
        self.type = yaml_data["type"]  # the type discriminator
        self.api_versions: List[str] = yaml_data.get("apiVersions", [])  # api versions this type is in.

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "BaseType":
        return cls(yaml_data=yaml_data, code_model=code_model)

    def imports(self, **kwargs) -> FileImport:  # pylint: disable=unused-argument
        return FileImport(self.code_model)

    def imports_for_multiapi(self, **kwargs: Any) -> FileImport:
        return self.imports(**kwargs)

    def imports_for_sample(self) -> FileImport:
        return FileImport(self.code_model)

    @staticmethod
    def serialize_sample_value(value: Any) -> str:
        return repr(value)

    @property
    def xml_metadata(self) -> Dict[str, Any]:
        """XML metadata for the type, if the type has it."""
        return self.yaml_data.get("xmlMetadata", {})

    @property
    def is_xml(self) -> bool:
        """Whether the type is an XML type or not. Most likely not."""
        return bool(self.xml_metadata)

    @property
    def xml_serialization_ctxt(self) -> Optional[str]:
        """Return the serialization context in case this schema is used in an operation."""
        attrs_list = []
        if self.xml_metadata.get("name"):
            attrs_list.append(f"'name': '{self.xml_metadata['name']}'")
        if self.xml_metadata.get("attribute", False):
            attrs_list.append("'attr': True")
        if self.xml_metadata.get("prefix", False):
            attrs_list.append(f"'prefix': '{self.xml_metadata['prefix']}'")
        if self.xml_metadata.get("namespace", False):
            attrs_list.append(f"'ns': '{self.xml_metadata['namespace']}'")
        if self.xml_metadata.get("text"):
            attrs_list.append("'text': True")
        return ", ".join(attrs_list)

    @property
    def serialization_type(self) -> str:
        """The tag recognized by 'msrest' as a serialization/deserialization.

        'str', 'int', 'float', 'bool' or
        https://github.com/Azure/msrest-for-python/blob/b505e3627b547bd8fdc38327e86c70bdb16df061/msrest/serialization.py#L407-L416

        or the object schema name (e.g. DotSalmon).

        If list: '[str]'
        If dict: '{str}'
        """
        raise NotImplementedError()

    @property
    def msrest_deserialization_key(self) -> str:
        return self.serialization_type

    @property
    def client_default_value(self) -> Any:
        """Whether there's a client default value for this type"""
        return self.yaml_data.get("clientDefaultValue")

    @abstractmethod
    def description(self, *, is_operation_file: bool) -> str:
        """The description"""

    @abstractmethod
    def docstring_text(self, **kwargs: Any) -> str:
        """The names used in rtype documentation"""

    @abstractmethod
    def docstring_type(self, **kwargs: Any) -> str:
        """The python type used for RST syntax input.

        Special case for enum, for instance: 'str or ~namespace.EnumName'
        """

    @abstractmethod
    def type_annotation(self, **kwargs: Any) -> str:
        """The python type used for type annotation

        Special case for enum, for instance: Union[str, "EnumName"]
        """

    @property
    def validation(self) -> Optional[Dict[str, Any]]:
        """Whether there's any validation constraints on this type.

        Even though we generate validation maps if there are validation constraints,
        only SDKs with client-side-validate=true (0.001% libraries, if any) actually raise in this case.
        """
        return None

    def get_declaration(self, value: Any) -> str:
        """Return the current value from YAML as a Python string that represents the constant.

        Example, if schema is "bytearray" and value is "foo",
        should return bytearray("foo", encoding="utf-8")
        as a string.

        This is important for constant serialization.

        By default, return value, since it works sometimes (integer)
        """
        return str(value)

    @abstractmethod
    def get_json_template_representation(
        self,
        *,
        client_default_value_declaration: Optional[str] = None,
    ) -> Any:
        """Template of what this schema would look like as JSON input"""

    def get_polymorphic_subtypes(
        self, polymorphic_subtypes: List["ModelType"]  # pylint: disable=unused-argument
    ) -> None:
        return None

    @property
    @abstractmethod
    def instance_check_template(self) -> str:
        """Template of what an instance check of a variable for this type would look like"""

    @property
    def serialization_constraints(self) -> List[str]:
        """Whether there are any serialization constraints when serializing this type."""
        return []

    @property
    def type_description(self) -> str:
        return self.type_annotation()

    @property
    def is_form_data(self) -> bool:
        return False
