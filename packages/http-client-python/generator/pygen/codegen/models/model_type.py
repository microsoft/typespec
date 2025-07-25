# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from enum import Enum
from collections import OrderedDict
from typing import Any, Optional, TYPE_CHECKING, cast
import sys
from .utils import add_to_pylint_disable, NamespaceType
from .base import BaseType
from .constant_type import ConstantType
from .property import Property
from .imports import FileImport, ImportType, TypingSection
from ...utils import NAME_LENGTH_LIMIT

if sys.version_info >= (3, 8):
    from typing import Literal
else:
    from typing_extensions import Literal  # type: ignore

if TYPE_CHECKING:
    from .code_model import CodeModel


class UsageFlags(Enum):
    Default = 0
    Input = 2
    Output = 4
    ApiVersionEnum = 8
    JsonMergePatch = 16
    MultipartFormData = 32
    Spread = 64
    Error = 128
    Json = 256
    Xml = 512


def _get_properties(type: "ModelType", properties: list[Property]) -> list[Property]:
    for parent in type.parents:
        # here we're adding the properties from our parents

        # need to make sure that the properties we choose from our parent also don't contain
        # any of our own properties
        property_names = set([p.client_name for p in properties] + [p.client_name for p in type.properties])
        chosen_parent_properties = [p for p in parent.properties if p.client_name not in property_names]
        properties = _get_properties(parent, chosen_parent_properties) + properties
    return properties


class ModelType(BaseType):  # pylint: disable=too-many-instance-attributes, too-many-public-methods
    """Represents a class ready to be serialized in Python.

    :param str name: The name of the class.
    :param str description: The description of the class.
    :param properties: the optional properties of the class.
    :type properties: dict(str, str)
    """

    base: Literal["msrest", "dpg", "json"]

    def __init__(
        self,
        yaml_data: dict[str, Any],
        code_model: "CodeModel",
        *,
        properties: Optional[list[Property]] = None,
        parents: Optional[list["ModelType"]] = None,
        discriminated_subtypes: Optional[dict[str, "ModelType"]] = None,
    ) -> None:
        super().__init__(yaml_data=yaml_data, code_model=code_model)
        self.name: str = self.yaml_data["name"]
        self.max_properties: Optional[int] = self.yaml_data.get("maxProperties")
        self.min_properties: Optional[int] = self.yaml_data.get("minProperties")
        self.properties = properties or []
        self.parents = parents or []
        self.discriminated_subtypes = discriminated_subtypes or {}
        self.discriminator_value: Optional[str] = self.yaml_data.get("discriminatorValue")
        self._created_json_template_representation = False
        self._got_polymorphic_subtypes = False
        self.internal: bool = self.yaml_data.get("internal", False)
        self.snake_case_name: str = self.yaml_data["snakeCaseName"]
        self.cross_language_definition_id: Optional[str] = self.yaml_data.get("crossLanguageDefinitionId")
        self.usage: int = self.yaml_data.get("usage", UsageFlags.Input.value | UsageFlags.Output.value)
        self.client_namespace: str = self.yaml_data.get("clientNamespace", code_model.namespace)

    @property
    def is_usage_output(self) -> bool:
        return bool(self.usage & UsageFlags.Output.value)

    @property
    def flattened_property(self) -> Optional[Property]:
        try:
            return next(p for p in self.properties if p.flatten)
        except StopIteration:
            return None

    @property
    def flattened_items(self) -> list[str]:
        return [
            item.client_name
            for prop in self.properties
            if isinstance(prop.type, ModelType) and prop.flatten
            for item in prop.type.properties
        ]

    @property
    def is_form_data(self) -> bool:
        return any(p.is_multipart_file_input for p in self.properties)

    @property
    def is_xml(self) -> bool:
        return self.yaml_data.get("isXml", False)

    @property
    def msrest_deserialization_key(self) -> str:
        return self.name

    @property
    def is_polymorphic(self) -> bool:
        return any(p.is_polymorphic for p in self.properties)

    def description(self, *, is_operation_file: bool = False) -> str:
        return "" if is_operation_file else self.yaml_data.get("description", self.name)

    def get_declaration(self, value: Any) -> str:
        return f"{self.name}()"

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} {self.name}>"

    @property
    def xml_serialization_ctxt(self) -> Optional[str]:
        # object schema contains _xml_map, they don't need serialization context
        return ""

    @property
    def xml_map_content(self) -> Optional[str]:
        # This is NOT an error on the super call, we use the serialization context for "xml_map",
        # but we don't want to write a serialization context for an object.
        return super().xml_serialization_ctxt

    @property
    def discriminated_subtypes_name_mapping(self) -> dict[str, str]:
        return {k: v.name for k, v in self.discriminated_subtypes.items()}

    def get_json_template_representation(
        self,
        *,
        client_default_value_declaration: Optional[str] = None,
    ) -> Any:
        if self._created_json_template_representation:
            return "..."  # do this to avoid loop
        self._created_json_template_representation = True
        if self.discriminated_subtypes:
            # we will instead print the discriminated subtypes
            self._created_json_template_representation = False
            return f'"{self.snake_case_name}"' if self.code_model.for_test else self.snake_case_name

        # don't add additional properties, because there's not really a concept of
        # additional properties in the template
        representation = {
            f'"{prop.wire_name}"': prop.get_json_template_representation(
                client_default_value_declaration=client_default_value_declaration,
            )
            for prop in [
                p for p in self.properties if not (p.is_discriminator or p.client_name == "additional_properties")
            ]
        }
        if self.discriminator and self.discriminator_value:
            representation[f'"{self.discriminator.wire_name}"'] = f'"{self.discriminator_value}"'

        # once we've finished, we want to reset created_json_template_representation to false
        # so we can call it again
        self._created_json_template_representation = False
        optional_keys = [f'"{p.wire_name}"' for p in self.properties if getattr(p, "optional", False)]
        return OrderedDict(
            sorted(
                representation.items(),
                key=lambda item: f"{1 if item[0] in optional_keys else 0}{item[0]}",
            )
        )

    def get_polymorphic_subtypes(self, polymorphic_subtypes: list["ModelType"]) -> None:
        is_polymorphic_subtype = self.discriminator_value and not self.discriminated_subtypes
        if self._got_polymorphic_subtypes:
            return
        self._got_polymorphic_subtypes = True
        if self.name not in (m.name for m in polymorphic_subtypes) and is_polymorphic_subtype:
            polymorphic_subtypes.append(self)
        for discriminated_subtype in self.discriminated_subtypes.values():
            discriminated_subtype.get_polymorphic_subtypes(polymorphic_subtypes)
        for property in self.properties:
            property.get_polymorphic_subtypes(polymorphic_subtypes)
        self._got_polymorphic_subtypes = False

    @classmethod
    def from_yaml(cls, yaml_data: dict[str, Any], code_model: "CodeModel") -> "ModelType":
        raise ValueError(
            "You shouldn't call from_yaml for ModelType to avoid recursion. "
            "Please initial a blank ModelType, then call .fill_instance_from_yaml on the created type."
        )

    def fill_instance_from_yaml(self, yaml_data: dict[str, Any], code_model: "CodeModel") -> None:
        from . import build_type

        self.parents = [cast(ModelType, build_type(bm, code_model)) for bm in yaml_data.get("parents", [])]
        properties = [Property.from_yaml(p, code_model) for p in yaml_data["properties"]]
        self.properties = _get_properties(self, properties)
        # checking to see if this is a polymorphic class
        self.discriminated_subtypes = {
            k: cast(ModelType, build_type(v, code_model))
            for k, v in self.yaml_data.get("discriminatedSubtypes", {}).items()
        }

    @property
    def has_readonly_or_constant_property(self) -> bool:
        return any(x.readonly or x.constant or x.visibility == ["read"] for x in self.properties)

    @property
    def discriminator(self) -> Optional[Property]:
        try:
            return next(p for p in self.properties if p.is_discriminator)
        except StopIteration:
            return None

    @property
    def discriminator_property(self) -> Optional[Property]:
        try:
            return next(
                p
                for p in self.properties
                if p.is_discriminator and isinstance(p.type, ConstantType) and p.type.value == self.discriminator_value
            )
        except StopIteration:
            return None

    def pylint_disable(self) -> str:
        retval: str = ""
        if len(self.name) > NAME_LENGTH_LIMIT:
            retval = add_to_pylint_disable(retval, "name-too-long")
        return retval

    @property
    def init_pylint_disable(self) -> str:
        retval: str = ""
        if len(self.properties) > 23:
            retval = add_to_pylint_disable(retval, "too-many-locals")
        return retval


class JSONModelType(ModelType):
    base = "json"

    def type_annotation(self, **kwargs: Any) -> str:
        return "ET.Element" if self.is_xml else "JSON"

    def serialization_type(self, **kwargs: Any) -> str:
        return "object"

    def docstring_type(self, **kwargs: Any) -> str:
        return "ET.Element" if self.is_xml else "JSON"

    def docstring_text(self, **kwargs: Any) -> str:
        return "XML Element" if self.is_xml else "JSON object"

    @property
    def instance_check_template(self) -> str:
        return "isinstance({}, MutableMapping)"

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = FileImport(self.code_model)
        file_import.add_submodule_import("typing", "Any", ImportType.STDLIB, TypingSection.CONDITIONAL)
        file_import.define_mutable_mapping_type()
        if self.is_xml:
            file_import.add_submodule_import("xml.etree", "ElementTree", ImportType.STDLIB, alias="ET")
        return file_import


class GeneratedModelType(ModelType):
    def type_annotation(self, **kwargs: Any) -> str:
        is_operation_file = kwargs.pop("is_operation_file", False)
        skip_quote = kwargs.get("skip_quote", False)
        module_name = ""
        if kwargs.get("need_model_alias", True):
            serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
            model_alias = self.code_model.get_unique_models_alias(serialize_namespace, self.client_namespace)
            module_name = f"{model_alias}."
        file_name = f"{self.code_model.models_filename}." if self.internal else ""
        retval = module_name + file_name + self.name
        return retval if is_operation_file or skip_quote else f'"{retval}"'

    def docstring_type(self, **kwargs: Any) -> str:
        type_annotation = self.type_annotation(need_model_alias=False, skip_quote=True, **kwargs)
        return f"~{self.client_namespace}.models.{type_annotation}"

    def docstring_text(self, **kwargs: Any) -> str:
        return self.name

    @property
    def type_description(self) -> str:
        return self.name

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = super().imports(**kwargs)
        serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
        relative_path = self.code_model.get_relative_import_path(serialize_namespace, self.client_namespace)
        alias = self.code_model.get_unique_models_alias(serialize_namespace, self.client_namespace)
        serialize_namespace_type = kwargs.get("serialize_namespace_type")
        called_by_property = kwargs.get("called_by_property", False)
        # add import for models in operations or _types file
        if serialize_namespace_type in [NamespaceType.OPERATION, NamespaceType.CLIENT]:
            file_import.add_submodule_import(
                relative_path,
                "models",
                ImportType.LOCAL,
                alias=alias,
            )
            if self.is_form_data:
                file_import.add_submodule_import(
                    self.code_model.get_relative_import_path(serialize_namespace, module_name="_utils.model_base"),
                    "Model",
                    ImportType.LOCAL,
                    alias="_Model",
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
        return file_import


class MsrestModelType(GeneratedModelType):
    base = "msrest"

    def serialization_type(self, **kwargs: Any) -> str:
        return self.type_annotation(skip_quote=True, **kwargs) if self.internal else self.name

    @property
    def instance_check_template(self) -> str:
        return "isinstance({}, msrest.Model)"

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = super().imports(**kwargs)
        file_import.add_submodule_import("typing", "Any", ImportType.STDLIB, TypingSection.CONDITIONAL)
        return file_import


class DPGModelType(GeneratedModelType):
    base = "dpg"

    def serialization_type(self, **kwargs: Any) -> str:
        return (
            self.type_annotation(skip_quote=True, **kwargs)
            if self.internal
            else self.type_annotation(need_model_alias=False, skip_quote=True, **kwargs)
        )

    @property
    def instance_check_template(self) -> str:
        return "isinstance({}, " + f"_models.{self.name})"

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = super().imports(**kwargs)
        if self.flattened_property:
            file_import.add_submodule_import("typing", "Any", ImportType.STDLIB)
        return file_import
