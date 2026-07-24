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


def _plugin(models_mode: str, **kwargs) -> PreProcessPlugin:
    return PreProcessPlugin(
        output_folder="",
        **{
            "version-tolerant": True,
            "models-mode": models_mode,
            "generate-typeddict": True,
            "tsp_file": True,
            "show-operations": True,
            "show-send-request": True,
            "builders-visibility": "public",
            **kwargs,
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


def test_dpg_mode_can_disable_typeddict_autogeneration():
    """Opting out keeps the dpg model + binary overloads, but skips typeddict generation."""
    plugin = _plugin("dpg", **{"generate-typeddict": False})
    code_model, yaml_data, model_type = _json_model_operation()
    body_parameter = yaml_data["bodyParameter"]

    plugin.add_body_param_type(code_model, body_parameter)
    add_overloads_for_body_param(yaml_data)

    assert body_parameter["type"]["type"] == "combined"
    assert body_parameter["type"]["types"] == [model_type, {"type": "binary"}]
    assert len(yaml_data["overloads"]) == 2
    assert not any(t for t in code_model["types"] if t.get("base") == "typeddict")


def test_spread_body_opt_out_keeps_json_overload():
    """Spread bodies keep the flattened JSON overload when TypedDict generation is disabled."""
    plugin = _plugin("dpg", **{"generate-typeddict": False})
    spread_body = _json_spread_body_parameter("CreateRequest", "Contoso.Widget")
    yaml_data = {
        "name": "create",
        "bodyParameter": spread_body,
        "parameters": [_content_type_param()],
        "overloads": [],
        "responses": [],
        "exceptions": [],
    }
    code_model = {"types": [spread_body["type"]]}

    plugin.add_body_param_type(code_model, spread_body)
    add_overloads_for_body_param(yaml_data)

    assert spread_body["type"]["type"] == "combined"
    assert spread_body["type"]["types"][0]["base"] == "json"
    assert spread_body["type"]["types"][1] == {"type": "binary"}
    assert len(yaml_data["overloads"]) == 2
    json_overload = next(o for o in yaml_data["overloads"] if o["bodyParameter"]["type"].get("base") == "json")
    assert json_overload["bodyParameter"]["flattened"] is True
    assert not any(t for t in code_model["types"] if t.get("base") == "typeddict")


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


def test_dpg_mode_same_model_reused_across_operations_shares_one_copy():
    """Regression guard for the intended deduplication: one model used in two bodies shares a single copy."""
    plugin = _plugin("dpg")
    clid = "Contoso.Widget"
    first_body = _dpg_body_parameter("Widget", clid)
    second_body = _dpg_body_parameter("Widget", clid)
    code_model = {"types": [first_body["type"]]}

    plugin.add_body_param_type(code_model, first_body)
    plugin.add_body_param_type(code_model, second_body)

    typeddict_copies = [t for t in code_model["types"] if t.get("type") == "model" and t.get("base") == "typeddict"]
    assert [t["name"] for t in typeddict_copies] == ["Widget"]
    # Both operations reference the very same copy object.
    assert first_body["type"]["types"][1] is second_body["type"]["types"][1]


def _dpg_list_body_parameter(name: str, cross_lang_id: str) -> dict:
    """A JSON list body whose element is a dpg model with the given name and cross-language id."""
    element_type = {
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
        "type": {"type": "list", "elementType": element_type},
    }


def test_dpg_list_body_shared_cross_language_id_creates_distinct_element_copies():
    """List-body element models that share a template clid must each get their own typeddict copy."""
    plugin = _plugin("dpg")
    clid = "Azure.ResourceManager.Foundations.ResourceUpdateModel"
    cache_body = _dpg_list_body_parameter("CacheUpdate", clid)
    volume_body = _dpg_list_body_parameter("VolumeUpdate", clid)
    code_model = {"types": [cache_body["type"]["elementType"], volume_body["type"]["elementType"]]}

    plugin.add_body_param_type(code_model, cache_body)
    plugin.add_body_param_type(code_model, volume_body)

    typeddict_copies = [t for t in code_model["types"] if t.get("type") == "model" and t.get("base") == "typeddict"]
    assert sorted(t["name"] for t in typeddict_copies) == ["CacheUpdate", "VolumeUpdate"]
    # The inserted list overload's element references the matching model, not a shared/wrong one.
    assert cache_body["type"]["types"][1]["elementType"]["name"] == "CacheUpdate"
    assert volume_body["type"]["types"][1]["elementType"]["name"] == "VolumeUpdate"


def _json_spread_body_parameter(name: str, cross_lang_id: str) -> dict:
    """A spread (base='json') body parameter, as the emitter emits for spread request bodies."""
    model_type = {
        "type": "model",
        "base": "json",
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


def test_spread_body_reuses_single_underlying_model():
    """A spread body with exactly one same-clid original reuses that original's TypedDict."""
    plugin = _plugin("dpg")
    clid = "Contoso.Widget"
    widget = _dpg_body_parameter("Widget", clid)["type"]
    # Emitter renames a shared spread body clone to ``<Method>Request`` but keeps the clid.
    create_body = _json_spread_body_parameter("CreateRequest", clid)
    code_model = {"types": [widget, create_body["type"]]}

    plugin.add_body_param_type(code_model, create_body)

    inserted = create_body["type"]["types"][1]
    # Unambiguous single original -> reference the real model's TypedDict.
    assert inserted["name"] == "Widget"
    assert inserted["base"] == "typeddict"


def test_spread_body_matches_original_by_name_not_first_clid_sibling():
    """When siblings share a clid, a non-renamed spread body must match the SAME-named original."""
    plugin = _plugin("dpg")
    clid = "Azure.ResourceManager.Foundations.ResourceUpdateModel"
    gadget = _dpg_body_parameter("Gadget", clid)["type"]
    widget = _dpg_body_parameter("Widget", clid)["type"]
    widget_spread = _json_spread_body_parameter("Widget", clid)
    # ``Gadget`` is listed first on purpose: a clid-only lookup would wrongly pick it.
    code_model = {"types": [gadget, widget, widget_spread["type"]]}

    plugin.add_body_param_type(code_model, widget_spread)

    inserted = widget_spread["type"]["types"][1]
    assert inserted["name"] == "Widget"


def test_spread_body_shared_clid_renamed_clones_avoid_cross_reference():
    """Ambiguous same-clid siblings: renamed spread clones must NOT reference the wrong model.

    Both spread bodies are renamed clones (``<Method>Request``) of distinct template instantiations
    that share the template clid. Since neither renamed name matches an original and multiple
    originals share the clid, the choice is ambiguous. Rather than pick the wrong original (the
    pre-fix bug produced a dangling ``_types.CacheUpdate`` in the volume operation), each body falls
    back to its own uniquely-named TypedDict.
    """
    plugin = _plugin("dpg")
    clid = "Azure.ResourceManager.Foundations.ResourceUpdateModel"
    cache = _dpg_body_parameter("CacheUpdate", clid)["type"]
    volume = _dpg_body_parameter("VolumeUpdate", clid)["type"]
    cache_body = _json_spread_body_parameter("CacheUpdateRequest", clid)
    volume_body = _json_spread_body_parameter("VolumeUpdateRequest", clid)
    code_model = {"types": [cache, volume, cache_body["type"], volume_body["type"]]}

    plugin.add_body_param_type(code_model, cache_body)
    plugin.add_body_param_type(code_model, volume_body)

    cache_td = cache_body["type"]["types"][1]
    volume_td = volume_body["type"]["types"][1]
    # No cross-reference: the volume operation must not reference CacheUpdate.
    assert cache_td["name"] == "CacheUpdateRequest"
    assert volume_td["name"] == "VolumeUpdateRequest"
    assert volume_td["name"] != "CacheUpdate"
    assert cache_td is not volume_td
