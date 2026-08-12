# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for ``CodeModel.get_relative_import_path``.

A structured (JSONL / SSE) streaming operation can reference a payload model
whose ``client_namespace`` shares no top-level package with the operation being
generated (for example an SSE event payload that TCGC reports under a ``search``
namespace while the package root is ``azure.search.documents``). Emitting a
relative import in that case climbs above the package root
(``from .......search import models``), which Python rejects at runtime with
``attempted relative import beyond top-level package``. The generator must fall
back to a valid absolute import instead. In-package imports must stay relative
(byte-identical to before).
"""

import pytest

from pygen.codegen.models import CodeModel


def _code_model() -> CodeModel:
    return CodeModel(
        {
            "clients": [
                {
                    "name": "client",
                    "namespace": "azure.search.documents",
                    "moduleName": "azure.search.documents",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
            "namespace": "azure.search.documents",
        },
        options={
            "show-send-request": True,
            "builders-visibility": "public",
            "show-operations": True,
            "models-mode": "dpg",
            "only-path-and-body-params-positional": True,
        },
    )


@pytest.mark.parametrize(
    "serialize_namespace,imported_namespace,expected",
    [
        # In-package: shares a top-level package -> relative import (unchanged).
        ("azure.test.operations", "azure.test", ".."),
        ("azure.test.operations", "azure", "..."),
        ("azure.test.subtest.aio.operations", "azure.test", "...."),
        ("azure.search.documents.operations", "azure.search.documents", ".."),
    ],
)
def test_in_package_stays_relative(serialize_namespace, imported_namespace, expected):
    assert _code_model().get_relative_import_path(serialize_namespace, imported_namespace) == expected


@pytest.mark.parametrize(
    "serialize_namespace,imported_namespace,expected",
    [
        # No shared top-level package -> valid absolute import (no leading dots).
        ("azure.search.documents.grp.aio.operations", "search", "search"),
        ("azure.search.documents.aio.operations", "search", "search"),
        ("search.aio.operations", "azure.search.documents", "azure.search.documents"),
    ],
)
def test_cross_root_uses_absolute_import(serialize_namespace, imported_namespace, expected):
    result = _code_model().get_relative_import_path(serialize_namespace, imported_namespace)
    assert result == expected
    assert not result.startswith("."), "cross-root import must be absolute, not a package-escaping relative import"


def test_cross_root_absolute_import_with_module_name():
    # The Stream / AsyncStream import points at ``<root>._utils.streaming_base``. When an
    # operation lives outside the package root, that import must also be absolute-valid.
    result = _code_model().get_relative_import_path(
        "search.aio.operations",
        "azure.search.documents",
        module_name="_utils.streaming_base",
    )
    assert result == "azure.search.documents._utils.streaming_base"


def test_in_package_module_name_stays_relative():
    result = _code_model().get_relative_import_path(
        "azure.search.documents.grp.aio.operations",
        "azure.search.documents",
        module_name="_utils.streaming_base",
    )
    assert result == "...._utils.streaming_base"
