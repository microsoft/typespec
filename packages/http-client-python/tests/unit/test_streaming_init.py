# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from types import SimpleNamespace

import pytest
from jinja2 import Environment, PackageLoader

from pygen.codegen.serializers.general_serializer import GeneralSerializer


def _env() -> Environment:
    return Environment(
        loader=PackageLoader("pygen.codegen", "templates"),
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def _render_init(*, has_structured_stream: bool, async_mode: bool = False) -> str:
    code_model = SimpleNamespace(
        namespace="sample",
        license_header="",
        options={"package-version": None},
        need_streaming_base=has_structured_stream,
        get_serialize_namespace=lambda namespace, async_mode: f"{namespace}.aio" if async_mode else namespace,
        get_relative_import_path=lambda _namespace, module_name: f".{module_name}",
        is_top_namespace=lambda namespace: namespace == "sample",
    )
    client = SimpleNamespace(filename="_client", name="SampleClient")
    return GeneralSerializer(code_model=code_model, env=_env(), async_mode=async_mode).serialize_init_file([client])


def test_exports_stream_types_from_base_namespace():
    init_file = _render_init(has_structured_stream=True)

    assert "from ._utils.streaming_base import AsyncStream, Stream" in init_file
    assert '"AsyncStream",' in init_file
    assert '"Stream",' in init_file


@pytest.mark.parametrize(
    "has_structured_stream,async_mode",
    [
        (False, False),
        (True, True),
    ],
)
def test_does_not_export_stream_types_outside_structured_base_namespace(has_structured_stream, async_mode):
    init_file = _render_init(has_structured_stream=has_structured_stream, async_mode=async_mode)

    assert "streaming_base import" not in init_file
    assert '"AsyncStream",' not in init_file
    assert '"Stream",' not in init_file
