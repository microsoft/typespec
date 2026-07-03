# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import keyword
import re
from typing import Any, Optional
from ..models import ModelType, CodeModel
from ..models.enum_type import EnumType
from ..models.imports import FileImport, ImportType
from ..models.utils import NamespaceType
from ..models.property import Property
from .model_serializer import _documentation_string
from .import_serializer import FileImportSerializer
from .base_serializer import BaseSerializer

# Python builtin type names that can be shadowed by TypedDict field wire_names.
# When a field name matches one of these, all references to that builtin in type
# annotations within the same class are qualified as builtins.X.
_BUILTIN_TYPE_NAMES = frozenset(
    {
        "int",
        "str",
        "float",
        "bool",
        "list",
        "dict",
        "tuple",
        "set",
        "bytes",
        "type",
        "object",
        "complex",
        "frozenset",
        "bytearray",
        "memoryview",
    }
)


def _qualify_shadowed_builtins(annotation: str, shadowed: frozenset[str]) -> str:
    """Replace bare builtin type references with builtins.X when shadowed by a field name."""
    if not shadowed:
        return annotation
    for name in shadowed:
        annotation = re.sub(rf"\b{name}\b", f"builtins.{name}", annotation)
    return annotation


class TypesSerializer(BaseSerializer):
    def __init__(
        self,
        code_model: CodeModel,
        env,
        client_namespace: Optional[str] = None,
        models: Optional[list[ModelType]] = None,
        enums: Optional[list["EnumType"]] = None,
    ):
        super().__init__(code_model=code_model, env=env, client_namespace=client_namespace)
        self._models = models or []
        self._enums = enums or []

    @property
    def literal_enums(self) -> list[EnumType]:
        """Enums to render as Literal type aliases in typeddict mode."""
        return sorted(self._enums)

    def declare_literal_enum(self, enum: EnumType) -> str:
        """Generate a Literal type alias for an enum, e.g. MyColor = Literal["red", "blue"]."""
        values = [enum.get_declaration(v.value) for v in enum.values]
        return f"{enum.name} = Literal[{', '.join(values)}]"

    @staticmethod
    def _renders_as_input_typeddict(m: "ModelType") -> bool:
        """Whether a non-json model is a *seed* for the types.py input surface.

        TypedDicts (and discriminated-base union aliases) in ``types.py`` describe request-body
        (*input*) shapes. Output-only models already render as classes in ``models/`` and are
        referenced via ``_models.*``, so a response-only model that nothing input references would be
        dead code. A model seeds the input surface when it is:

        * a typeddict copy (``base == "typeddict"``) — these only exist as input body overloads
          (their ``usage`` may carry ``Spread``/``Json`` rather than ``Input``), or
        * ``is_typed_dict_only`` — includes every model in full ``typeddict`` mode (responses too),
          and input-only anonymous bodies, or
        * used as input (``is_usage_input``) — e.g. a model shared between request and response.

        The full set rendered in types.py is the transitive closure of these seeds over base
        classes, discriminated subtypes and property types (see :meth:`_types_file_model_names`), so
        an output-only model that *is* referenced by an input model (e.g. ARM ``SystemData`` on
        ``Resource``) is still rendered.
        """
        return m.base == "typeddict" or m.is_typed_dict_only or m.is_usage_input

    @staticmethod
    def _iter_referenced_models(base_type: Any):
        """Yield ModelType instances directly referenced by a type, recursing through containers.

        Handles list/dict ``element_type``, constant/enum ``value_type`` and combined ``types``.
        A referenced ModelType is yielded but not descended into — the closure walk descends into a
        model's own properties/parents/subtypes when that model is itself visited.
        """
        stack = [base_type]
        seen: set[int] = set()
        while stack:
            t = stack.pop()
            if t is None or id(t) in seen:
                continue
            seen.add(id(t))
            if isinstance(t, ModelType):
                yield t
                continue
            for attr in ("element_type", "value_type"):
                child = getattr(t, attr, None)
                if child is not None:
                    stack.append(child)
            for child in getattr(t, "types", []) or []:
                stack.append(child)

    def _types_file_model_names(self) -> set[str]:
        """Names of every model that must be rendered in types.py.

        Starts from the input seeds (:meth:`_renders_as_input_typeddict`) and takes the transitive
        closure over base classes, discriminated subtypes and property types. Keyed on model
        ``name`` (dpg models and their typeddict copies share a name and render as one TypedDict), so
        the result is stable regardless of which copy a reference points at.
        """
        needed: set[str] = set()
        stack = [m for m in self._models if m.base != "json" and self._renders_as_input_typeddict(m)]
        while stack:
            m = stack.pop()
            if m.base == "json" or m.name in needed:
                continue
            needed.add(m.name)
            stack.extend(m.parents)
            stack.extend(m.discriminated_subtypes.values())
            for prop in m.properties:
                stack.extend(self._iter_referenced_models(prop.type))
        return needed

    @property
    def typeddict_models(self) -> list[ModelType]:
        """Models that should be rendered as TypedDicts (excluding discriminated bases which become unions).

        When both a dpg model and its typeddict copy exist for the same model,
        prefer the dpg model (it already renders as a TypedDict in types.py) and skip the copy.

        The pairing is keyed on the model ``name`` (the copy is a shallow copy of the source, so it
        shares the source's name). ``crossLanguageDefinitionId`` cannot be used here: template
        instantiated models such as ``ResourceUpdateModel<Foo, FooProperties>`` all share the
        template's cross-language id, so keying on it would wrongly collapse distinct models
        (e.g. ``CacheUpdate`` and ``VolumeUpdate``) into one and drop the rest from types.py.

        Only models in the input-surface closure (:meth:`_types_file_model_names`) are rendered, so
        response-only models (e.g. ``GetResponse``) are dropped while models reachable from an input
        model — including output-only ones such as a discriminated subtype or an ARM ``SystemData``
        property — are kept, ensuring no forward reference is left undefined.
        """
        needed = self._types_file_model_names()
        candidates = [
            m for m in self._models if m.base != "json" and not m.discriminated_subtypes and m.name in needed
        ]
        seen_names: dict[str, "ModelType"] = {}
        result: list["ModelType"] = []
        for m in candidates:
            name = m.name
            if name in seen_names:
                # Prefer the dpg model over the typeddict copy
                if m.base == "dpg" and seen_names[name].base == "typeddict":
                    # Replace the typeddict copy with the dpg model
                    result = [r if r is not seen_names[name] else m for r in result]
                    seen_names[name] = m
                # Otherwise skip this duplicate
                continue
            seen_names[name] = m
            result.append(m)
        return result

    @property
    def discriminated_base_models(self) -> list[ModelType]:
        """Discriminated base models that become Union type aliases in types.py.

        Only bases in the input-surface closure (:meth:`_types_file_model_names`) are emitted: an
        output-only ``Dinosaur = Union[TRex]`` alias is dead code and would reference subtype
        TypedDicts that are themselves (correctly) omitted from types.py, causing a ``NameError`` at
        import time.

        Topologically sorted so that nested discriminated bases (e.g. Shark)
        are defined before their parents (e.g. Fish = Union[Salmon, Shark]).
        """
        needed = self._types_file_model_names()
        bases = [m for m in self._models if m.base != "json" and m.discriminated_subtypes and m.name in needed]
        base_names = {m.name for m in bases}
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

    @staticmethod
    def has_keyword_wire_names(model: ModelType) -> bool:
        """Whether any property wire_name is a Python keyword or requires functional TypedDict form."""
        return any(keyword.iskeyword(p.wire_name) or not p.wire_name.isidentifier() for p in model.properties)

    @staticmethod
    def get_shadowed_builtins(model: ModelType) -> frozenset[str]:
        """Return the set of builtin type names shadowed by property wire_names in this model.

        Only includes a builtin if it is both used as a wire_name AND referenced
        in a type annotation within the same model (otherwise no shadowing occurs).
        """
        wire_builtins = {p.wire_name for p in model.properties if p.wire_name in _BUILTIN_TYPE_NAMES}
        if not wire_builtins:
            return frozenset()
        # Check which of these builtins actually appear in type annotations
        used = set()
        for prop in model.properties:
            annotation = prop.type_annotation()
            for name in wire_builtins:
                if re.search(rf"\b{name}\b", annotation):
                    used.add(name)
        return frozenset(used)

    def imports(self) -> FileImport:
        file_import = FileImport(self.code_model)

        literal_enums = self.literal_enums
        if literal_enums:
            file_import.add_submodule_import("typing", "Literal", ImportType.STDLIB)

        td_models = self.typeddict_models
        if td_models or self.discriminated_base_models:
            if td_models:
                file_import.add_submodule_import("typing_extensions", "TypedDict", ImportType.STDLIB)
            if self.discriminated_base_models:
                file_import.add_submodule_import("typing", "Union", ImportType.STDLIB)
            has_required = False
            needs_builtins = False
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
                if self.get_shadowed_builtins(model):
                    needs_builtins = True
                for parent in model.parents:
                    if parent.client_namespace != model.client_namespace and not parent.discriminated_subtypes:
                        # Import parent class from sibling namespace's types module
                        file_import.add_submodule_import(
                            self.code_model.get_relative_import_path(
                                self.serialize_namespace,
                                parent.client_namespace,
                                module_name="types",
                            ),
                            parent.name,
                            ImportType.LOCAL,
                        )
            if has_required:
                file_import.add_submodule_import("typing_extensions", "Required", ImportType.STDLIB)
            if needs_builtins:
                file_import.add_import("builtins", ImportType.STDLIB)
        return file_import

    def declare_model(self, model: ModelType) -> str:
        """Generate the class declaration or functional form for a TypedDict model.

        Uses functional form when any property wire_name is a Python keyword
        (e.g. 'and', 'class') since keywords can't be identifiers in class bodies.
        """
        if self.has_keyword_wire_names(model):
            return ""  # functional form is rendered separately
        non_discriminated_parents = [p for p in model.parents if not p.discriminated_subtypes]
        if non_discriminated_parents:
            basename = ", ".join([m.name for m in non_discriminated_parents])
            return f"class {model.name}({basename}):{model.pylint_disable()}"
        return f"class {model.name}(TypedDict, total=False):{model.pylint_disable()}"

    def declare_functional_model(self, model: ModelType) -> str:
        """Generate a functional-form TypedDict for models with keyword wire_names.

        Functional form is required when any field name is a Python keyword.
        All fields (including inherited) are included since functional form
        can't specify a base class.
        """
        shadowed = self.get_shadowed_builtins(model)
        entries: list[str] = []
        for prop in model.properties:
            type_annotation = prop.type_annotation(
                serialize_namespace=self.serialize_namespace,
                serialize_namespace_type=NamespaceType.TYPES_FILE,
            )
            type_annotation = _qualify_shadowed_builtins(type_annotation, shadowed)
            is_optional = prop.optional or prop.client_default_value is not None
            if is_optional:
                entries.append(f'    "{prop.wire_name}": {type_annotation},')
            else:
                entries.append(f'    "{prop.wire_name}": Required[{type_annotation}],')
        fields = "\n".join(entries)
        return f'{model.name} = TypedDict("{model.name}", {{\n{fields}\n}}, total=False)'

    @staticmethod
    def get_properties_to_declare(model: ModelType) -> list[Property]:
        if TypesSerializer.has_keyword_wire_names(model):
            return []  # functional form handles all properties
        non_discriminated_parents = [p for p in model.parents if not p.discriminated_subtypes]
        if non_discriminated_parents:
            parent_properties = [p for bm in non_discriminated_parents for p in bm.properties]
            return [
                p
                for p in model.properties
                if not any(
                    p.client_name == pp.client_name
                    and p.type_annotation() == pp.type_annotation()
                    and not p.is_base_discriminator
                    for pp in parent_properties
                )
            ]
        return list(model.properties)

    def declare_property(self, prop: Property, shadowed_builtins: frozenset[str]) -> str:
        type_annotation = prop.type_annotation(
            serialize_namespace=self.serialize_namespace,
            serialize_namespace_type=NamespaceType.TYPES_FILE,
        )
        type_annotation = _qualify_shadowed_builtins(type_annotation, shadowed_builtins)
        is_optional = prop.optional or prop.client_default_value is not None
        if is_optional:
            return f"{prop.wire_name}: {type_annotation}"
        return f"{prop.wire_name}: Required[{type_annotation}]"

    @staticmethod
    def variable_documentation_string(prop: Property) -> list[str]:
        return _documentation_string(prop, "ivar", "vartype", serialize_namespace_type=NamespaceType.TYPES_FILE)

    def serialize(self) -> str:
        template = self.env.get_template("types.py.jinja2")
        return template.render(
            code_model=self.code_model,
            imports=FileImportSerializer(self.imports()),
            serializer=self,
            literal_enums=self.literal_enums,
            models=self.typeddict_models,
            discriminated_bases=self.discriminated_base_models,
        )
