# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Any, Dict, List, Optional, TYPE_CHECKING, Type, Tuple, Union
import re
from .imports import FileImport, ImportType, TypingSection
from .base import BaseType
from .model_type import ModelType

if TYPE_CHECKING:
    from .code_model import CodeModel


class CombinedType(BaseType):
    """A type that consists of multiple different types.

    Used by body parameters that have multiple types, i.e. one that can be
    a stream body or a JSON body.
    """

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        types: List[BaseType],
    ) -> None:
        super().__init__(yaml_data, code_model)
        self.types = types  # the types that this type is combining
        self.name = yaml_data.get("name")
        self._is_union_of_literals = all(i.type == "constant" for i in self.types)

    @property
    def serialization_type(self) -> str:
        """The tag recognized by 'msrest' as a serialization/deserialization.

        'str', 'int', 'float', 'bool' or
        https://github.com/Azure/msrest-for-python/blob/b505e3627b547bd8fdc38327e86c70bdb16df061/msrest/serialization.py#L407-L416

        or the object schema name (e.g. DotSalmon).

        If list: '[str]'
        If dict: '{str}'
        """
        if not all(t for t in self.types if t.type == "constant"):
            raise ValueError("Shouldn't get serialization type of a combinedtype")
        return self.types[0].serialization_type

    @property
    def client_default_value(self) -> Any:
        return self.yaml_data.get("clientDefaultValue")

    def description(self, *, is_operation_file: bool) -> str:
        if len(self.types) == 2:
            return f"Is either a {self.types[0].type_description} type or a {self.types[1].type_description} type."
        return f"Is one of the following types: {', '.join([t.type_description for t in self.types])}"

    def docstring_text(self, **kwargs: Any) -> str:
        return " or ".join(t.docstring_text(**kwargs) for t in self.types)

    def docstring_type(self, **kwargs: Any) -> str:
        return " or ".join(t.docstring_type(**kwargs) for t in self.types)

    def type_annotation(self, **kwargs: Any) -> str:
        if self.name:
            return f'"_types.{self.name}"'
        return self.type_definition(**kwargs)

    def type_definition(self, **kwargs: Any) -> str:
        """The python type used for type annotation

        Special case for enum, for instance: Union[str, "EnumName"]
        """
        # remove duplicates
        inside_types = list(dict.fromkeys([type.type_annotation(**kwargs) for type in self.types]))
        if len(inside_types) == 1:
            return inside_types[0]
        if self._is_union_of_literals:
            parsed_values = []
            for entry in inside_types:
                match = re.search(r"Literal\[(.*)\]", entry)
                if match is not None:
                    parsed_values.append(match.group(1))
            join_string = ", ".join(parsed_values)
            return f"Literal[{join_string}]"

        # If the inside types has been a Union, peel first and then re-union
        pattern = re.compile(r"Union\[.*\]")
        return f'Union[{", ".join(map(lambda x: x[6: -1] if pattern.match(x) else x, inside_types))}]'

    @property
    def is_form_data(self) -> bool:
        return any(t.is_form_data for t in self.types)

    def get_json_template_representation(
        self,
        *,
        client_default_value_declaration: Optional[str] = None,
    ) -> Any:
        return self.types[0].get_json_template_representation(
            client_default_value_declaration=client_default_value_declaration,
        )

    def get_polymorphic_subtypes(self, polymorphic_subtypes: List["ModelType"]) -> None:
        raise ValueError("You shouldn't get polymorphic subtypes of multiple types")

    @property
    def instance_check_template(self) -> str:
        """Template of what an instance check of a variable for this type would look like"""
        raise ValueError("You shouldn't do instance checks on a multiple type")

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = FileImport(self.code_model)
        if self.name and not kwargs.get("is_types_file"):
            file_import.add_submodule_import(
                kwargs.pop("relative_path"),
                "_types",
                ImportType.LOCAL,
                TypingSection.TYPING,
            )
            return file_import
        for type in self.types:
            file_import.merge(type.imports(**kwargs))
        if not self._is_union_of_literals:
            file_import.add_submodule_import("typing", "Union", ImportType.STDLIB)
        return file_import

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "BaseType":
        from . import build_type

        return cls(
            yaml_data,
            code_model,
            [build_type(t, code_model) for t in yaml_data["types"]],
        )

    def target_model_subtype(
        self,
        target_types: Union[
            Tuple[Type[ModelType]],
            Tuple[Type[ModelType], Type[ModelType]],
        ],
    ) -> Optional[ModelType]:
        for sub_t in self.types:
            if isinstance(sub_t, target_types):
                return sub_t  # type: ignore
        return None
