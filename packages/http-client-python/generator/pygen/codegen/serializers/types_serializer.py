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

    @property
    def discriminated_base_models(self) -> list[ModelType]:
        """Discriminated base models that become Union type aliases in types.py.

        Topologically sorted so that nested discriminated bases (e.g. Shark)
        are defined before their parents (e.g. Fish = Union[Salmon, Shark]).
        """
        bases = [m for m in self._models if m.base != "json" and m.discriminated_subtypes]
        base_names = {m.name for m in bases}
        # Sort: models whose subtypes include other discriminated bases must come after them
        sorted_bases: list[ModelType] = []
        visited: set[str] = set()

        def visit(model: ModelType) -> None:
            if model.name in visited:
                return
            visited.add(model.name)
            for subtype in model.discriminated_subtypes.values():
                if subtype.name in base_names:
                    visit(subtype)
            sorted_bases.append(model)

        for m in bases:
            visit(m)
        return sorted_bases

    def discriminated_subtypes_union(self, model: ModelType) -> str:
        """Generate a Union alias for a discriminated base using TypedDict subtype names."""
        subtypes = list(model.discriminated_subtypes.values())
        subtype_names = [s.name for s in subtypes]
        return f"{model.name} = Union[{', '.join(subtype_names)}]"

    def imports(self) -> FileImport:
        file_import = FileImport(self.code_model)

        td_models = self.typeddict_models
        if td_models or self.discriminated_base_models:
            if td_models:
                file_import.add_submodule_import("typing_extensions", "TypedDict", ImportType.STDLIB)
            if self.discriminated_base_models:
                file_import.add_submodule_import("typing", "Union", ImportType.STDLIB)
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

    # Python builtin type names that can be shadowed by TypedDict field names
    _BUILTIN_TYPE_NAMES = frozenset({
        "int", "str", "float", "bool", "list", "dict", "tuple", "set",
        "bytes", "type", "object", "complex", "frozenset", "bytearray", "memoryview",
    })

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
            properties_to_declare = list(model.properties)
        # Move properties whose wire_name shadows a Python builtin type to the end,
        # so they don't shadow the builtin in subsequent type annotations.
        properties_to_declare.sort(
            key=lambda p: p.wire_name in TypesSerializer._BUILTIN_TYPE_NAMES
        )
        return properties_to_declare

    def declare_property(self, prop: Property) -> str:
        type_annotation = prop.type_annotation(
            serialize_namespace=self.serialize_namespace,
            serialize_namespace_type=NamespaceType.TYPES_FILE,
        )
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
            discriminated_bases=self.discriminated_base_models,
        )
