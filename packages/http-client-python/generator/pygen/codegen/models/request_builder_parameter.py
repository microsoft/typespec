# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import TYPE_CHECKING, Any, Dict
from .parameter import (
    ParameterLocation,
    ParameterMethodLocation,
    Parameter,
    BodyParameter,
)
from .base import BaseType
from .primitive_types import BinaryType, StringType
from .combined_type import CombinedType

if TYPE_CHECKING:
    from .code_model import CodeModel


class RequestBuilderBodyParameter(BodyParameter):
    """BOdy parmaeter for RequestBuilders"""

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        if (
            isinstance(self.type, (BinaryType, StringType))
            or any("xml" in ct for ct in self.content_types)
            or self.code_model.options["models_mode"] == "dpg"
        ):
            self.client_name = "content"
        else:
            self.client_name = "json"

    def type_annotation(self, **kwargs: Any) -> str:
        if self.type.is_xml:
            return "Any"  # xml type technically not in type signature for HttpRequest content param
        return super().type_annotation(**kwargs)

    @property
    def in_method_signature(self) -> bool:
        return (
            super().in_method_signature and not self.is_partial_body and self.code_model.options["models_mode"] != "dpg"
        )

    @property
    def method_location(self) -> ParameterMethodLocation:
        return (
            ParameterMethodLocation.KWARG
            if (self.constant or isinstance(self.type, CombinedType))
            else ParameterMethodLocation.KEYWORD_ONLY
        )

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "RequestBuilderBodyParameter":
        return super().from_yaml(yaml_data, code_model)  # type: ignore

    @property
    def name_in_high_level_operation(self) -> str:
        if self.client_name == "json":
            return "_json"
        return "_content"


class RequestBuilderParameter(Parameter):
    """Basic RequestBuilder Parameter."""

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        type: BaseType,
    ) -> None:
        super().__init__(yaml_data, code_model, type)
        # we don't want any default content type behavior in request builder
        if self.is_content_type:
            self.client_default_value = None
        if self.grouped_by and self.client_name[0] == "_":
            # we don't want hidden parameters for grouped by in request builders
            self.client_name = self.client_name[1:]

    @property
    def hide_in_operation_signature(self) -> bool:
        return False

    @property
    def in_method_signature(self) -> bool:
        if self.grouped_by and not self.in_flattened_body:
            return True
        return super().in_method_signature and not (
            self.location == ParameterLocation.ENDPOINT_PATH or self.in_flattened_body or self.grouper
        )

    @property
    def full_client_name(self) -> str:
        return self.client_name

    @property
    def method_location(self) -> ParameterMethodLocation:
        super_method_location = super().method_location
        if super_method_location == ParameterMethodLocation.KWARG:
            return super_method_location
        if self.in_overridden and super_method_location == ParameterMethodLocation.KEYWORD_ONLY:
            return ParameterMethodLocation.KWARG
        if self.location != ParameterLocation.PATH:
            return ParameterMethodLocation.KEYWORD_ONLY
        return super_method_location

    @property
    def name_in_high_level_operation(self) -> str:
        if self.grouped_by:
            return f"_{self.client_name}"
        if self.implementation == "Client":
            return f"self._config.{self.client_name}"
        return self.client_name
