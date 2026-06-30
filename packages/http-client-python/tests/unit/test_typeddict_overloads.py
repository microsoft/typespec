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
