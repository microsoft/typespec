# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for the IO overload added to binary ``bytes`` bodies.

TypeSpec ``bytes`` used with a binary content type (e.g. application/octet-stream
or a custom media type) is emitted as ``bytes``. To keep backward compatibility for
services migrating from swagger, whose binary bodies were typed as ``IO``, the
preprocess plugin adds an ``IO[bytes]`` overload alongside the ``bytes`` one.
"""
from pygen.preprocess import PreProcessPlugin, add_overloads_for_body_param


def _plugin(models_mode: str = "dpg") -> PreProcessPlugin:
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


def _bytes_body_operation(content_types: list) -> tuple[dict, dict]:
    body_parameter = {
        "wireName": "value",
        "clientName": "value",
        "location": "body",
        "optional": False,
        "implementation": "Method",
        "contentTypes": content_types,
        "type": {"type": "bytes"},
    }
    yaml_data = {
        "name": "upload",
        "bodyParameter": body_parameter,
        "parameters": [_content_type_param()],
        "overloads": [],
        "responses": [],
        "exceptions": [],
    }
    code_model = {"types": []}
    return code_model, yaml_data


def test_binary_bytes_body_adds_io_overload():
    """A binary ``bytes`` body gets a combined ``bytes``/``IO[bytes]`` type with two overloads."""
    plugin = _plugin()
    code_model, yaml_data = _bytes_body_operation(["application/octet-stream"])
    body_parameter = yaml_data["bodyParameter"]

    plugin.add_body_param_type(code_model, body_parameter)
    add_overloads_for_body_param(yaml_data)

    assert body_parameter["type"]["type"] == "combined"
    member_types = [t["type"] for t in body_parameter["type"]["types"]]
    assert member_types == ["bytes", "binary"]
    assert len(yaml_data["overloads"]) == 2


def test_json_bytes_body_stays_plain_bytes():
    """A ``bytes`` body with a JSON content type stays a plain ``bytes`` type (no IO overload)."""
    plugin = _plugin()
    code_model, yaml_data = _bytes_body_operation(["application/json"])
    body_parameter = yaml_data["bodyParameter"]

    plugin.add_body_param_type(code_model, body_parameter)
    add_overloads_for_body_param(yaml_data)

    assert body_parameter["type"]["type"] == "bytes"
    assert len(yaml_data["overloads"]) == 0


def test_typeddict_mode_binary_bytes_body_stays_plain_bytes():
    """In typeddict-only mode the IO overload is skipped for binary ``bytes`` bodies."""
    plugin = _plugin("typeddict")
    code_model, yaml_data = _bytes_body_operation(["application/octet-stream"])
    body_parameter = yaml_data["bodyParameter"]

    plugin.add_body_param_type(code_model, body_parameter)
    add_overloads_for_body_param(yaml_data)

    assert body_parameter["type"]["type"] == "bytes"
    assert len(yaml_data["overloads"]) == 0
