# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Optional
from ..models import ModelType, CodeModel
from ..models.imports import FileImport, ImportType
from ..models.utils import NamespaceType
from ..models.property import Property
from .model_serializer import _documentation_string
from .import_serializer import FileImportSerializer
from .base_serializer import BaseSerializer


class TypesSerializer(BaseSerializer):
    def __init__(
        self,
        code_model: CodeModel,
        env,
        client_namespace: Optional[str] = None,
        models: Optional[list[ModelType]] = None,
    ):
        super().__init__(code_model=code_model, env=env)
        self._client_namespace = client_namespace
        self._models = models or []

    @property
    def typeddict_models(self) -> list[ModelType]:
        """Models that should be rendered as TypedDicts (excluding discriminated bases which become unions)."""
        return [m for m in self._models if m.base != "json" and not m.discriminated_subtypes]

    def imports(self) -> FileImport:
        file_import = FileImport(self.code_model)

        td_models = self.typeddict_models
        if td_models:
            file_import.add_submodule_import("typing_extensions", "TypedDict", ImportType.STDLIB)
            has_required = False
            for model in td_models:
                file_import.merge(
                    model.imports(
                        is_operation_file=False,
                        serialize_namespace=self.serialize_namespace,
                        serialize_namespace_type=NamespaceType.TYPES_FILE,
                    )
                )
                for prop in model.properties:
                    file_import.merge(
                        prop.imports(
                            serialize_namespace=self.serialize_namespace,
                            serialize_namespace_type=NamespaceType.TYPES_FILE,
                            called_by_property=True,
                        )
                    )
                    if not (prop.optional or prop.client_default_value is not None):
                        has_required = True
                for parent in model.parents:
                    if parent.client_namespace != model.client_namespace and not parent.discriminated_subtypes:
                        file_import.add_submodule_import(
                            self.code_model.get_relative_import_path(
                                self.serialize_namespace,
                                self.code_model.get_imported_namespace_for_model(parent.client_namespace),
                            ),
                            parent.name,
                            ImportType.LOCAL,
                        )
            if has_required:
                file_import.add_submodule_import("typing_extensions", "Required", ImportType.STDLIB)
        return file_import

    def declare_model(self, model: ModelType) -> str:
        non_discriminated_parents = [p for p in model.parents if not p.discriminated_subtypes]
        if non_discriminated_parents:
            basename = ", ".join([m.name for m in non_discriminated_parents])
            return f"class {model.name}({basename}):{model.pylint_disable()}"
        return f"class {model.name}(TypedDict, total=False):{model.pylint_disable()}"

    @staticmethod
    def get_properties_to_declare(model: ModelType) -> list[Property]:
        non_discriminated_parents = [p for p in model.parents if not p.discriminated_subtypes]
        if non_discriminated_parents:
            parent_properties = [p for bm in non_discriminated_parents for p in bm.properties]
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
        return properties_to_declare

    def declare_property(self, prop: Property) -> str:
        type_annotation = prop.type_annotation(serialize_namespace=self.serialize_namespace)
        is_optional = prop.optional or prop.client_default_value is not None
        if is_optional:
            return f"{prop.wire_name}: {type_annotation}"
        return f"{prop.wire_name}: Required[{type_annotation}]"

    @staticmethod
    def variable_documentation_string(prop: Property) -> list[str]:
        return _documentation_string(prop, "ivar", "vartype")

    def serialize(self) -> str:
        template = self.env.get_template("types.py.jinja2")
        return template.render(
            code_model=self.code_model,
            imports=FileImportSerializer(self.imports()),
            serializer=self,
            models=self.typeddict_models,
        )
