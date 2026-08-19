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


@pytest.mark.parametrize(
    "has_structured_stream,async_mode",
    [
        (False, False),
        (False, True),
        (True, False),
        (True, True),
    ],
)
def test_does_not_export_stream_types(has_structured_stream, async_mode):
    # Stream / AsyncStream are an internal implementation detail (vendored in
    # _utils/streaming_base.py) and must never be part of the generated package's
    # public API -- even when a structured stream is present in the sync base
    # namespace. This guards against reintroducing a public export that would
    # become a breaking change once the runtime moves to the core library.
    init_file = _render_init(has_structured_stream=has_structured_stream, async_mode=async_mode)

    # No public export of the streaming types -- neither an import line nor an
    # __all__ entry, regardless of quote style.
    assert "streaming_base" not in init_file
    assert "AsyncStream" not in init_file
    assert "Stream" not in init_file
    # Sanity check: the client itself is still imported/exported as normal.
    assert "from ._client import SampleClient" in init_file
