# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for body-parameter overload generation in ``models-mode=typeddict``.

In typeddict-only mode the binary (``IO[bytes]``) overload is intentionally
skipped and the model/JSON overloads collapse into a single TypedDict variant.
That left a lone ``@overload`` on the generated method, which mypy rejects with
``Single overload definition, multiple required``.  The preprocess plugin must
instead keep the body as a plain single type so no ``@overload`` is emitted.
"""
from pygen.preprocess import PreProcessPlugin, add_overloads_for_body_param


def _plugin(models_mode: str) -> PreProcessPlugin:
    return PreProcessPlugin(
        output_folder="",
        **{
            "version-tolerant": True,
            "models-mode": models_mode,
            "tsp_file": True,
            "show-operations": True,
            "show-send-request": True,
            "builders-visibility": "public",
        },
    )


def _content_type_param() -> dict:
    return {
        "wireName": "Content-Type",
        "clientName": "content_type",
        "location": "header",
        "optional": True,
        "implementation": "Method",
        "inOverload": False,
        "inDocstring": True,
        "type": {"type": "string"},
    }


def _json_model_operation() -> tuple[dict, dict, dict]:
    """A single JSON-body operation whose body is a (dpg) model."""
    model_type = {
        "type": "model",
        "base": "dpg",
        "name": "InputRecord",
        "crossLanguageDefinitionId": "Type.Model.Usage.InputRecord",
        "properties": [],
    }
    body_parameter = {
        "wireName": "input",
        "clientName": "input",
        "location": "body",
        "optional": False,
        "implementation": "Method",
        "contentTypes": ["application/json"],
        "type": model_type,
    }
    yaml_data = {
        "name": "input",
        "bodyParameter": body_parameter,
        "parameters": [_content_type_param()],
        "overloads": [],
        "responses": [],
        "exceptions": [],
    }
    code_model = {"types": [model_type]}
    return code_model, yaml_data, model_type


def test_typeddict_only_single_body_emits_no_overload():
    """A lone TypedDict body variant must NOT produce a single ``@overload``."""
    plugin = _plugin("typeddict")
    code_model, yaml_data, model_type = _json_model_operation()
    body_parameter = yaml_data["bodyParameter"]

    plugin.add_body_param_type(code_model, body_parameter)
    add_overloads_for_body_param(yaml_data)

    # A single overload is illegal for mypy; we expect none at all.
    assert len(yaml_data["overloads"]) == 0
    # The body stays a plain single type rather than a one-member combined type.
    assert body_parameter["type"] is model_type
    assert body_parameter["type"]["type"] == "model"


def test_dpg_mode_still_emits_multiple_overloads():
    """Regression guard: dpg mode keeps its binary + typeddict overloads."""
    plugin = _plugin("dpg")
    code_model, yaml_data, _ = _json_model_operation()
    body_parameter = yaml_data["bodyParameter"]

    plugin.add_body_param_type(code_model, body_parameter)
    add_overloads_for_body_param(yaml_data)

    # dpg mode adds at least the binary overload alongside the model, so the
    # combined type has multiple members and overloads are generated.
    assert body_parameter["type"]["type"] == "combined"
    assert len(yaml_data["overloads"]) >= 2


def _dpg_body_parameter(name: str, cross_lang_id: str) -> dict:
    """A JSON dpg-model body parameter for the given model name and cross-language id."""
    model_type = {
        "type": "model",
        "base": "dpg",
        "name": name,
        "crossLanguageDefinitionId": cross_lang_id,
        "properties": [],
    }
    return {
        "wireName": "body",
        "clientName": "body",
        "location": "body",
        "optional": False,
        "implementation": "Method",
        "contentTypes": ["application/json"],
        "type": model_type,
    }


def test_dpg_mode_shared_cross_language_id_creates_distinct_typeddict_copies():
    """Distinct models sharing a template cross-language id get their own typeddict copy.

    Template-instantiated models (e.g. ``ResourceUpdateModel<Cache, ...>`` and
    ``ResourceUpdateModel<Volume, ...>``) share the template's crossLanguageDefinitionId but have
    different names. ``_find_existing_typeddict`` must match on name as well, otherwise the second
    model reuses the first model's typeddict copy and its operation references the wrong type.
    """
    plugin = _plugin("dpg")
    clid = "Azure.ResourceManager.Foundations.ResourceUpdateModel"
    cache_body = _dpg_body_parameter("CacheUpdate", clid)
    volume_body = _dpg_body_parameter("VolumeUpdate", clid)
    code_model = {"types": [cache_body["type"], volume_body["type"]]}

    plugin.add_body_param_type(code_model, cache_body)
    plugin.add_body_param_type(code_model, volume_body)

    typeddict_copies = [t for t in code_model["types"] if t.get("type") == "model" and t.get("base") == "typeddict"]
    # Two distinct copies, one per model name.
    assert sorted(t["name"] for t in typeddict_copies) == [
        "CacheUpdate",
        "VolumeUpdate",
    ]
    # Each operation's typeddict overload references its OWN model, not a shared/wrong one.
    cache_td = cache_body["type"]["types"][1]
    volume_td = volume_body["type"]["types"][1]
    assert cache_td["name"] == "CacheUpdate"
    assert volume_td["name"] == "VolumeUpdate"
    assert cache_td is not volume_td
