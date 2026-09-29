# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Enum documentation must remain string literals in generated Python."""

import ast
import inspect
from pathlib import Path
from types import SimpleNamespace

import black
import pytest
from jinja2 import Environment, FileSystemLoader, PackageLoader

from pygen import OptionsDict
from pygen.codegen.models import CodeModel, build_type
from pygen.codegen.serializers.enum_serializer import EnumSerializer
from pygen.codegen.serializers.types_serializer import TypesSerializer


@pytest.mark.parametrize(
    "description",
    [
        "Ordinary documentation.",
        'A"""; print("This should remain documentation"); """B.',
        'Quotes: " and "" and """.',
        'Ends with a quote"',
        r'Quotes """ with a regex \W and a path C:\new\test.',
        'First paragraph.\n\nSecond paragraph with """ quotes.',
    ],
)
@pytest.mark.parametrize("location", ["enum", "member", "literal"])
def test_enum_docstrings_preserve_documentation(description, location):
    templates = Path(__file__).parents[2] / "generator/pygen/codegen/templates"
    env = Environment(loader=FileSystemLoader(templates), trim_blocks=True, lstrip_blocks=True)
    value = SimpleNamespace(
        name="FAST",
        value="fast",
        description=lambda **kwargs: description if location == "member" else "",
    )
    enum = SimpleNamespace(
        name="WidgetMode",
        yaml_data={"description": description if location in ("enum", "literal") else ""},
        values=[value],
        pylint_disable=lambda: "",
        value_type=SimpleNamespace(type_annotation=lambda **kwargs: "str", get_declaration=repr),
    )
    if location == "literal":
        source = env.get_template("types.py.jinja2").render(
            code_model=SimpleNamespace(license_header=""),
            imports="",
            literal_enums=[enum],
            models=[],
            discriminated_bases=[],
            serializer=SimpleNamespace(declare_literal_enum=lambda enum: f'{enum.name} = Literal["fast"]'),
        )
    else:
        source = env.from_string(
            '{% import "operation_tools.jinja2" as op_tools %}{% include "enum.py.jinja2" %}'
        ).render(enum=enum)
    # Formatting success alone does not prove that documentation stayed inside a string.
    source = black.format_str(source, mode=black.Mode())
    module = ast.parse(source)
    body = module.body if location == "literal" else module.body[0].body
    assert len(body) == 2
    doc, assignment = body if location == "enum" else reversed(body)
    assert isinstance(assignment, ast.Assign)
    assert isinstance(doc, ast.Expr)
    assert isinstance(doc.value, ast.Constant)
    assert inspect.cleandoc(doc.value.value).strip() == description


@pytest.mark.parametrize("typeddict_only", [False, True])
def test_enum_serializers_preserve_documentation(typeddict_only):
    description = 'Before """ after a path C:\\new.'
    member_description = 'Member """ documentation.'
    code_model = CodeModel(
        {
            "namespace": "sample",
            "clients": [
                {
                    "name": "client",
                    "namespace": "sample",
                    "moduleName": "sample",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
        },
        OptionsDict(
            {
                "models-mode": "none" if typeddict_only else "dpg",
                "generate-typeddict": typeddict_only,
                "flavor": "unbranded",
                "tsp_file": True,
            }
        ),
    )
    enum_yaml = {
        "type": "enum",
        "name": "WidgetMode",
        "description": description,
        "valueType": {"type": "string"},
        "values": [],
    }
    enum = build_type(enum_yaml, code_model)
    enum.values.append(
        build_type(
            {
                "type": "enumvalue",
                "name": "FAST",
                "value": "fast",
                "description": member_description,
                "enumType": enum_yaml,
                "valueType": {"type": "string"},
            },
            code_model,
        )
    )
    env = Environment(loader=PackageLoader("pygen.codegen", "templates"), trim_blocks=True, lstrip_blocks=True)
    serializer = (
        TypesSerializer(code_model, env, enums=[enum])
        if typeddict_only
        else EnumSerializer(code_model, env, enums=[enum])
    )

    source = black.format_str(serializer.serialize(), mode=black.Mode())
    module = ast.parse(source)
    docstrings = [
        inspect.cleandoc(node.value.value).strip()
        for node in ast.walk(module)
        if isinstance(node, ast.Expr) and isinstance(node.value, ast.Constant) and isinstance(node.value.value, str)
    ]
    assert docstrings == ([description] if typeddict_only else [description, member_description])
