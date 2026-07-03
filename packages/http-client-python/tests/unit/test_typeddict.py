# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

"""Tests for TypedDict generation, unions generation, and models-mode interactions."""

from jinja2 import PackageLoader, Environment

from pygen.codegen.models import CodeModel, JSONModelType, DPGModelType
from pygen.codegen.models.model_type import TypedDictModelType
from pygen.codegen.serializers.types_serializer import TypesSerializer
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
