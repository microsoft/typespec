# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Any, Dict, Optional, Union, TYPE_CHECKING, List
from .base import BaseType
from .imports import FileImport, ImportType, TypingSection

if TYPE_CHECKING:
    from .code_model import CodeModel
    from .model_type import ModelType


class ListType(BaseType):
    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        element_type: BaseType,
    ) -> None:
        super().__init__(yaml_data=yaml_data, code_model=code_model)
        self.element_type = element_type
        self.max_items: Optional[int] = yaml_data.get("maxItems")
        self.min_items: Optional[int] = yaml_data.get("minItems")
        self.unique_items: bool = yaml_data.get("uniqueItems", False)

    @property
    def encode(self) -> Optional[str]:
        return self.element_type.encode if hasattr(self.element_type, "encode") else None  # type: ignore

    @property
    def serialization_type(self) -> str:
        return f"[{self.element_type.serialization_type}]"

    def type_annotation(self, **kwargs: Any) -> str:
        if (
            self.code_model.options["version_tolerant"]
            and self.element_type.is_xml
            and not self.code_model.options["models_mode"]
        ):
            # this means we're version tolerant XML, we just return the XML element
            return self.element_type.type_annotation(**kwargs)
        return f"List[{self.element_type.type_annotation(**kwargs)}]"

    def description(self, *, is_operation_file: bool) -> str:
        return "" if is_operation_file else self.yaml_data.get("description", "")

    @property
    def xml_serialization_ctxt(self) -> Optional[str]:
        attrs_list = []
        base_xml_map = super().xml_serialization_ctxt
        if base_xml_map:
            attrs_list.append(base_xml_map)

        # Attribute at the list level
        if self.xml_metadata.get("wrapped", False):
            attrs_list.append("'wrapped': True")

        # Attributes of the items
        item_xml_metadata = self.element_type.xml_metadata
        if item_xml_metadata.get("name"):
            attrs_list.append(f"'itemsName': '{item_xml_metadata['name']}'")
        if item_xml_metadata.get("prefix", False):
            attrs_list.append(f"'itemsPrefix': '{item_xml_metadata['prefix']}'")
        if item_xml_metadata.get("namespace", False):
            attrs_list.append(f"'itemsNs': '{item_xml_metadata['namespace']}'")

        return ", ".join(attrs_list)

    def docstring_type(self, **kwargs: Any) -> str:
        if self.code_model.options["version_tolerant"] and self.element_type.xml_metadata:
            # this means we're version tolerant XML, we just return the XML element
            return self.element_type.docstring_type(**kwargs)
        return f"list[{self.element_type.docstring_type(**kwargs)}]"

    def docstring_text(self, **kwargs: Any) -> str:
        if self.code_model.options["version_tolerant"] and self.element_type.xml_metadata:
            # this means we're version tolerant XML, we just return the XML element
            return self.element_type.docstring_text(**kwargs)
        return f"list of {self.element_type.docstring_text(**kwargs)}"

    @property
    def validation(self) -> Optional[Dict[str, Union[bool, int, str]]]:
        validation: Dict[str, Union[bool, int, str]] = {}
        if self.max_items:
            validation["max_items"] = self.max_items
            validation["min_items"] = self.min_items or 0
        if self.min_items:
            validation["min_items"] = self.min_items
        if self.unique_items:
            validation["unique"] = True
        return validation or None

    def get_json_template_representation(
        self,
        *,
        client_default_value_declaration: Optional[str] = None,
    ) -> Any:
        return [
            self.element_type.get_json_template_representation(
                client_default_value_declaration=client_default_value_declaration,
            )
        ]

    def get_polymorphic_subtypes(self, polymorphic_subtypes: List["ModelType"]) -> None:
        from .model_type import ModelType

        if isinstance(self.element_type, ModelType):
            is_polymorphic_subtype = (
                self.element_type.discriminator_value and not self.element_type.discriminated_subtypes
            )
            if self.element_type.name not in (m.name for m in polymorphic_subtypes) and is_polymorphic_subtype:
                polymorphic_subtypes.append(self.element_type)

    @property
    def instance_check_template(self) -> str:
        return "isinstance({}, list)"

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "ListType":
        from . import build_type

        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            element_type=build_type(yaml_data=yaml_data["elementType"], code_model=code_model),
        )

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = FileImport(self.code_model)
        if not (
            self.code_model.options["version_tolerant"]
            and self.element_type.is_xml
            and not self.code_model.options["models_mode"]
        ):
            file_import.add_submodule_import("typing", "List", ImportType.STDLIB, TypingSection.CONDITIONAL)
        file_import.merge(self.element_type.imports(**kwargs))
        return file_import

    @property
    def type_description(self) -> str:
        return f"[{self.element_type.type_description}]"
