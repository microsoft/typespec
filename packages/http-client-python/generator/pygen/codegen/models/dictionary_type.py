# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Any, Optional, TYPE_CHECKING
from .base import BaseType
from .imports import FileImport, ImportType

if TYPE_CHECKING:
    from .code_model import CodeModel
    from .model_type import ModelType


class DictionaryType(BaseType):
    """Schema for dictionaries that will be serialized.

    :param yaml_data: the yaml data for this schema
    :type yaml_data: dict[str, Any]
    :param element_type: The type of the value for the dictionary
    :type element_type: ~autorest.models.BaseType
    """

    def __init__(
        self,
        yaml_data: dict[str, Any],
        code_model: "CodeModel",
        element_type: BaseType,
    ) -> None:
        super().__init__(yaml_data=yaml_data, code_model=code_model)
        self.element_type = element_type
        self.element_nullable: bool = yaml_data.get("elementNullable", False)

    @property
    def encode(self) -> Optional[str]:
        return self.element_type.encode if hasattr(self.element_type, "encode") else None  # type: ignore

    def serialization_type(self, **kwargs: Any) -> str:
        """Returns the serialization value for msrest.

        :return: The serialization value for msrest
        :rtype: str
        """
        return f"{{{self.element_type.serialization_type(**kwargs)}}}"

    def type_annotation(self, **kwargs: Any) -> str:
        """The python type used for type annotation

        :return: The type annotation for this schema
        :rtype: str
        """
        element_annotation = self.element_type.type_annotation(**kwargs)
        if self.element_nullable:
            element_annotation = f"Optional[{element_annotation}]"
        return f"dict[str, {element_annotation}]"

    def description(self, *, is_operation_file: bool) -> str:
        return "" if is_operation_file else self.yaml_data.get("description", "")

    def docstring_text(self, **kwargs: Any) -> str:
        element_text = self.element_type.docstring_text(**kwargs)
        if self.element_nullable:
            element_text = f"({element_text} or None)"
        return f"dict mapping str to {element_text}"

    @property
    def xml_serialization_ctxt(self) -> Optional[str]:
        """No serialization ctxt for dictionaries"""
        return None

    def docstring_type(self, **kwargs: Any) -> str:
        """The python type used for RST syntax input and type annotation.

        :param str namespace: Optional. The namespace for the models.
        """
        element_docstring = self.element_type.docstring_type(**kwargs)
        if self.element_nullable:
            element_docstring = f"Optional[{element_docstring}]"
        return f"dict[str, {element_docstring}]"

    def get_json_template_representation(
        self,
        *,
        client_default_value_declaration: Optional[str] = None,
    ) -> Any:
        return {
            '"str"': self.element_type.get_json_template_representation(
                client_default_value_declaration=client_default_value_declaration,
            )
        }

    def get_polymorphic_subtypes(self, polymorphic_subtypes: list["ModelType"]) -> None:
        from .model_type import ModelType

        if isinstance(self.element_type, ModelType):
            is_polymorphic_subtype = (
                self.element_type.discriminator_value and not self.element_type.discriminated_subtypes
            )
            if self.element_type.name not in (m.name for m in polymorphic_subtypes) and is_polymorphic_subtype:
                polymorphic_subtypes.append(self.element_type)

    @classmethod
    def from_yaml(cls, yaml_data: dict[str, Any], code_model: "CodeModel") -> "DictionaryType":
        """Constructs a DictionaryType from yaml data.

        :param yaml_data: the yaml data from which we will construct this schema
        :type yaml_data: dict[str, Any]

        :return: A created DictionaryType
        :rtype: ~autorest.models.DictionaryType
        """
        element_schema: dict[str, Any] = yaml_data["elementType"]

        from . import build_type  # pylint: disable=import-outside-toplevel

        element_type = build_type(yaml_data=element_schema, code_model=code_model)

        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            element_type=element_type,
        )

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = FileImport(self.code_model)
        file_import.merge(self.element_type.imports(**kwargs))
        if self.element_nullable:
            file_import.add_submodule_import("typing", "Optional", ImportType.STDLIB)
        return file_import

    @property
    def instance_check_template(self) -> str:
        return "isinstance({}, dict)"

    @property
    def type_description(self) -> str:
        return f"{{str: {self.element_type.type_description}}}"
