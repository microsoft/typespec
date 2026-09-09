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
from jinja2 import Environment, FileSystemLoader


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
@pytest.mark.parametrize("location", ["enum", "member"])
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
        yaml_data={"description": description if location == "enum" else ""},
        values=[value],
        pylint_disable=lambda: "",
        value_type=SimpleNamespace(type_annotation=lambda **kwargs: "str", get_declaration=repr),
    )
    source = env.from_string('{% import "operation_tools.jinja2" as op_tools %}{% include "enum.py.jinja2" %}').render(
        enum=enum
    )
    # Formatting success alone does not prove that documentation stayed inside a string.
    source = black.format_str(source, mode=black.Mode())
    body = ast.parse(source).body[0].body
    assert len(body) == 2
    doc, assignment = body if location == "enum" else reversed(body)
    assert isinstance(assignment, ast.Assign)
    assert isinstance(doc, ast.Expr)
    assert isinstance(doc.value, ast.Constant)
    assert inspect.cleandoc(doc.value.value).strip() == description
