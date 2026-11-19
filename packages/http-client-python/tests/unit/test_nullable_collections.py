# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

import pytest
from jinja2 import Environment, PackageLoader

from pygen.codegen.models import CodeModel, Property, build_type
from pygen.codegen.models.utils import NamespaceType
from pygen.codegen.serializers.import_serializer import FileImportSerializer
from pygen.codegen.serializers.model_serializer import DpgModelSerializer
from pygen.codegen.serializers.types_serializer import TypesSerializer


@pytest.fixture
def code_model():
    return CodeModel(
        {
            "clients": [
                {
                    "name": "client",
                    "namespace": "example",
                    "moduleName": "example",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
            "namespace": "example",
        },
        options={
            "show-send-request": True,
            "builders-visibility": "public",
            "show-operations": True,
            "models-mode": "dpg",
            "version-tolerant": True,
            "flavor": "unbranded",
            "client-side-validation": False,
            "keep-setup-py": False,
            "basic-setup-py": False,
            "no-namespace-folders": False,
            "generation-subdir": None,
        },
    )


@pytest.mark.parametrize("kind, expected", [("list", "list[Optional[str]]"), ("dict", "dict[str, Optional[str]]")])
def test_nullable_elements_in_annotations_and_docstrings(code_model, kind, expected):
    collection = build_type({"type": kind, "elementNullable": True, "elementType": {"type": "string"}}, code_model)

    assert collection.type_annotation() == expected
    assert collection.docstring_type() == expected
    assert "None" in collection.docstring_text()
    assert "from typing import Optional" in str(FileImportSerializer(collection.imports()))


@pytest.mark.parametrize(
    "kind, expected, wire_type", [("list", "list[str]", "[str]"), ("dict", "dict[str, str]", "{str}")]
)
def test_nonnullable_collections_and_serialization_remain_unchanged(code_model, kind, expected, wire_type):
    element = {"type": "string"}
    plain = build_type({"type": kind, "elementType": element}, code_model)
    nullable = build_type({"type": kind, "elementNullable": True, "elementType": element}, code_model)

    assert plain.type_annotation() == expected
    assert plain.element_type is nullable.element_type
    assert plain.serialization_type() == nullable.serialization_type() == wire_type
    assert "Optional" not in str(FileImportSerializer(plain.imports()))


@pytest.mark.parametrize("kind, container", [("list", "list[{}]"), ("dict", "dict[str, {}]")])
def test_nullable_model_elements_preserve_forward_references(code_model, kind, container):
    collection = build_type(
        {
            "type": kind,
            "elementNullable": True,
            "elementType": {
                "type": "model",
                "base": "dpg",
                "name": "Item",
                "snakeCaseName": "item",
                "properties": [],
            },
        },
        code_model,
    )

    assert collection.type_annotation() == container.format('Optional["_models.Item"]')
    assert collection.type_annotation(serialize_namespace_type=NamespaceType.TYPES_FILE) == container.format(
        'Optional["Item"]'
    )
    assert collection.docstring_type() == container.format("Optional[~example.models.Item]")


@pytest.mark.parametrize(
    "outer, outer_nullable, inner, expected, wire_type",
    [
        ("list", True, "list", "list[Optional[list[Optional[str]]]]", "[[str]]"),
        ("dict", True, "dict", "dict[str, Optional[dict[str, Optional[str]]]]", "{{str}}"),
        ("dict", False, "list", "dict[str, list[Optional[str]]]", "{[str]}"),
    ],
)
def test_nested_nullable_collections_render_in_models_and_typeddicts(
    code_model, outer, outer_nullable, inner, expected, wire_type
):
    collection = build_type(
        {
            "type": outer,
            "elementNullable": outer_nullable,
            "elementType": {"type": inner, "elementNullable": True, "elementType": {"type": "string"}},
        },
        code_model,
    )
    prop = Property({"wireName": "values", "clientName": "values", "optional": False}, code_model, type=collection)
    env = Environment(loader=PackageLoader("pygen.codegen", "templates"))
    model_serializer = DpgModelSerializer(code_model, env, models=[])
    types_serializer = TypesSerializer(code_model, env, models=[])

    assert model_serializer.declare_property(prop) == f"values: {expected} = rest_field()"
    assert types_serializer.declare_property(prop, frozenset()) == f"values: Required[{expected}]"
    assert collection.serialization_type() == wire_type
    assert "from typing import Optional" in str(FileImportSerializer(prop.imports()))
