# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for structured streaming (JSONL / SSE) response rendering.

Covers the code path where a streaming response (driven by the TCGC response
stream metadata, Azure flavor) is rendered as ``Stream[T]`` / ``AsyncStream[T]``
from the vendored ``_utils.streaming_base`` module instead of the raw
byte-iterator behavior.
"""

import pytest

from pygen.codegen.models import CodeModel, JSONModelType
from pygen.codegen.models.response import Response


@pytest.fixture
def code_model():
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
            "models-mode": "dpg",
            "version-tolerant": True,
            "flavor": "azure",
        },
    )


def _register_model(code_model):
    item_yaml = {"type": "model", "name": "Thing", "snakeCaseName": "thing"}
    model_type = JSONModelType(item_yaml, code_model)
    code_model.types_map[id(item_yaml)] = model_type
    return item_yaml


def _streaming_response(code_model, kind):
    item_yaml = _register_model(code_model)
    return Response.from_yaml(
        {
            "statusCodes": [200],
            "headers": [],
            "type": None,
            "streaming": {"kind": kind, "itemType": item_yaml},
        },
        code_model,
    )


def test_jsonl_response_is_structured_stream(code_model):
    response = _streaming_response(code_model, "jsonl")
    assert response.is_structured_stream is True
    assert response.streaming_kind == "jsonl"


def test_sse_response_is_structured_stream(code_model):
    response = _streaming_response(code_model, "sse")
    assert response.is_structured_stream is True
    assert response.streaming_kind == "sse"


def test_type_annotation_sync_and_async(code_model):
    response = _streaming_response(code_model, "jsonl")
    sync = response.type_annotation(async_mode=False)
    asynchronous = response.type_annotation(async_mode=True)
    assert sync.startswith("Stream[") and sync.endswith("]"), sync
    assert asynchronous.startswith("AsyncStream[") and asynchronous.endswith("]"), asynchronous


def test_docstring_type_references_streaming_base(code_model):
    response = _streaming_response(code_model, "jsonl")
    assert "~namespace._utils.streaming_base.Stream[" in response.docstring_type(async_mode=False)
    assert "~namespace._utils.streaming_base.AsyncStream[" in response.docstring_type(async_mode=True)


def test_imports_add_stream_class(code_model):
    response = _streaming_response(code_model, "jsonl")
    imports = response.imports(async_mode=False)
    imports_str = str(imports.to_dict())
    # Vendored local import, not azure.core.streaming.
    assert "streaming_base" in imports_str
    assert "azure.core.streaming" not in imports_str


def test_sse_imports_add_json(code_model):
    response = _streaming_response(code_model, "sse")
    imports = response.imports(async_mode=False)
    assert "json" in str(imports.to_dict())


def test_non_streaming_response_is_not_structured_stream(code_model):
    item_yaml = _register_model(code_model)
    response = Response.from_yaml(
        {"statusCodes": [200], "headers": [], "type": item_yaml},
        code_model,
    )
    assert response.is_structured_stream is False
    assert response.streaming_kind is None


def test_streaming_base_template_renders_vendored_runtime():
    """The vendored ``streaming_base.py`` template renders the Stream/AsyncStream runtime."""
    from jinja2 import Environment, PackageLoader

    from pygen.codegen.serializers.general_serializer import GeneralSerializer

    cm = CodeModel(
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
            "models-mode": "dpg",
            "version-tolerant": True,
            "flavor": "azure",
        },
    )
    env = Environment(
        loader=PackageLoader("pygen.codegen", "templates"),
        keep_trailing_newline=True,
        line_statement_prefix="##",
        line_comment_prefix="###",
        trim_blocks=True,
        lstrip_blocks=True,
    )
    rendered = GeneralSerializer(code_model=cm, env=env, async_mode=False).serialize_streaming_base_file()
    # Vendored runtime is self-contained: depends only on azure.core.rest, not azure.core.streaming.
    assert "class Stream(" in rendered
    assert "class AsyncStream(" in rendered
    assert "from azure.core.rest import" in rendered
    assert "import azure.core.streaming" not in rendered
    assert "from azure.core.streaming" not in rendered


def test_need_streaming_base_flag(code_model):
    """need_streaming_base tracks has_structured_stream (no operations -> False)."""
    # No operations registered in this fixture, so no structured stream is present.
    assert code_model.has_structured_stream is False
    assert code_model.need_streaming_base is False
