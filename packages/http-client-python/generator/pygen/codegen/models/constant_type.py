# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import logging
from typing import Dict, Any, Optional, TYPE_CHECKING, Union
from .base import BaseType
from .imports import FileImport, ImportType, TypingSection
from .primitive_types import IntegerType, BinaryType, StringType, BooleanType
from .utils import add_to_description

if TYPE_CHECKING:
    from .code_model import CodeModel

_LOGGER = logging.getLogger(__name__)


class ConstantType(BaseType):
    """Schema for constants that will be serialized.

    :param yaml_data: the yaml data for this schema
    :type yaml_data: dict[str, Any]
    :param str value: The actual value of this constant.
    :param schema: The schema for the value of this constant.
    :type schema: ~autorest.models.PrimitiveType
    """

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        value_type: BaseType,
        value: Optional[Union[str, int, float]],
    ) -> None:
        super().__init__(yaml_data=yaml_data, code_model=code_model)
        self.value_type = value_type
        self.value = value

    def get_declaration(self, value=None):
        if value and value != self.value:
            _LOGGER.warning(
                "Passed in value of %s differs from constant value of %s. Choosing constant value",
                str(value),
                str(self.value),
            )
        if self.value is None:
            return "None"
        return self.value_type.get_declaration(self.value)

    def description(self, *, is_operation_file: bool) -> str:
        if is_operation_file:
            return ""
        return add_to_description(
            self.yaml_data.get("description", ""),
            f"Default value is {self.get_declaration()}.",
        )

    @property
    def serialization_type(self) -> str:
        """Returns the serialization value for msrest.

        :return: The serialization value for msrest
        :rtype: str
        """
        return self.value_type.serialization_type

    def docstring_text(self, **kwargs: Any) -> str:
        return "constant"

    def docstring_type(self, **kwargs: Any) -> str:
        """The python type used for RST syntax input and type annotation.

        :param str namespace: Optional. The namespace for the models.
        """
        return self.value_type.docstring_type(**kwargs)

    def type_annotation(self, **kwargs: Any) -> str:
        return f"Literal[{self.get_declaration()}]" if self._is_literal else self.value_type.type_annotation(**kwargs)

    @property
    def _is_literal(self) -> bool:
        return isinstance(self.value_type, (IntegerType, BinaryType, StringType, BooleanType))

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "ConstantType":
        """Constructs a ConstantType from yaml data.

        :param yaml_data: the yaml data from which we will construct this schema
        :type yaml_data: dict[str, Any]

        :return: A created ConstantType
        :rtype: ~autorest.models.ConstantType
        """
        from . import build_type

        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            value_type=build_type(yaml_data["valueType"], code_model),
            value=yaml_data["value"],
        )

    def get_json_template_representation(
        self,
        *,
        client_default_value_declaration: Optional[str] = None,
    ) -> Any:
        return self.value_type.get_json_template_representation(
            client_default_value_declaration=self.get_declaration(),
        )

    def _imports_shared(self, **kwargs: Any):
        file_import = super().imports(**kwargs)
        file_import.merge(self.value_type.imports(**kwargs))
        return file_import

    def imports_for_multiapi(self, **kwargs: Any) -> FileImport:
        return self._imports_shared(**kwargs)

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = self._imports_shared(**kwargs)
        if self._is_literal:
            file_import.add_submodule_import("typing", "Literal", ImportType.STDLIB, TypingSection.REGULAR)
        return file_import

    @property
    def instance_check_template(self) -> str:
        return self.value_type.instance_check_template
