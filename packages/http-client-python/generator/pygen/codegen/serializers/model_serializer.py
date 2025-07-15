# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import List, Optional
from abc import ABC, abstractmethod

from ..models import ModelType, Property, ConstantType, EnumValue
from ..models.imports import FileImport, TypingSection, MsrestImportType, ImportType
from .import_serializer import FileImportSerializer
from .base_serializer import BaseSerializer
from ..models.utils import NamespaceType


def _documentation_string(prop: Property, description_keyword: str, docstring_type_keyword: str) -> List[str]:
    retval: List[str] = []
    sphinx_prefix = f":{description_keyword} {prop.client_name}:"
    description = prop.description(is_operation_file=False).replace("\\", "\\\\")
    retval.append(f"{sphinx_prefix} {description}" if description else sphinx_prefix)
    retval.append(f":{docstring_type_keyword} {prop.client_name}: {prop.type.docstring_type()}")
    return retval


class _ModelSerializer(BaseSerializer, ABC):
    def __init__(
        self, code_model, env, async_mode=False, *, models: List[ModelType], client_namespace: Optional[str] = None
    ):
        super().__init__(code_model, env, async_mode, client_namespace=client_namespace)
        self.models = models

    @abstractmethod
    def imports(self) -> FileImport: ...

    def serialize(self) -> str:
        # Generate the models
        template = self.env.get_template("model_container.py.jinja2")
        return template.render(
            code_model=self.code_model,
            imports=FileImportSerializer(self.imports()),
            str=str,
            serializer=self,
            models=self.models,
        )

    @abstractmethod
    def declare_model(self, model: ModelType) -> str: ...

    @staticmethod
    def escape_dot(s: str):
        return s.replace(".", "\\\\.")

    @staticmethod
    def input_documentation_string(prop: Property) -> List[str]:
        # building the param line of the property doc
        return _documentation_string(prop, "keyword", "paramtype")

    @staticmethod
    def variable_documentation_string(prop: Property) -> List[str]:
        return _documentation_string(prop, "ivar", "vartype")

    def super_call(self, model: ModelType) -> List[str]:
        return [f"super().__init__({self.properties_to_pass_to_super(model)})"]

    @staticmethod
    def initialize_discriminator_property(model: ModelType, prop: Property) -> str:
        discriminator_value = f"'{model.discriminator_value}'" if model.discriminator_value else None
        if not discriminator_value:
            typing = "Optional[str]"
        else:
            typing = "str"
        return f"self.{prop.client_name}: {typing}  = {discriminator_value}"

    def initialize_standard_property(self, prop: Property):
        if not (prop.optional or prop.client_default_value is not None):
            type_annotation = prop.type_annotation(serialize_namespace=self.serialize_namespace)
            return f"{prop.client_name}: {type_annotation},{prop.pylint_disable()}"
        return (
            f"{prop.client_name}: {prop.type_annotation(serialize_namespace=self.serialize_namespace)} = "
            f"{prop.client_default_value_declaration},{prop.pylint_disable()}"
        )

    @staticmethod
    def discriminator_docstring(model: ModelType) -> str:
        return (
            "You probably want to use the sub-classes and not this class directly. "
            f"Known sub-classes are: {', '.join(v.name for v in model.discriminated_subtypes.values())}"
        )

    @staticmethod
    def _init_line_parameters(model: ModelType):
        return [p for p in model.properties if not p.readonly and not p.is_discriminator and not p.constant]

    def init_line(self, model: ModelType) -> List[str]:
        init_properties_declaration = []
        init_line_parameters = self._init_line_parameters(model)
        init_line_parameters.sort(key=lambda x: x.optional)
        if init_line_parameters:
            init_properties_declaration.append("*,")
        for param in init_line_parameters:
            init_properties_declaration.append(self.initialize_standard_property(param))

        return init_properties_declaration

    @staticmethod
    def properties_to_pass_to_super(model: ModelType) -> str:
        properties_to_pass_to_super = []
        for parent in model.parents:
            for prop in model.properties:
                if prop in parent.properties and not prop.is_discriminator and not prop.constant and not prop.readonly:
                    properties_to_pass_to_super.append(f"{prop.client_name}={prop.client_name}")
        properties_to_pass_to_super.append("**kwargs")
        return ", ".join(properties_to_pass_to_super)

    @abstractmethod
    def initialize_properties(self, model: ModelType) -> List[str]: ...

    def need_init(self, model: ModelType) -> bool:
        return bool(self.init_line(model) or model.discriminator)

    def pylint_disable_items(self, model: ModelType) -> List[str]:
        if model.flattened_property or self.initialize_properties(model):
            return [""]
        if any(p for p in model.properties if p.is_discriminator and model.discriminator_value):
            return [""]
        if model.parents and any(
            "=" in prop for parent in model.parents for prop in self.init_line(parent) if self.need_init(parent)
        ):
            return [""]
        return ["useless-super-delegation"]

    def pylint_disable(self, model: ModelType) -> str:
        return "  # pylint: disable=" + ", ".join(self.pylint_disable_items(model))

    def global_pylint_disables(self) -> str:
        return ""

    @property
    def serialize_namespace(self) -> str:
        return self.code_model.get_serialize_namespace(self.client_namespace, client_namespace_type=NamespaceType.MODEL)


class MsrestModelSerializer(_ModelSerializer):
    def imports(self) -> FileImport:
        file_import = FileImport(self.code_model)
        file_import.add_msrest_import(
            serialize_namespace=self.serialize_namespace,
            msrest_import_type=MsrestImportType.Module,
            typing_section=TypingSection.REGULAR,
        )
        for model in self.models:
            file_import.merge(model.imports(is_operation_file=False))
            for param in self._init_line_parameters(model):
                file_import.merge(
                    param.imports(
                        serialize_namespace=self.serialize_namespace,
                        serialize_namespace_type=NamespaceType.MODEL,
                        called_by_property=True,
                    )
                )

        return file_import

    def declare_model(self, model: ModelType) -> str:
        basename = (
            "msrest.serialization.Model"
            if self.code_model.options["client-side-validation"]
            else "_serialization.Model"
        )
        if model.parents:
            basename = ", ".join([m.name for m in model.parents])
        return f"class {model.name}({basename}):{model.pylint_disable()}"

    @staticmethod
    def get_properties_to_initialize(model: ModelType) -> List[Property]:
        if model.parents:
            properties_to_initialize = list(
                {
                    p.client_name: p
                    for bm in model.parents
                    for p in model.properties
                    if p not in bm.properties or p.is_discriminator or p.constant
                }.values()
            )
        else:
            properties_to_initialize = model.properties
        return properties_to_initialize

    def initialize_properties(self, model: ModelType) -> List[str]:
        init_args = []
        for prop in self.get_properties_to_initialize(model):
            if prop.is_discriminator:
                init_args.append(self.initialize_discriminator_property(model, prop))
            elif prop.readonly:
                # we want typing for readonly since typing isn't provided from the command line
                init_args.append(f"self.{prop.client_name}: {prop.type_annotation()} = None")
            elif not prop.constant:
                init_args.append(f"self.{prop.client_name} = {prop.client_name}")
        return init_args

    @staticmethod
    def declare_property(prop: Property) -> str:
        if prop.flattened_names:
            attribute_key = ".".join(_ModelSerializer.escape_dot(n) for n in prop.flattened_names)
        else:
            attribute_key = _ModelSerializer.escape_dot(prop.wire_name)
        if prop.type.xml_serialization_ctxt:
            xml_metadata = f", 'xml': {{{prop.type.xml_serialization_ctxt}}}"
        else:
            xml_metadata = ""
        return (
            f'"{prop.client_name}": {{"key": "{attribute_key}",'
            f' "type": "{prop.msrest_deserialization_key}"{xml_metadata}}},'
        )


class DpgModelSerializer(_ModelSerializer):
    def super_call(self, model: ModelType) -> List[str]:
        super_call = f"super().__init__({self.properties_to_pass_to_super(model)})"
        if model.flattened_property:
            return [
                "_flattened_input = {k: kwargs.pop(k) for k in kwargs.keys() & self.__flattened_items}",
                super_call,
                "for k, v in _flattened_input.items():",
                "    setattr(self, k, v)",
            ]
        return [super_call]

    def imports(self) -> FileImport:
        file_import = FileImport(self.code_model)
        if any(not m.parents for m in self.models):
            file_import.add_submodule_import(
                self.code_model.get_relative_import_path(self.serialize_namespace, module_name="_utils.model_base"),
                "Model",
                ImportType.LOCAL,
                TypingSection.REGULAR,
                alias="_Model",
            )
        for model in self.models:
            if model.base == "json":
                continue
            file_import.merge(
                model.imports(
                    is_operation_file=False,
                    serialize_namespace=self.serialize_namespace,
                    serialize_namespace_type=NamespaceType.MODEL,
                )
            )
            for prop in model.properties:
                file_import.merge(
                    prop.imports(
                        serialize_namespace=self.serialize_namespace,
                        serialize_namespace_type=NamespaceType.MODEL,
                        called_by_property=True,
                    )
                )
            for parent in model.parents:
                if parent.client_namespace != model.client_namespace:
                    file_import.add_submodule_import(
                        self.code_model.get_relative_import_path(
                            self.serialize_namespace,
                            self.code_model.get_imported_namespace_for_model(parent.client_namespace),
                        ),
                        parent.name,
                        ImportType.LOCAL,
                    )
            if model.is_polymorphic:
                file_import.add_submodule_import("typing", "Dict", ImportType.STDLIB)
            if not model.internal and self.init_line(model):
                file_import.add_submodule_import("typing", "overload", ImportType.STDLIB)
                file_import.add_submodule_import("typing", "Mapping", ImportType.STDLIB)
                file_import.add_submodule_import("typing", "Any", ImportType.STDLIB)
        return file_import

    def declare_model(self, model: ModelType) -> str:
        basename = "_Model"
        if model.parents:
            basename = ", ".join([m.name for m in model.parents])
        if model.discriminator_value:
            basename += f", discriminator='{model.discriminator_value}'"
        return f"class {model.name}({basename}):{model.pylint_disable()}"

    @staticmethod
    def get_properties_to_declare(model: ModelType) -> List[Property]:
        if model.parents:
            parent_properties = [p for bm in model.parents for p in bm.properties]
            properties_to_declare = [
                p
                for p in model.properties
                if not any(
                    p.client_name == pp.client_name
                    and p.type_annotation() == pp.type_annotation()
                    and not p.is_base_discriminator
                    for pp in parent_properties
                )
            ]
        else:
            properties_to_declare = model.properties
        if any(p for p in properties_to_declare if p.client_name == "_"):
            raise ValueError("We do not generate anonymous properties")
        return properties_to_declare

    def declare_property(self, prop: Property) -> str:
        args = []
        if prop.client_name != prop.wire_name or prop.is_discriminator:
            args.append(f'name="{prop.wire_name}"')
        if prop.visibility:
            v_list = ", ".join(f'"{x}"' for x in prop.visibility)
            args.append(f"visibility=[{v_list}]")
        if prop.client_default_value is not None:
            args.append(f"default={prop.client_default_value_declaration}")

        if prop.is_multipart_file_input:
            args.append("is_multipart_file_input=True")
        elif hasattr(prop.type, "encode") and prop.type.encode:  # type: ignore
            args.append(f'format="{prop.type.encode}"')  # type: ignore

        if prop.xml_metadata:
            args.append(f"xml={prop.xml_metadata}")

        field = "rest_discriminator" if prop.is_discriminator else "rest_field"
        type_ignore = (
            "  # type: ignore"
            if prop.is_discriminator and isinstance(prop.type, (ConstantType, EnumValue)) and prop.type.value
            else ""
        )
        type_annotation = prop.type_annotation(serialize_namespace=self.serialize_namespace)
        generated_code = f'{prop.client_name}: {type_annotation} = {field}({", ".join(args)})'
        return f"{generated_code}{type_ignore}"

    def initialize_properties(self, model: ModelType) -> List[str]:
        init_args = []
        for prop in self.get_properties_to_declare(model):
            if prop.constant and not prop.is_base_discriminator:
                init_args.append(f"self.{prop.client_name}: {prop.type_annotation()} = " f"{prop.get_declaration()}")
        return init_args

    @staticmethod
    def _init_line_parameters(model: ModelType):
        return [
            p
            for p in model.properties
            if p.is_base_discriminator or not p.is_discriminator and not p.constant and p.visibility != ["read"]
        ]

    @staticmethod
    def properties_to_pass_to_super(model: ModelType) -> str:
        properties_to_pass_to_super = ["*args"]
        for parent in model.parents:
            for prop in model.properties:
                if (
                    prop.client_name in [prop.client_name for prop in parent.properties if prop.is_base_discriminator]
                    and prop.is_discriminator
                    and not prop.constant
                    and not prop.readonly
                ):
                    properties_to_pass_to_super.append(f"{prop.client_name}={prop.get_declaration()}")
        properties_to_pass_to_super.append("**kwargs")
        return ", ".join(properties_to_pass_to_super)

    def global_pylint_disables(self) -> str:
        result = []
        for model in self.models:
            if self.need_init(model):
                for item in self.pylint_disable_items(model):
                    if item:
                        result.append(item)
        final_result = set(result)
        if final_result:
            return "# pylint: disable=" + ", ".join(final_result)
        return ""
