# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

"""Tests for TypedDict generation, unions generation, and models-mode interactions."""

from jinja2 import PackageLoader, Environment

from pygen.codegen.models import CodeModel, JSONModelType, DPGModelType, build_type
from pygen.codegen.models.imports import ImportType
from pygen.codegen.models.model_type import TypedDictModelType
from pygen.codegen.models.property import Property
from pygen.codegen.models.list_type import ListType
from pygen.codegen.serializers.types_serializer import TypesSerializer, _qualify_shadowed_builtins
from pygen.codegen.serializers.unions_serializer import UnionsSerializer


def _make_code_model(models_mode="dpg"):
    return CodeModel(
        {
            "clients": [
                {
                    "name": "client",
                    "namespace": "blah",
                    "moduleName": "blah",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
            "namespace": "namespace",
        },
        options={
            "show-send-request": True,
            "builders-visibility": "public",
            "show-operations": True,
            "models-mode": models_mode,
            "flavor": "unbranded",
            "client-side-validation": False,
        },
    )


def _make_model(code_model, name, model_cls=None, properties=None):
    """Create a model of the given class attached to code_model."""
    if model_cls is None:
        if code_model.options["models-mode"] == "typeddict":
            model_cls = TypedDictModelType
        elif code_model.options["models-mode"] == "dpg":
            model_cls = DPGModelType
        else:
            model_cls = JSONModelType
    return model_cls(
        yaml_data={
            "name": name,
            "type": "model",
            "snakeCaseName": name.lower(),
            "usage": 2,
        },
        code_model=code_model,
        properties=properties or [],
    )


def _make_env():
    return Environment(
        loader=PackageLoader("pygen.codegen", "templates"),
        trim_blocks=True,
        lstrip_blocks=True,
    )


# ---------- models-mode=none ----------


def test_models_mode_none_produces_json_model_type():
    """When models-mode is none (False), all models should be JSONModelType."""
    code_model = _make_code_model(models_mode=False)
    model = _make_model(code_model, "Foo", model_cls=JSONModelType)
    assert model.base == "json"


def test_models_mode_none_no_typeddict_models():
    """TypesSerializer.typeddict_models should be empty when models-mode=none."""
    code_model = _make_code_model(models_mode=False)
    m1 = _make_model(code_model, "Foo", model_cls=JSONModelType)
    m2 = _make_model(code_model, "Bar", model_cls=JSONModelType)

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[m1, m2])
    assert ts.typeddict_models == []


def test_models_mode_none_types_file_has_no_typeddict_imports():
    """When models-mode=none, the types.py should not import TypedDict."""
    code_model = _make_code_model(models_mode=False)
    m1 = _make_model(code_model, "Foo", model_cls=JSONModelType)
    code_model.model_types = [m1]

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[m1])
    output = ts.serialize()
    assert "TypedDict" not in output
    assert "Required" not in output


# ---------- models-mode=dpg ----------


def test_models_mode_dpg_typeddict_models_included():
    """DPG models have base='dpg', not 'json', so they appear in typeddict_models."""
    code_model = _make_code_model(models_mode="dpg")
    m1 = _make_model(code_model, "Foo", model_cls=DPGModelType)

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[m1])
    # DPG models have base != "json" so they DO appear in typeddict_models
    assert len(ts.typeddict_models) == 1


def _make_model_with_clid(code_model, name, clid, model_cls):
    """Create a model carrying an explicit crossLanguageDefinitionId."""
    return model_cls(
        yaml_data={
            "name": name,
            "type": "model",
            "snakeCaseName": name.lower(),
            "usage": 2,
            "crossLanguageDefinitionId": clid,
        },
        code_model=code_model,
        properties=[],
    )


def test_typeddict_models_shared_cross_language_id_not_collapsed():
    """Distinct models that share a template crossLanguageDefinitionId must all render.

    Template-instantiated models such as ``ResourceUpdateModel<Cache, CacheProperties>`` and
    ``ResourceUpdateModel<Volume, VolumeProperties>`` are named ``CacheUpdate`` / ``VolumeUpdate``
    but share the template's cross-language id. The dpg/copy deduplication must key on the model name so
    these distinct models are not collapsed into one (which previously dropped ``CacheUpdate`` from
    types.py, leaving a dangling ``_types.CacheUpdate`` reference in operations).
    """
    code_model = _make_code_model(models_mode="dpg")
    clid = "Azure.ResourceManager.Foundations.ResourceUpdateModel"
    cache_dpg = _make_model_with_clid(code_model, "CacheUpdate", clid, DPGModelType)
    cache_td = _make_model_with_clid(code_model, "CacheUpdate", clid, TypedDictModelType)
    volume_dpg = _make_model_with_clid(code_model, "VolumeUpdate", clid, DPGModelType)
    volume_td = _make_model_with_clid(code_model, "VolumeUpdate", clid, TypedDictModelType)

    env = _make_env()
    ts = TypesSerializer(
        code_model=code_model,
        env=env,
        models=[cache_dpg, cache_td, volume_dpg, volume_td],
    )
    rendered = ts.typeddict_models
    # Both distinct models render exactly once, and the dpg copy is preferred over the typeddict copy.
    assert sorted(m.name for m in rendered) == ["CacheUpdate", "VolumeUpdate"]
    assert all(m.base == "dpg" for m in rendered)


def _make_model_with_usage(code_model, name, usage, model_cls):
    """Create a model with an explicit usage bitmask (2=Input, 4=Output, 6=both)."""
    return model_cls(
        yaml_data={
            "name": name,
            "type": "model",
            "snakeCaseName": name.lower(),
            "usage": usage,
        },
        code_model=code_model,
        properties=[],
    )


def test_dpg_output_only_model_excluded_from_typeddict_models():
    """In dpg mode, response-only models must not render as TypedDicts in types.py.

    Anonymous response bodies (e.g. ``GetResponse``) render as classes in ``models/`` and are only
    referenced via ``_models.*``; a TypedDict for them in types.py is never referenced via
    ``_types.*`` and is dead code. Only input models belong in types.py.
    """
    code_model = _make_code_model(models_mode="dpg")
    send_request = _make_model_with_usage(code_model, "SendRequest", 2, DPGModelType)  # Input
    get_response = _make_model_with_usage(code_model, "GetResponse", 4, DPGModelType)  # Output-only

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[send_request, get_response])
    rendered = [m.name for m in ts.typeddict_models]
    assert rendered == ["SendRequest"]
    assert "GetResponse" not in rendered


def test_dpg_input_output_model_included_in_typeddict_models():
    """A dpg model used as both input and output still renders in types.py (it is an input)."""
    code_model = _make_code_model(models_mode="dpg")
    cat = _make_model_with_usage(code_model, "Cat", 6, DPGModelType)  # Input | Output

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[cat])
    assert [m.name for m in ts.typeddict_models] == ["Cat"]


def test_typeddict_mode_output_only_model_included():
    """In full typeddict mode, every model (incl. output-only) is consumed as a TypedDict."""
    code_model = _make_code_model(models_mode="typeddict")
    get_response = _make_model_with_usage(code_model, "GetResponse", 4, TypedDictModelType)  # Output-only

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[get_response])
    # is_typed_dict_only is True for all models in typeddict mode, so it is kept despite being output-only.
    assert [m.name for m in ts.typeddict_models] == ["GetResponse"]


def test_dpg_typeddict_copy_without_input_usage_still_kept():
    """A spread-body typeddict copy must be kept even when its usage lacks the Input bit.

    Spread request bodies (e.g. ``SendRequest``) are marked ``Json | Spread`` by tcgc but NOT
    ``Input``. The referenced type is the ``base == "typeddict"`` copy, so operations import
    ``_types.SendRequest``. Filtering these out would leave a dangling reference, so typeddict
    copies are always kept regardless of their usage flags.
    """
    code_model = _make_code_model(models_mode="dpg")
    # usage 320 == Json(256) | Spread(64), no Input(2) bit — mirrors real tcgc output.
    send_copy = _make_model_with_usage(code_model, "SendRequest", 320, TypedDictModelType)

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[send_copy])
    assert [m.name for m in ts.typeddict_models] == ["SendRequest"]
    assert not send_copy.is_usage_input  # the copy is kept despite lacking the Input flag


def _make_discriminated_base(code_model, name, usage, subtypes, model_cls=DPGModelType):
    """Create a discriminated base model carrying a discriminator_value->subtype mapping."""
    return model_cls(
        yaml_data={
            "name": name,
            "type": "model",
            "snakeCaseName": name.lower(),
            "usage": usage,
        },
        code_model=code_model,
        properties=[],
        discriminated_subtypes={s.name.lower(): s for s in subtypes},
    )


def test_dpg_output_only_discriminated_base_excluded():
    """An output-only discriminated base (e.g. ``Dinosaur = Union[TRex]``) must not render.

    Regression for the ``NameError: name 'TRex' is not defined`` import crash: the output-only base
    was emitted as a union alias in types.py while its subtype ``TRex`` was correctly excluded,
    leaving the alias referencing an undefined name.
    """
    code_model = _make_code_model(models_mode="dpg")
    trex = _make_model_with_usage(code_model, "TRex", 4, DPGModelType)  # Output-only subtype
    dinosaur = _make_discriminated_base(code_model, "Dinosaur", 4, [trex])  # Output-only base

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[dinosaur, trex])
    assert [m.name for m in ts.discriminated_base_models] == []
    # The subtype is not force-included because no rendered base references it.
    assert [m.name for m in ts.typeddict_models] == []


def test_dpg_input_discriminated_base_included_with_subtypes():
    """An input discriminated base renders as a union and its subtypes render as TypedDicts."""
    code_model = _make_code_model(models_mode="dpg")
    eagle = _make_model_with_usage(code_model, "Eagle", 2, DPGModelType)  # Input
    goose = _make_model_with_usage(code_model, "Goose", 2, DPGModelType)  # Input
    bird = _make_discriminated_base(code_model, "Bird", 2, [eagle, goose])  # Input base

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[bird, eagle, goose])
    assert [m.name for m in ts.discriminated_base_models] == ["Bird"]
    assert sorted(m.name for m in ts.typeddict_models) == ["Eagle", "Goose"]


def test_dpg_input_base_forces_output_only_subtype_into_types():
    """A subtype referenced by a rendered input base must render even if the subtype is output-only.

    ``Bird = Union[Eagle]`` requires ``Eagle`` to be defined in types.py; if ``Eagle``'s own usage
    flags would exclude it, it must still be force-included so the union alias does not reference an
    undefined name.
    """
    code_model = _make_code_model(models_mode="dpg")
    eagle = _make_model_with_usage(code_model, "Eagle", 4, DPGModelType)  # Output-only subtype
    bird = _make_discriminated_base(code_model, "Bird", 2, [eagle])  # Input base references it

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[bird, eagle])
    assert [m.name for m in ts.discriminated_base_models] == ["Bird"]
    assert [m.name for m in ts.typeddict_models] == ["Eagle"]


def _make_property(code_model, name, prop_type):
    """Create a Property named ``name`` whose type is ``prop_type``."""
    return Property(
        yaml_data={"wireName": name, "clientName": name, "optional": True},
        code_model=code_model,
        type=prop_type,
    )


def test_dpg_input_model_pulls_in_output_only_property_type():
    """An output-only model referenced only as an input model's property type must still render.

    Regression for ``NameError: name 'SystemData' is not defined``: ARM ``Resource`` (input) has a
    read-only ``systemData: "SystemData"`` property. ``SystemData`` is output-only, so it would be
    dropped from types.py, leaving the forward reference dangling. The reachability closure must
    keep it.
    """
    code_model = _make_code_model(models_mode="dpg")
    system_data = _make_model_with_usage(code_model, "SystemData", 4, DPGModelType)  # Output-only
    resource = _make_model_with_usage(code_model, "Resource", 2, DPGModelType)  # Input
    resource.properties = [_make_property(code_model, "systemData", system_data)]
    # An unrelated output-only response model that nothing input references must stay excluded.
    get_response = _make_model_with_usage(code_model, "GetResponse", 4, DPGModelType)

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[resource, system_data, get_response])
    rendered = sorted(m.name for m in ts.typeddict_models)
    assert rendered == ["Resource", "SystemData"]
    assert "GetResponse" not in rendered


def test_dpg_input_model_pulls_in_output_only_type_inside_container():
    """Reachability must descend into list/dict element types, not just direct property references."""
    code_model = _make_code_model(models_mode="dpg")
    item = _make_model_with_usage(code_model, "Item", 4, DPGModelType)  # Output-only element
    container = _make_model_with_usage(code_model, "Container", 2, DPGModelType)  # Input
    list_type = ListType(yaml_data={"type": "list"}, code_model=code_model, element_type=item)
    container.properties = [_make_property(code_model, "items", list_type)]

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[container, item])
    assert sorted(m.name for m in ts.typeddict_models) == ["Container", "Item"]


# ---------- models-mode=typeddict ----------


def test_models_mode_typeddict_models_included():
    """TypedDictModelType models should appear in typeddict_models."""
    code_model = _make_code_model(models_mode="typeddict")
    m1 = _make_model(code_model, "Foo", model_cls=TypedDictModelType)
    m2 = _make_model(code_model, "Bar", model_cls=TypedDictModelType)

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[m1, m2])
    assert len(ts.typeddict_models) == 2


def test_models_mode_typeddict_serialize_contains_class():
    """Serialized types.py output should contain TypedDict class definitions."""
    code_model = _make_code_model(models_mode="typeddict")
    m1 = _make_model(code_model, "Foo", model_cls=TypedDictModelType)
    code_model.model_types = [m1]

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[m1])
    output = ts.serialize()
    assert "class Foo(TypedDict, total=False):" in output
    assert "TypedDict" in output


def test_types_file_has_no_named_unions():
    """Serialized types.py should not contain named union definitions."""
    code_model = _make_code_model(models_mode="dpg")
    m1 = _make_model(code_model, "Foo", model_cls=DPGModelType)
    code_model.model_types = [m1]

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[m1])
    output = ts.serialize()
    # Named unions should be in _unions.py, not types.py
    assert "named_unions" not in output


# ---------- unions serializer ----------


def test_unions_serializer_no_unions():
    """UnionsSerializer with no named unions should produce minimal output."""
    code_model = _make_code_model(models_mode="dpg")

    env = _make_env()
    us = UnionsSerializer(code_model=code_model, env=env)
    output = us.serialize()
    assert "TypedDict" not in output
    assert "Union" not in output


# ---------- typed-dict-only ----------


def _make_typed_dict_only_model(code_model, name, **extra_yaml):
    """Create a TypedDictModelType with typedDictOnly=True."""
    yaml_data = {
        "name": name,
        "type": "model",
        "snakeCaseName": name.lower(),
        "usage": 2,
        "typedDictOnly": True,
        **extra_yaml,
    }
    return TypedDictModelType(
        yaml_data=yaml_data,
        code_model=code_model,
        properties=[],
    )


def test_typed_dict_only_property():
    """is_typed_dict_only should be True when yaml_data has typedDictOnly=True or models-mode is typeddict."""
    code_model = _make_code_model(models_mode="typeddict")
    model = _make_typed_dict_only_model(code_model, "Foo")
    assert model.is_typed_dict_only is True

    # In typeddict mode, ALL models are typed-dict-only
    normal_model = _make_model(code_model, "Bar", model_cls=TypedDictModelType)
    assert normal_model.is_typed_dict_only is True

    # In dpg mode, only models with typedDictOnly=True are typed-dict-only
    dpg_code_model = _make_code_model(models_mode="dpg")
    dpg_normal = _make_model(dpg_code_model, "Baz", model_cls=TypedDictModelType)
    assert dpg_normal.is_typed_dict_only is False


def test_typed_dict_only_excluded_from_public_model_types():
    """Typed-dict-only models should not appear in public_model_types."""
    code_model = _make_code_model(models_mode="typeddict")
    normal = _make_model(code_model, "Normal", model_cls=TypedDictModelType)
    td_only = _make_typed_dict_only_model(code_model, "TdOnly")
    code_model.model_types = [normal, td_only]

    public = code_model.public_model_types
    # In typeddict mode, all models are typed-dict-only and excluded from public model types
    assert normal not in public
    assert td_only not in public


def test_typed_dict_only_still_in_types_file():
    """Typed-dict-only models should still appear in types.py as TypedDicts."""
    code_model = _make_code_model(models_mode="typeddict")
    td_only = _make_typed_dict_only_model(code_model, "MyModel")
    code_model.model_types = [td_only]

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[td_only])
    output = ts.serialize()
    assert "class MyModel(TypedDict, total=False):" in output


def test_typed_dict_only_type_annotation():
    """Typed-dict-only models should use the types module alias, not _models."""
    code_model = _make_code_model(models_mode="typeddict")
    model = _make_typed_dict_only_model(code_model, "Foo")

    # In operation files, the types module is imported as ``types as _types``,
    # so the annotation references the ``_types`` alias.
    annotation = model.type_annotation(is_operation_file=True)
    assert annotation == "_types.Foo"
    assert "_models" not in annotation


def test_typed_dict_only_docstring_type():
    """Typed-dict-only models should reference types module, not models."""
    code_model = _make_code_model(models_mode="typeddict")
    model = _make_typed_dict_only_model(code_model, "Foo")

    docstring = model.docstring_type()
    assert "types.Foo" in docstring
    assert "models.Foo" not in docstring


# ---------- constant enum value (EnumValue) annotation & imports ----------


def _make_enum_value(code_model, enum_name="Color", member_name="RED", value="red"):
    """Build a single constant EnumValue attached to code_model."""
    value_type_yaml = {"type": "string"}
    enum_yaml = {
        "type": "enum",
        "name": enum_name,
        "valueType": value_type_yaml,
        "values": [],
    }
    enum_value_yaml = {
        "type": "enumvalue",
        "name": member_name,
        "value": value,
        "enumType": enum_yaml,
        "valueType": value_type_yaml,
    }
    return build_type(enum_value_yaml, code_model)


def _local_import_modules(file_import):
    """Collect all LOCAL import module names from a FileImport."""
    modules = set()
    for section in file_import.to_dict().values():
        modules.update(section.get(ImportType.LOCAL, {}).keys())
    return modules


def test_enum_value_dpg_annotation_uses_enum_member():
    """In dpg mode a constant enum value annotates as ``Literal[Color.RED]``."""
    code_model = _make_code_model(models_mode="dpg")
    enum_value = _make_enum_value(code_model)
    assert enum_value.type_annotation() == "Literal[Color.RED]"


def test_enum_value_typeddict_annotation_uses_literal_value():
    """In typeddict mode a constant enum value annotates with its literal value.

    Enums are ``Literal`` aliases in types.py with no member attributes, so the
    annotation must be ``Literal["red"]`` rather than ``Literal[Color.RED]``.
    """
    code_model = _make_code_model(models_mode="typeddict")
    enum_value = _make_enum_value(code_model)
    assert enum_value.type_annotation() == 'Literal["red"]'


def test_enum_value_typeddict_does_not_import_enums_module():
    """In typeddict mode ``_enums.py`` is never generated, so no import of it."""
    code_model = _make_code_model(models_mode="typeddict")
    enum_value = _make_enum_value(code_model)
    modules = _local_import_modules(enum_value.imports())
    assert not any("_enums" in module for module in modules)


def test_enum_value_dpg_imports_enums_module():
    """In dpg mode a constant enum value imports the enum from ``_enums.py``."""
    code_model = _make_code_model(models_mode="dpg")
    enum_value = _make_enum_value(code_model)
    modules = _local_import_modules(enum_value.imports())
    assert any("_enums" in module for module in modules)


# ---------- builtin-shadowing qualification (Literal-value false positives) ----------


def _make_required_property(code_model, name, prop_type):
    """Create a required Property named ``name`` whose type is ``prop_type``."""
    return Property(
        yaml_data={"wireName": name, "clientName": name, "optional": False},
        code_model=code_model,
        type=prop_type,
    )


def test_qualify_shadowed_builtins_ignores_literal_value():
    """A builtin name that only appears inside a ``Literal[...]`` value must not be rewritten."""
    # ``type`` is a builtin, but here it is a literal string value, not a type reference.
    assert _qualify_shadowed_builtins('Required[Literal["type"]]', frozenset({"type"})) == 'Required[Literal["type"]]'


def test_qualify_shadowed_builtins_ignores_quoted_forward_reference():
    """A builtin name inside a quoted forward reference must not be rewritten."""
    assert _qualify_shadowed_builtins('list["type"]', frozenset({"type"})) == 'list["type"]'


def test_qualify_shadowed_builtins_rewrites_genuine_bare_reference():
    """A genuine bare builtin type reference is qualified as ``builtins.X``."""
    assert _qualify_shadowed_builtins("bytes", frozenset({"bytes"})) == "builtins.bytes"
    # Only the bare reference is rewritten; the quoted forward reference is left untouched.
    assert _qualify_shadowed_builtins('Union["Model", bytes]', frozenset({"bytes"})) == 'Union["Model", builtins.bytes]'


def test_qualify_shadowed_builtins_skips_already_dotted_names():
    """An already-qualified ``builtins.X`` reference must not be double-qualified."""
    assert _qualify_shadowed_builtins("builtins.bytes", frozenset({"bytes"})) == "builtins.bytes"


def test_qualify_shadowed_builtins_mixes_real_and_literal():
    """Within one annotation, a real reference is rewritten while a Literal value is preserved."""
    assert (
        _qualify_shadowed_builtins('dict[str, Literal["type"]]', frozenset({"type", "str"}))
        == 'dict[builtins.str, Literal["type"]]'
    )


def test_literal_value_matching_builtin_not_detected_as_shadowed():
    """A ``Literal["type"]`` value must not make ``type`` count as a shadowed builtin.

    Regression: ``TypeParam`` has a ``type: Literal["type"]`` field and no sibling annotated
    with the bare builtin ``type``, so no shadowing occurs.
    """
    code_model = _make_code_model(models_mode="typeddict")
    const = build_type({"type": "constant", "value": "type", "valueType": {"type": "string"}}, code_model)
    text = build_type({"type": "string"}, code_model)
    model = TypedDictModelType(
        yaml_data={"name": "TypeParam", "type": "model", "snakeCaseName": "typeparam", "usage": 2},
        code_model=code_model,
        properties=[
            _make_required_property(code_model, "type", const),
            _make_required_property(code_model, "text", text),
        ],
    )
    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[model])
    assert ts.get_shadowed_builtins(model) == frozenset()


def test_literal_value_false_positive_no_builtins_import_and_value_preserved():
    """The reported bug: ``Literal["type"]`` must stay intact and no ``import builtins`` is added."""
    code_model = _make_code_model(models_mode="typeddict")
    const = build_type({"type": "constant", "value": "type", "valueType": {"type": "string"}}, code_model)
    text = build_type({"type": "string"}, code_model)
    model = TypedDictModelType(
        yaml_data={"name": "TypeParam", "type": "model", "snakeCaseName": "typeparam", "usage": 2},
        code_model=code_model,
        properties=[
            _make_required_property(code_model, "type", const),
            _make_required_property(code_model, "text", text),
        ],
    )
    code_model.model_types = [model]

    env = _make_env()
    output = TypesSerializer(code_model=code_model, env=env, models=[model]).serialize()
    assert 'Literal["type"]' in output
    assert "builtins.type" not in output
    assert "import builtins" not in output


def test_genuine_sibling_builtin_is_detected_and_qualified():
    """A field whose wire name shadows a builtin used bare by a sibling annotation must qualify.

    ``Numbers`` has ``int: str`` (wire name ``int``) and ``count: int``. The bare ``int`` in
    ``count`` is emitted as-is in the types file, so pyright would resolve it to the earlier
    field; it must be qualified as ``builtins.int``.
    """
    code_model = _make_code_model(models_mode="typeddict")
    str_type = build_type({"type": "string"}, code_model)
    int_type = build_type({"type": "integer"}, code_model)
    model = TypedDictModelType(
        yaml_data={"name": "Numbers", "type": "model", "snakeCaseName": "numbers", "usage": 2},
        code_model=code_model,
        properties=[
            _make_required_property(code_model, "int", str_type),
            _make_required_property(code_model, "count", int_type),
        ],
    )
    code_model.model_types = [model]

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[model])
    assert ts.get_shadowed_builtins(model) == frozenset({"int"})

    output = ts.serialize()
    assert "import builtins" in output
    assert "count: Required[builtins.int]" in output


def test_type_changing_under_types_file_does_not_cause_spurious_builtins_import():
    """Detection must use the emitted annotation: a ``bytes`` field renders as ``str`` in types.py.

    ``Blob`` has ``bytes: int`` (wire name ``bytes``) and ``content: bytes``. In the types file a
    bytes type is emitted as ``str``, so nothing genuinely references the bare builtin ``bytes``
    and no ``import builtins`` should be added.
    """
    code_model = _make_code_model(models_mode="typeddict")
    int_type = build_type({"type": "integer"}, code_model)
    bytes_type = build_type({"type": "bytes", "encode": "base64"}, code_model)
    model = TypedDictModelType(
        yaml_data={"name": "Blob", "type": "model", "snakeCaseName": "blob", "usage": 2},
        code_model=code_model,
        properties=[
            _make_required_property(code_model, "bytes", int_type),
            _make_required_property(code_model, "content", bytes_type),
        ],
    )
    code_model.model_types = [model]

    env = _make_env()
    ts = TypesSerializer(code_model=code_model, env=env, models=[model])
    assert ts.get_shadowed_builtins(model) == frozenset()

    output = ts.serialize()
    assert "import builtins" not in output
