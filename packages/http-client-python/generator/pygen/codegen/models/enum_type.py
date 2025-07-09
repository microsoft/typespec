# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Any, Dict, List, TYPE_CHECKING, Optional, cast

from .base import BaseType
from .imports import FileImport, ImportType, TypingSection
from .utils import NamespaceType


if TYPE_CHECKING:
    from .code_model import CodeModel


class EnumValue(BaseType):
    """Model containing necessary information for a single value of an enum.

    :param str name: The name of this enum value
    :param str value: The value of this enum value
    :param str description: Optional. The description for this enum value
    """

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        enum_type: "EnumType",
        value_type: BaseType,
    ) -> None:
        super().__init__(yaml_data=yaml_data, code_model=code_model)
        self.name: str = self.yaml_data["name"]
        self.value: str = self.yaml_data["value"]
        self.enum_type = enum_type
        self.value_type = value_type

    def description(self, *, is_operation_file: bool) -> str:
        return self.yaml_data.get("description", "")

    def type_annotation(self, **kwargs: Any) -> str:
        """The python type used for type annotation"""
        return f"Literal[{self.enum_type.name}.{self.name}]"

    def get_declaration(self, value=None):
        return self.enum_type.name + "." + self.name

    def docstring_text(self, **kwargs: Any) -> str:
        return self.enum_type.name + "." + self.name

    def docstring_type(self, **kwargs: Any) -> str:
        """The python type used for RST syntax input and type annotation."""

        type_annotation = self.value_type.type_annotation(**kwargs)
        enum_type_annotation = f"{self.enum_type.client_namespace}.models.{self.name}"
        return f"{type_annotation} or ~{enum_type_annotation}"

    def get_json_template_representation(
        self,
        *,
        client_default_value_declaration: Optional[str] = None,
    ) -> Any:
        # for better display effect, use the only value instead of var type
        return self.value_type.get_json_template_representation(
            client_default_value_declaration=client_default_value_declaration,
        )

    def serialization_type(self, **kwargs: Any) -> str:
        return self.value_type.serialization_type(**kwargs)

    @property
    def instance_check_template(self) -> str:
        return self.value_type.instance_check_template

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = FileImport(self.code_model)
        file_import.merge(self.value_type.imports(**kwargs))
        file_import.add_submodule_import("typing", "Literal", ImportType.STDLIB, TypingSection.REGULAR)
        serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
        file_import.add_submodule_import(
            self.code_model.get_relative_import_path(
                serialize_namespace,
                self.code_model.get_imported_namespace_for_model(self.enum_type.client_namespace),
                module_name=self.code_model.enums_filename,
            ),
            self.enum_type.name,
            ImportType.LOCAL,
            TypingSection.REGULAR,
        )

        return file_import

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "EnumValue":
        """Constructs an EnumValue from yaml data.

        :param yaml_data: the yaml data from which we will construct this object
        :type yaml_data: dict[str, Any]

        :return: A created EnumValue
        :rtype: ~autorest.models.EnumValue
        """
        from . import build_type

        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            enum_type=cast(EnumType, build_type(yaml_data["enumType"], code_model)),
            value_type=build_type(yaml_data["valueType"], code_model),
        )


class EnumType(BaseType):
    """Schema for enums that will be serialized.

    :param yaml_data: the yaml data for this schema
    :type yaml_data: dict[str, Any]
    :param str description: The description of this enum
    :param str name: The name of the enum.
    :type element_type: ~autorest.models.PrimitiveType
    :param values: List of the values for this enum
    :type values: list[~autorest.models.EnumValue]
    """

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        values: List["EnumValue"],
        value_type: BaseType,
    ) -> None:
        super().__init__(yaml_data=yaml_data, code_model=code_model)
        self.name: str = yaml_data["name"][0].upper() + yaml_data["name"][1:]
        self.values = values
        self.value_type = value_type
        self.internal: bool = self.yaml_data.get("internal", False)
        self.cross_language_definition_id: Optional[str] = self.yaml_data.get("crossLanguageDefinitionId")
        self.client_namespace: str = self.yaml_data.get("clientNamespace", code_model.namespace)

    def __lt__(self, other):
        return self.name.lower() < other.name.lower()

    def serialization_type(self, **kwargs: Any) -> str:
        """Returns the serialization value for msrest.

        :return: The serialization value for msrest
        :rtype: str
        """
        return self.value_type.serialization_type(**kwargs)

    def description(self, *, is_operation_file: bool) -> str:
        possible_values = [self.get_declaration(v.value) for v in self.values]
        if not possible_values:
            return ""
        if len(possible_values) == 1:
            return possible_values[0]
        if len(possible_values) == 2:
            possible_values_str = " and ".join(possible_values)
        else:
            possible_values_str = (
                ", ".join(possible_values[: len(possible_values) - 1]) + f", and {possible_values[-1]}"
            )

        enum_description = f"Known values are: {possible_values_str}."
        return enum_description

    def type_annotation(self, **kwargs: Any) -> str:
        """The python type used for type annotation

        :return: The type annotation for this schema
        :rtype: str
        """
        if self.code_model.options["models-mode"]:

            module_name = ""
            if kwargs.get("need_model_alias", True):
                serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
                model_alias = self.code_model.get_unique_models_alias(serialize_namespace, self.client_namespace)
                module_name = f"{model_alias}."
            file_name = f"{self.code_model.enums_filename}." if self.internal else ""
            model_name = module_name + file_name + self.name
            # we don't need quoted annotation in operation files, and need it in model folder files.
            if not kwargs.get("is_operation_file", False):
                model_name = f'"{model_name}"'

            return f"Union[{self.value_type.type_annotation(**kwargs)}, {model_name}]"
        return self.value_type.type_annotation(**kwargs)

    def get_declaration(self, value: Any) -> str:
        return self.value_type.get_declaration(value)

    def docstring_text(self, **kwargs: Any) -> str:
        if self.code_model.options["models-mode"]:
            return self.name
        return self.value_type.type_annotation(**kwargs)

    def docstring_type(self, **kwargs: Any) -> str:
        """The python type used for RST syntax input and type annotation."""
        if self.code_model.options["models-mode"]:
            type_annotation = self.value_type.type_annotation(**kwargs)
            enum_type_annotation = f"{self.client_namespace}.models.{self.name}"
            return f"{type_annotation} or ~{enum_type_annotation}"
        return self.value_type.type_annotation(**kwargs)

    def get_json_template_representation(
        self,
        *,
        client_default_value_declaration: Optional[str] = None,
    ) -> Any:
        # for better display effect, use the only value instead of var type
        return self.value_type.get_json_template_representation(
            client_default_value_declaration=client_default_value_declaration,
        )

    @property
    def instance_check_template(self) -> str:
        return self.value_type.instance_check_template

    def fill_instance_from_yaml(self, yaml_data: Dict[str, Any], code_model: "CodeModel") -> None:
        for value in yaml_data["values"]:
            self.values.append(EnumValue.from_yaml(value, code_model))

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "EnumType":
        raise ValueError(
            "You shouldn't call from_yaml for EnumType to avoid recursion. "
            "Please initial a blank EnumType, then call .fill_instance_from_yaml on the created type."
        )

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = FileImport(self.code_model)
        file_import.merge(self.value_type.imports(**kwargs))
        if self.code_model.options["models-mode"]:
            file_import.add_submodule_import("typing", "Union", ImportType.STDLIB, TypingSection.CONDITIONAL)

            serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
            relative_path = self.code_model.get_relative_import_path(serialize_namespace, self.client_namespace)
            alias = self.code_model.get_unique_models_alias(serialize_namespace, self.client_namespace)
            serialize_namespace_type = kwargs.get("serialize_namespace_type")
            called_by_property = kwargs.get("called_by_property", False)
            if serialize_namespace_type in [NamespaceType.OPERATION, NamespaceType.CLIENT]:
                file_import.add_submodule_import(
                    relative_path,
                    "models",
                    ImportType.LOCAL,
                    alias=alias,
                    typing_section=TypingSection.REGULAR,
                )
            elif serialize_namespace_type == NamespaceType.TYPES_FILE or (
                serialize_namespace_type == NamespaceType.MODEL and called_by_property
            ):
                file_import.add_submodule_import(
                    relative_path,
                    "models",
                    ImportType.LOCAL,
                    alias=alias,
                    typing_section=TypingSection.TYPING,
                )

        file_import.merge(self.value_type.imports(**kwargs))
        return file_import
